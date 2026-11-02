import { notFound } from "next/navigation";
import { hadithQuerySchema } from "@/lib/thaqalayn";
import { validBookId } from "@/lib/api-path";
import { HadithResults } from "./thaqalayn-library";

export default async function HadithResultsPage({ searchParams, bookId, dua = false, path }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  bookId?: string;
  dua?: boolean;
  path: string;
}) {
  if (bookId && !validBookId(bookId)) notFound();
  const parsed = hadithQuerySchema.safeParse(await searchParams);
  if (!parsed.success) return <p className="notice" role="alert">Invalid search or page parameters. Use a positive page number, Arabic/English search language, and search text of at most 1000 characters.</p>;
  const { book, ...filters } = parsed.data;
  const selectedBook = bookId || book || undefined;
  if (selectedBook && !validBookId(selectedBook)) notFound();
  if (dua && filters.q === undefined) filters.q = "supplication|invocation|dua|دعاء";
  return <HadithResults key={JSON.stringify([path, filters, selectedBook])} path={path} filters={filters} bookId={selectedBook} dua={dua} />;
}
