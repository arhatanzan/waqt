import { z } from "zod";
import { surahSchema, verseSchema } from "./models";

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
    const body: unknown = await response.json();
    const error = z.object({ error: z.string() }).safeParse(body);
    throw new Error(error.success ? error.data.error : `ThaqalaynAPI request failed (${response.status}). Please try again.`);
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
