import type { Metadata } from "next";
import HadithResultsPage from "@/components/hadith-results-page";

export const metadata: Metadata = { title: "Dua and Supplication | Waqt" };
export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <HadithResultsPage searchParams={searchParams} path="/dua" dua />;
}
