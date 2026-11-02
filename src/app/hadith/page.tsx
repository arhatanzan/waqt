import type { Metadata } from "next";
import { BookCatalogue } from "@/components/thaqalayn-library";

export const metadata: Metadata = { title: "Hadith Library | Waqt" };
export default function Page() { return <BookCatalogue />; }
