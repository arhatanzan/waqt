import type { Metadata } from "next";
import Quran from "@/components/quran";
import { verseKeySchema } from "@/lib/models";

export const metadata: Metadata = { title: "Quran | Waqt" };
export default async function Page({ searchParams }: { searchParams: Promise<{ ayah?: string }> }) {
  const { ayah } = await searchParams;
  const parsed = ayah === undefined ? undefined : verseKeySchema.safeParse(ayah);
  const initialAyah = parsed?.success ? parsed.data : undefined;
  return <>
    {parsed && !parsed.success && <p role="alert" className="notice">Invalid ayah reference. Showing the first surah.</p>}
    <Quran key={initialAyah || "default"} initialAyah={initialAyah} />
  </>;
}
