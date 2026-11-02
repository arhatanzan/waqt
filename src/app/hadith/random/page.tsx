import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HadithReader from "@/components/hadith-reader";
import { validBookId } from "@/lib/api-path";

export const metadata: Metadata = { title: "Random Hadith | Waqt" };
export default async function Page({ searchParams }: { searchParams: Promise<{ book?: string }> }) {
  const { book } = await searchParams;
  if (book && !validBookId(book)) notFound();
  return <HadithReader key={book || "all"} bookId={book || undefined} />;
}
