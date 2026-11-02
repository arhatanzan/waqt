import { describe, expect, it } from "vitest";
import SunCalc from "suncalc";
import { countdown, dateAtLocation, defaultPlace, defaultAdjustments, nextPrayer, prayerTimes } from "./prayer";

describe("original prayer calculation", () => {
  it("preserves every existing solar angle and safety buffer", () => {
    const day = dateAtLocation(new Date("2026-11-02T08:00:00Z"), defaultPlace.timezone);
    const original = SunCalc.getTimes(day, defaultPlace.latitude, defaultPlace.longitude);
    const times = prayerTimes(day, defaultPlace, defaultAdjustments);
    expect(times.map((p) => p.time.getTime())).toEqual([
      original.saherExact.getTime() + defaultAdjustments.saher * 60000,
      original.nightEnd.getTime() + defaultAdjustments.fajr * 60000,
      original.sunrise.getTime() + defaultAdjustments.sunrise * 60000,
      original.solarNoon.getTime() + defaultAdjustments.dhuhr * 60000,
      original.maghribEnd.getTime() + defaultAdjustments.maghrib * 60000,
    ]);
  });
  it("rolls the countdown over to tomorrow's Fajr, excluding sunrise and Saher", () => {
    const now = new Date("2026-11-02T18:00:00Z");
    const next = nextPrayer(now, defaultPlace, defaultAdjustments);
    expect(next.name).toBe("Fajr");
    expect(next.time.getTime()).toBeGreaterThan(now.getTime());
    const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: defaultPlace.timezone }).format(next.time);
    expect(localDate).toBe("2026-11-03");
  });
  it.each([
    ["Asia/Kolkata", 26.84, 80.94],
    ["Asia/Tokyo", 35.68, 139.69],
    ["America/New_York", 40.71, -74],
    ["Pacific/Honolulu", 21.3, -157.85],
    ["Pacific/Kiritimati", 1.87, -157.4],
  ])("calculates events on the selected local date in %s", (timezone, latitude, longitude) => {
    const now = new Date("2026-11-02T08:00:00Z");
    const place = { name: "Test", timezone, latitude, longitude };
    const format = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(date);
    const times = prayerTimes(dateAtLocation(now, timezone), place, defaultAdjustments);
    expect(format(times[3].time)).toBe(format(now));
  });
  it("does not invent polar-night solar events", () => {
    const place = { name: "Tromso", latitude: 69.65, longitude: 18.96, timezone: "Europe/Oslo" };
    const times = prayerTimes(dateAtLocation(new Date("2026-12-20T12:00:00Z"), place.timezone), place, defaultAdjustments);
    expect(Number.isNaN(times[2].time.getTime())).toBe(true);
  });
  it("formats exact countdown boundaries", () => {
    expect(countdown(3661000)).toBe("01:01:01");
    expect(countdown(-1000)).toBe("00:00:00");
    expect(countdown(1000)).toBe("00:00:01");
  });
});
