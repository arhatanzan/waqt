import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waqt | A little closer, every day",
  description: "A peaceful space for prayer times, Quran reading, personal reflections, and daily duas.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
