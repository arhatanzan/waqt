"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowRight, BookOpen, Check, ChevronRight, Compass, Heart, LocateFixed, MapPin, Moon, Search, Sunrise, Sun, Sunset } from "lucide-react";
import { z } from "zod";
import { countdown, dateAtLocation, defaultPlace, defaultAdjustments, nextPrayer, prayerTimes, type Place, type PrayerAdjustments } from "@/lib/prayer";

const placeSchema = z.object({ name: z.string(), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), timezone: z.string().refine((value) => {
  try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; }
}) });
type City = Place & { country?: string; admin1?: string };
const prayerIcons = [Moon, Sunrise, Sun, Sun, Sunset];
export default function PrayerDashboard() {
  const [place, setPlace] = useState<Place>(defaultPlace);
  const [adjustments, setAdjustments] = useState<PrayerAdjustments>(defaultAdjustments);
  const [now, setNow] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [locating, setLocating] = useState(false);
  const [use24Hour, setUse24Hour] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    try {
      const saved = localStorage.getItem("waqt.location");
      if (saved) setPlace(placeSchema.parse(JSON.parse(saved)));
      const savedAdj = localStorage.getItem("waqt.adjustments");
      if (savedAdj) setAdjustments(JSON.parse(savedAdj));
    } catch { setError("Your saved location or adjustments could not be loaded. Using defaults."); }
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    setCities([]);
    setSearchError("");
    if (query.trim().length < 2) { setSearching(false); return; }
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`, { signal: controller.signal });
        if (!response.ok) throw new Error("City search is unavailable. Try again shortly.");
        const data = z.object({ results: z.array(placeSchema.extend({ country: z.string().optional(), admin1: z.string().optional() })).optional() }).parse(await response.json());
        setCities(data.results || []);
      } catch (error) {
        if (!controller.signal.aborted) setSearchError(error instanceof Error ? error.message : "City search failed.");
      } finally { if (!controller.signal.aborted) setSearching(false); }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);
  function choose(value: Place) {
    setPlace(value);
    setQuery("");
    setCities([]);
    setError("");
    try { localStorage.setItem("waqt.location", JSON.stringify(value)); }
    catch { setError("Location changed, but this browser could not save it for your next visit."); }
  }
  function updateAdjustment(key: keyof PrayerAdjustments, value: number) {
    const newAdj = { ...adjustments, [key]: value };
    setAdjustments(newAdj);
    try { localStorage.setItem("waqt.adjustments", JSON.stringify(newAdj)); }
    catch { setError("Adjustments changed, but this browser could not save them for your next visit."); }
  }
  function resetAdjustments() {
    setAdjustments(defaultAdjustments);
    try { localStorage.setItem("waqt.adjustments", JSON.stringify(defaultAdjustments)); }
    catch { setError("Adjustments reset, but this browser could not save them for your next visit."); }
  }
  function locate() {
    if (!navigator.geolocation) { setError("Geolocation is not supported. Search for your city instead."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&timezone=auto`, { signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error("Could not determine your time zone. Search for your city instead.");
        const { timezone } = z.object({ timezone: z.string() }).parse(await response.json());
        choose(placeSchema.parse({ name: "Current location", latitude: coords.latitude, longitude: coords.longitude, timezone }));
      } catch (error) { setError(error instanceof Error ? error.message : "Location lookup failed."); }
      finally { setLocating(false); }
    }, (error) => { setError(`Location unavailable: ${error.message}. Search for your city instead.`); setLocating(false); }, { timeout: 15000 });
  }
  const day = now ? dateAtLocation(now, place.timezone).getTime() : null;
  const times = useMemo(() => day === null ? [] : prayerTimes(new Date(day), place, adjustments), [day, place, adjustments]);
  const next = now ? nextPrayer(now, place, adjustments) : undefined;
  const formatTime = (time: Date) => Number.isNaN(time.getTime()) ? "Unavailable" : new Intl.DateTimeFormat("en", { timeZone: place.timezone, hour: "2-digit", minute: "2-digit", hour12: !use24Hour }).format(time);
  const hijri = now ? new Intl.DateTimeFormat("en-u-ca-islamic", { timeZone: place.timezone, day: "numeric", month: "long", year: "numeric" }).format(now) : "Loading date…";
  const gregorian = now ? new Intl.DateTimeFormat("en", { timeZone: place.timezone, weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(now) : "";
  return <>
    <div className="page-heading"><div><div className="eyebrow"><span className="little-line" /> A MOMENT FOR YOUR SOUL</div><h1>Peace begins with prayer<span className="brand-dot">.</span></h1><p className="muted">Pause the world. Find your stillness. Come back to what matters.</p></div><div className="date-badge"><span>{hijri}</span><small>{gregorian}</small></div></div>
    <div className="location-bar">
      <div className="current-location"><span className="location-icon"><MapPin size={19} /></span><div><strong>{place.name}</strong><small>{place.timezone.replaceAll("_", " ")} · Shia calculation</small></div></div>
      <div className="location-controls"><div className="city-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search for a city" placeholder="Search another city…" autoComplete="off" />
        {query.trim().length >= 2 && <div className="city-results" aria-live="polite">
          {searching ? <p>Searching cities…</p> : searchError ? <p role="alert">{searchError}</p> : cities.length ? cities.map((city, index) =>
            <button key={`${city.latitude}-${index}`} onClick={() => choose({ ...city, name: [city.name, city.country].filter(Boolean).join(", ") })}><MapPin size={15} /><span><strong>{city.name}</strong><small>{[city.admin1, city.country].filter(Boolean).join(", ")}</small></span></button>) : <p>No cities found. Try a nearby city.</p>}
        </div>}</div><button className="icon-button locate-button" onClick={locate} disabled={locating} aria-label="Use my current location"><LocateFixed size={19} /></button></div>
    </div>
    {error && <p className="notice" role="alert">{error}</p>}
    <section className="prayer-hero" aria-label="Next prayer">
      <div className="hero-pattern" aria-hidden="true" /><div className="arch-art" aria-hidden="true"><div /><span>✦</span></div>
      <div className="hero-content"><span className="hero-tag"><span /> YOUR NEXT MOMENT OF PEACE</span><div className="next-prayer-title"><h2>{next?.name || "Prayer times"}</h2><span lang="ar" className="arabic">{next?.arabic || "الصلاة"}</span></div>
        <p>{next ? `${formatTime(next.time)} · ${place.name}` : "Calculating your local prayer times…"}</p>
        <div className="countdown" role="timer" aria-label="Time until next prayer">{next && now ? countdown(next.time.getTime() - now.getTime()) : "--:--:--"}</div><span className="countdown-label">HOURS <span>MINUTES</span> SECONDS</span>
      </div>
      <div className="hero-verse"><span className="arabic" lang="ar" dir="rtl">إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا</span><p>“Indeed, prayer has been decreed upon the believers<br />a decree of specified times.”</p><small>SURAH AN-NISA · 4:103</small></div>
    </section>
    <section className="daily-section"><div className="section-heading"><h2>Today's prayer times <span className="subtle-chip">DAILY SCHEDULE</span></h2><div className="flex gap-2"><button className="text-button" onClick={() => setUse24Hour(!use24Hour)}>{use24Hour ? "12-hour" : "24-hour"} format <ChevronRight size={14} /></button><button className="text-button" onClick={() => setShowAdjustments(!showAdjustments)}>Custom timing <ChevronRight size={14} /></button></div></div>
      {showAdjustments && <div className="prayer-adjustments" style={{ padding: "12px", marginBottom: "16px", backgroundColor: "rgba(16, 185, 129, 0.05)", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.1)" }}>
        <div style={{ marginBottom: "12px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>ADJUST PRAYER TIMES (minutes)</p>
          <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "12px" }}>Customize each prayer time offset from the calculated time. Negative values move earlier, positive values move later.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px", marginBottom: "12px" }}>
          {Object.entries(adjustments).map(([key, value]) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", textTransform: "capitalize" }}>{key}</label>
              <input type="number" min="-60" max="60" step="1" value={value} onChange={(e) => updateAdjustment(key as keyof PrayerAdjustments, Number(e.target.value))} style={{ padding: "6px 8px", fontSize: "12px", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "4px", fontFamily: "monospace" }} />
            </div>
          ))}
        </div>
        <button onClick={resetAdjustments} style={{ fontSize: "12px", padding: "6px 12px", backgroundColor: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: "4px", cursor: "pointer", fontWeight: 500, color: "#374151", transition: "all 0.2s" }}>Reset to defaults</button>
      </div>}
      <div className="prayer-grid">{times.map((prayer, index) => {
        const Icon = prayerIcons[index]; const isNext = next?.time.getTime() === prayer.time.getTime(); const passed = now && prayer.time <= now;
        return <article className={`prayer-card ${isNext ? "upcoming" : ""} ${passed ? "passed" : ""}`} key={prayer.name}>
          <div className="between"><span className="prayer-icon"><Icon size={22} strokeWidth={1.5} /></span>{isNext ? <span className="next-badge">UP NEXT</span> : passed ? <Check size={15} className="muted" /> : <span className="prayer-dot" />}</div>
          <div className="prayer-name"><h3>{prayer.name}</h3><span lang="ar" className="arabic">{prayer.arabic}</span></div><strong className="prayer-time">{formatTime(prayer.time)}</strong>
          <span className="prayer-description">{["10 min precaution", "Dawn prayer", "The day awakens", "Midday prayer", "Evening prayer"][index]}</span>
        </article>;
      })}</div>
      {times.some((prayer) => Number.isNaN(prayer.time.getTime())) && <p className="notice" role="alert">Some solar events do not occur at this latitude today. Ask your local authority for high-latitude guidance; no estimated times are substituted.</p>}
      <div className="schedule-note"><Compass size={14} /><span>Original Shia method preserved: Fajr −18°, Saher −19° with a 10-minute precaution; Maghrib −4.5° with a 5-minute precaution. Asr and Isha may be combined; consult your marja.</span><a href="/timetable/" target="_blank" rel="noopener noreferrer"><ArrowDownToLine size={14} /> Full timetable</a></div>
    </section>
    <section className="reflection-grid">
      <article className="daily-reflection"><span className="eyebrow"><span className="little-line" /> A VERSE TO CARRY WITH YOU</span><p className="arabic" lang="ar" dir="rtl">فَإِنَّ مَعَ الْعُسْرِ يُسْرًا</p><blockquote>“For indeed, with hardship comes ease.”</blockquote><div className="between"><span className="muted small">Ash-Sharh · 94:5</span><Link className="text-button" href="/quran?ayah=94:5">Open the Quran <ArrowRight size={16} /></Link></div></article>
      <article className="explore-card"><div className="explore-icon"><BookOpen size={24} /></div><div><span className="eyebrow">WORDS THAT GUIDE</span><h3>Make room for reflection.</h3><p className="muted">Read a verse. Save a thought.<br />Let its meaning stay with you.</p><Link className="text-button" href="/quran">Continue your journey <ArrowRight size={16} /></Link></div></article>
    </section>
    <Link className="dua-banner" href="/dua"><span className="dua-banner-icon"><Heart size={21} /></span><span><strong>Explore supplication in the narrations.</strong><small>Search the Thaqalayn corpus for words of gratitude and guidance.</small></span><ArrowRight size={20} /></Link>
  </>;
}
