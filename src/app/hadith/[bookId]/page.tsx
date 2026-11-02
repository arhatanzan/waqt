import type { Metadata } from "next";
import HadithResultsPage from "@/components/hadith-results-page";
import { hadithHref } from "@/lib/thaqalayn";

export async function generateMetadata({ params }: { params: Promise<{ bookId: string }> }): Promise<Metadata> {
  const { bookId } = await params;
  return { title: `${bookId.replaceAll("-", " ")} | Waqt` };
}

export default async function Page({ params, searchParams }: {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { bookId } = await params;
  return <HadithResultsPage bookId={bookId} searchParams={searchParams} path={hadithHref(bookId)} />;
}
