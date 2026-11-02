import type { Metadata } from "next";
import Hub from "@/components/hub";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waqt | A little closer, every day",
  description: "A peaceful space for prayer, Quran, the Thaqalayn hadith library, and personal reflections.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Hub>{children}</Hub></body></html>;
}
