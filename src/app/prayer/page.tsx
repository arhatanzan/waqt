import type { Metadata } from "next";
import AzanPlayer from "@/components/azan-player";
import PrayerDashboard from "@/components/prayer-dashboard";

export const metadata: Metadata = { title: "Prayer Times | Waqt" };
export default function Page() {
  return <><AzanPlayer /><PrayerDashboard /></>;
}
