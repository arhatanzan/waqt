import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HadithReader from "@/components/hadith-reader";
import { validBookId } from "@/lib/api-path";

export async function generateMetadata({ params }: { params: Promise<{ bookId: string; id: string }> }): Promise<Metadata> {
  const { bookId, id } = await params;
  return { title: `Hadith ${id} · ${bookId.replaceAll("-", " ")} | Waqt` };
}

export default async function Page({ params }: { params: Promise<{ bookId: string; id: string }> }) {
  const { bookId, id } = await params;
  if (!validBookId(bookId) || !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  return <HadithReader key={`${bookId}:${id}`} bookId={bookId} id={Number(id)} />;
}
