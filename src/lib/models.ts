import { z } from "zod";
import { validBookId } from "./api-path";

export const surahSchema = z.object({
  number: z.number().int().min(1).max(114),
  name_arabic: z.string(),
  name_english: z.string(),
  name_translation: z.string(),
  revelation_place: z.string(),
  verses_count: z.number(),
});
export const verseSchema = z.object({
  verse_key: z.string().regex(/^\d{1,3}:\d{1,3}$/),
  ayah: z.number(),
  arabic: z.string(),
  transliteration: z.string(),
  translations: z.record(z.string(), z.string()),
  audio: z.object({ ayah_audio: z.url() }).optional(),
});
export type Surah = z.infer<typeof surahSchema>;
export type Verse = z.infer<typeof verseSchema>;

export const verseKeySchema = z.string().refine((value) => {
  if (!/^\d{1,3}:\d{1,3}$/.test(value)) return false;
  const [surah, ayah] = value.split(":").map(Number);
  return surah >= 1 && surah <= 114 && ayah >= 1 && ayah <= 286;
}, "Invalid ayah reference");
export const librarySchema = z.object({
  version: z.literal(1),
  ayats: z.array(verseKeySchema),
  duas: z.array(z.number().int().positive()),
  hadiths: z.array(z.object({ bookId: z.string().refine(validBookId, "Invalid book reference"), id: z.number().int().positive() })).default([]),
  notes: z.record(verseKeySchema, z.object({
    text: z.string().max(20000),
    updatedAt: z.string().datetime(),
  })),
});
export type Library = z.infer<typeof librarySchema>;
export const emptyLibrary: Library = { version: 1, ayats: [], duas: [], hadiths: [], notes: {} };
