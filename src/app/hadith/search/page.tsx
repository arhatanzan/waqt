import type { Metadata } from "next";
import HadithResultsPage from "@/components/hadith-results-page";

export const metadata: Metadata = { title: "Search Hadiths | Waqt" };
export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <HadithResultsPage searchParams={searchParams} path="/hadith/search" />;
}
