import { z } from "zod";
import { duaSchema, surahSchema, verseSchema } from "./models";

export async function api<T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/ummah/${path}`, { signal });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error || `Request failed (${response.status}). Please try again.`);
  }
  const body: unknown = await response.json();
  const parsed = z.object({ success: z.literal(true), data: schema }).safeParse(body);
  if (!parsed.success) {
    console.error("Unexpected UmmahAPI response", path, parsed.error);
    throw new Error("The data provider returned an unexpected response. Please retry shortly.");
  }
  return parsed.data.data;
}

export async function thaqalaynApi<T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/thaqalayn/${path}`, { signal });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error || `Request failed (${response.status}). Please try again.`);
  }
  const body: unknown = await response.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error("Unexpected ThaqalaynAPI response", path, parsed.error);
    throw new Error("The data provider returned an unexpected response. Please retry shortly.");
  }
  return parsed.data;
}
export const getSurahs = (signal?: AbortSignal) =>
  api("quran/surahs", z.object({ surahs: z.array(surahSchema) }), signal);
export const getReading = (kind: "surah" | "juz", number: number, signal?: AbortSignal) =>
  api(`quran/${kind}/${number}`, z.object({ verses: z.array(verseSchema) }), signal);

// Try ThaqalaynAPI first for duas, fall back to UmmahAPI
export const getDuas = async (signal?: AbortSignal) => {
  try {
    // First, try to detect which API we're connected to
    // Make a request to UmmahAPI duas endpoint (the default)
    // If it fails, try ThaqalaynAPI
    
    const response = await fetch(`/api/ummah/duas`, { signal });
    if (!response.ok) {
      throw new Error("UmmahAPI request failed");
    }
    
    const body = await response.json();
    
    // Check if this looks like UmmahAPI response
    const ummahResponseSchema = z.object({
      success: z.literal(true),
      data: z.object({
        duas: z.array(duaSchema),
        categories: z.array(z.object({ id: z.string(), name: z.string() })),
      }),
    });
    
    const parsed = ummahResponseSchema.safeParse(body);
    
    if (parsed.success) {
      return parsed.data.data;
    }
    
    // If it doesn't look like UmmahAPI, try ThaqalaynAPI
    throw new Error("Response format not recognized as UmmahAPI");
  } catch (error) {
    try {
      // Fall back to ThaqalaynAPI
      const response = await fetch(`/api/thaqalayn/v2/allbooks`, { signal });
      
      if (!response.ok) {
        throw new Error("ThaqalaynAPI request failed");
      }
      
      const body = await response.json();
      
      // Check if this looks like ThaqalaynAPI response (array of books)
      const booksSchema = z.array(z.object({
        bookId: z.string(),
        BookName: z.string(),
        author: z.string(),
        idRangeMin: z.number(),
        idRangeMax: z.number(),
        bookDescription: z.string().optional(),
      }));
      
      const parsed = booksSchema.safeParse(body);
      
      if (parsed.success) {
        // Transform ThaqalaynAPI books to dua format
        const booksResponse = parsed.data;
        const duas = booksResponse.map((book, index) => ({
          id: index,
          category: book.bookId,
          title: `${book.BookName} - ${book.author}`,
          arabic: book.bookDescription || "",
          transliteration: book.BookName,
          translation: book.author,
          source: "ThaqalaynAPI",
          reference: null,
          authenticity_note: null,
        }));
        
        const categories = booksResponse.map(book => ({
          id: book.bookId,
          name: book.BookName,
        }));
        
        return { duas, categories };
      }
      
      throw new Error("Response format not recognized as ThaqalaynAPI");
    } catch (fallbackError) {
      console.error("Both API sources failed for duas", error, fallbackError);
      throw new Error("Could not load duas from any available source. Please try again.");
    }
  }
};


export const getTafsir = (key: string) => {
  const [surah, ayah] = key.split(":");
  return api(`tafsir/ibn_kathir/surah/${surah}/ayah/${ayah}`,
    z.object({ tafsir: z.object({ name: z.string(), text: z.string() }) }));
};
export const getAyahAudio = (key: string) => {
  const [surah, ayah] = key.split(":");
  return api(`quran/surah/${surah}/ayah/${ayah}`, z.object({
    audio: z.array(z.object({ reciter_id: z.number(), ayah_audio: z.url().nullable().optional() })),
  })).then((data) => data.audio.find((reciter) => reciter.reciter_id === 1)?.ayah_audio);
};
