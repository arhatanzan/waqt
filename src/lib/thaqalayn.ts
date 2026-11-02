import { z } from "zod";
import { thaqalaynApi } from "./api";

const optionalText = z.string().nullish();
export const bookSchema = z.object({
  bookId: z.string(),
  BookName: z.string(),
  author: z.string(),
  idRangeMin: z.number().int(),
  idRangeMax: z.number().int(),
  bookDescription: optionalText,
  bookCover: optionalText,
  englishName: optionalText,
  translator: optionalText,
  volume: z.number().nullish(),
});
const gradingSchema = z.object({
  author: z.object({ name_ar: optionalText, name_en: optionalText, link: optionalText, death_date: optionalText }).nullish(),
  grade_ar: optionalText,
  grade_en: optionalText,
  reference_en: optionalText,
});
export const hadithSchema = z.object({
  bookId: z.string(),
  id: z.number().int().positive(),
  book: z.string(),
  volume: z.number().nullish(),
  category: optionalText,
  categoryId: z.union([z.string(), z.number()]).nullish(),
  chapter: optionalText,
  chapterInCategoryId: z.number().nullish(),
  author: optionalText,
  translator: optionalText,
  englishText: optionalText,
  arabicText: optionalText,
  frenchText: optionalText,
  URL: optionalText,
  thaqalaynSanad: optionalText,
  thaqalaynMatn: optionalText,
  majlisiGrading: optionalText,
  behbudiGrading: optionalText,
  mohseniGrading: optionalText,
  gradingsFull: z.array(gradingSchema).nullish(),
});
export const hadithPageSchema = z.object({
  data: z.array(hadithSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});
export const ingredientSchema = z.object({
  ingredient: z.string(),
  statuses: z.array(z.string()).nullable(),
  info: z.array(z.string()).nullable(),
  otherNames: z.array(z.string()).nullable(),
  unknown: z.array(z.string()).nullable(),
});
export type Book = z.infer<typeof bookSchema>;
export type Hadith = z.infer<typeof hadithSchema>;
export type HadithPage = z.infer<typeof hadithPageSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export type HadithFilters = { q?: string; lang?: string; chapter?: string; category?: string; grading?: string; page?: string };
export const hadithQuerySchema = z.object({
  q: z.string().max(1000).optional(),
  lang: z.enum(["any", "en", "ar"]).optional(),
  chapter: z.string().max(1000).optional(),
  category: z.string().max(1000).optional(),
  grading: z.string().max(1000).optional(),
  page: z.string().regex(/^[1-9]\d*$/).refine((value) => Number.isSafeInteger(Number(value))).optional(),
  book: z.string().optional(),
});

export const getBooks = (signal?: AbortSignal) => thaqalaynApi("v2/allbooks", z.array(bookSchema), signal);
export const getIngredients = (signal?: AbortSignal) => thaqalaynApi("v2/ingredients", z.array(ingredientSchema), signal);
export const getHadith = (bookId: string, id: number, signal?: AbortSignal) =>
  thaqalaynApi(`v3/${encodeURIComponent(bookId)}/${id}`, hadithSchema, signal);
export const getRandomHadith = (bookId?: string, signal?: AbortSignal) =>
  thaqalaynApi(`v2/${bookId ? `${encodeURIComponent(bookId)}/` : ""}random`, hadithSchema, signal);
export function getHadiths(bookId: string | undefined, filters: HadithFilters, signal?: AbortSignal) {
  const q = filters.q?.trim();
  const search = Boolean(q);
  const query = new URLSearchParams({ page: filters.page || "1", limit: "20" });
  if (search) {
    query.set("q", q || "");
    if (filters.lang) query.set("lang", filters.lang);
  } else {
    for (const key of ["chapter", "category", "grading"] as const) {
      if (filters[key]?.trim()) query.set(key, filters[key].trim());
    }
  }
  const path = search ? `v3/query${bookId ? `/${encodeURIComponent(bookId)}` : ""}` : `v3/${encodeURIComponent(bookId || "")}`;
  return thaqalaynApi(`${path}?${query}`, hadithPageSchema, signal);
}
export function hadithHref(bookId: string, id?: number) {
  return `/hadith/${encodeURIComponent(bookId)}${id === undefined ? "" : `/${id}`}`;
}
export function pageHref(path: string, filters: HadithFilters, page: number, bookId?: string) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  if (bookId) query.set("book", bookId);
  query.set("page", String(page));
  return `${path}?${query}`;
}
export function safeSourceUrl(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : undefined;
  } catch { return undefined; }
}
