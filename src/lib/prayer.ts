import SunCalc from "suncalc";

declare module "suncalc" {
  interface GetTimesResult {
    saherExact: Date;
    maghribEnd: Date;
  }
}

SunCalc.addTime(-19, "saherExact", "saherEnd");
SunCalc.addTime(-4.5, "maghribExact", "maghribEnd");

export type Place = { name: string; latitude: number; longitude: number; timezone: string };
export type Prayer = { name: string; arabic: string; time: Date; prayer: boolean };
export type PrayerAdjustments = {
  saher: number;
  fajr: number;
  sunrise: number;
  dhuhr: number;
  maghrib: number;
};
export const defaultPlace: Place = { name: "Lucknow, India", latitude: 26.8467, longitude: 80.9462, timezone: "Asia/Kolkata" };
export const defaultAdjustments: PrayerAdjustments = {
  saher: -10,
  fajr: 0,
  sunrise: 1,
  dhuhr: -1,
  maghrib: -5,
};

export function dateAtLocation(now: Date, timezone: string, offset = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  const noon = Date.UTC(Number(part("year")), Number(part("month")) - 1, Number(part("day")) + offset, 12);
  let timestamp = noon;
  // Anchor SunCalc at the selected city's noon, including dates across the date line.
  for (let i = 0; i < 2; i++) {
    const zone = new Intl.DateTimeFormat("en", { timeZone: timezone, timeZoneName: "longOffset" })
      .formatToParts(new Date(timestamp)).find((p) => p.type === "timeZoneName")!.value;
    const match = zone.match(/GMT([+-])(\d{2}):(\d{2})/);
    const minutes = match ? (Number(match[2]) * 60 + Number(match[3])) * (match[1] === "+" ? 1 : -1) : 0;
    timestamp = noon - minutes * 60000;
  }
  return new Date(timestamp);
}
export function prayerTimes(day: Date, place: Place, adjustments: PrayerAdjustments = defaultAdjustments): Prayer[] {
  const times = SunCalc.getTimes(day, place.latitude, place.longitude);
  const shift = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60000);
  return [
    { name: "Saher ends", arabic: "السحر", time: shift(times.saherExact, adjustments.saher), prayer: false },
    { name: "Fajr", arabic: "الفجر", time: shift(times.nightEnd, adjustments.fajr), prayer: true },
    { name: "Sunrise", arabic: "الشروق", time: shift(times.sunrise, adjustments.sunrise), prayer: false },
    { name: "Dhuhr", arabic: "الظهر", time: shift(times.solarNoon, adjustments.dhuhr), prayer: true },
    { name: "Maghrib", arabic: "المغرب", time: shift(times.maghribEnd, adjustments.maghrib), prayer: true },
  ];
}
export function nextPrayer(now: Date, place: Place, adjustments: PrayerAdjustments = defaultAdjustments) {
  return [0, 1].flatMap((offset) => prayerTimes(dateAtLocation(now, place.timezone, offset), place, adjustments))
    .filter((p) => p.prayer && p.time > now)
    .sort((a, b) => a.time.getTime() - b.time.getTime())[0];
}
export function countdown(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((value) => String(value).padStart(2, "0")).join(":");
}
