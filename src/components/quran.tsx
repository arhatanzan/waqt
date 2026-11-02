"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Bookmark, ChevronLeft, ChevronRight, FilePenLine, Headphones, Pause, Play, Repeat, Search, SkipForward, X } from "lucide-react";
import { getAyahAudio, getReading, getSurahs, getTafsir } from "@/lib/api";
import type { Surah, Verse } from "@/lib/models";
import { useLibrary } from "./library-provider";
import NoteEditor from "./notes";

export default function Quran({ initialAyah }: { initialAyah?: string }) {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [kind, setKind] = useState<"surah" | "juz">("surah");
  const [number, setNumber] = useState(initialAyah ? Number(initialAyah.split(":")[0]) : 1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [query, setQuery] = useState("");
  const [translation, setTranslation] = useState("sahih_international");
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [loading, setLoading] = useState(true);
  const [indexError, setIndexError] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [note, setNote] = useState<string>();
  const [tafsir, setTafsir] = useState<{ key: string; text: string; name: string }>();
  const [tafsirLoading, setTafsirLoading] = useState<string>();
  const [active, setActive] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const playbackRequest = useRef(0);
  const { library, toggleAyat, ready } = useLibrary();
  useEffect(() => {
    const controller = new AbortController();
    setIndexError("");
    getSurahs(controller.signal).then((data) => setSurahs(data.surahs)).catch((error: unknown) => {
      if (!controller.signal.aborted) setIndexError(error instanceof Error ? error.message : "Could not load the index.");
    });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    const controller = new AbortController();
    playbackRequest.current++;
    audio.current?.pause();
    audio.current?.removeAttribute("src");
    audio.current?.load();
    setActive(null); setPlaying(false); setAudioLoading(false); setVerses([]); setLoading(true); setError(""); setTafsir(undefined);
    getReading(kind, number, controller.signal).then(({ verses }) => {
      setVerses(verses);
      if (initialAyah) setTimeout(() => document.getElementById(`ayah-${initialAyah}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 100);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not load this reading.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); playbackRequest.current++; audio.current?.pause(); };
  }, [kind, number, retry, initialAyah]);
  async function play(index: number) {
    const verse = verses[index];
    if (!verse || !audio.current) return;
    const request = ++playbackRequest.current;
    audio.current.pause();
    audio.current.removeAttribute("src");
    audio.current.load();
    setActive(index);
    setAudioLoading(true);
    setError("");
    try {
      const url = verse.audio?.ayah_audio || await getAyahAudio(verse.verse_key);
      if (request !== playbackRequest.current) return;
      if (!url) throw new Error("No audio was returned for this ayah.");
      audio.current.src = url;
      await audio.current.play();
    } catch (error) {
      if (request === playbackRequest.current) {
        setPlaying(false); setError(error instanceof Error ? `Audio: ${error.message}` : "Audio could not be played.");
      }
    } finally {
      if (request === playbackRequest.current) setAudioLoading(false);
    }
  }
  async function togglePlayback() {
    if (playing) { audio.current?.pause(); return; }
    if (active === null) { await play(0); return; }
    try { await audio.current?.play(); } catch { setError("Audio playback failed. Try playing this ayah again."); }
  }
  async function openTafsir(key: string) {
    setTafsirLoading(key);
    try {
      const data = await getTafsir(key);
      setTafsir({ key, ...data.tafsir });
    } catch (error) { setError(error instanceof Error ? error.message : "Tafsir could not be loaded."); }
    finally { setTafsirLoading(undefined); }
  }
  const currentSurah = surahs.find((surah) => surah.number === number);
  const options = kind === "surah" ? surahs.filter((surah) => `${surah.number} ${surah.name_english} ${surah.name_translation} ${surah.name_arabic}`.toLowerCase().includes(query.toLowerCase())) :
    Array.from({ length: 30 }, (_, index) => index + 1).filter((value) => `juz ${value}`.includes(query.toLowerCase()));
  return <>
    <div className="page-heading"><div><span className="eyebrow">READ · LISTEN · REFLECT</span><h1>The noble Quran<span className="brand-dot">.</span></h1><p className="muted">Timeless guidance. A personal journey, one ayah at a time.</p></div><span className="heading-icon"><BookOpen size={30} /></span></div>
    <div className="quran-layout"><aside className="quran-index panel">
      <div className="segmented"><button className={kind === "surah" ? "selected" : ""} onClick={() => { setKind("surah"); setNumber(1); setQuery(""); }}>Surah</button><button className={kind === "juz" ? "selected" : ""} onClick={() => { setKind("juz"); setNumber(1); setQuery(""); }}>Juz</button></div>
      <div className="search-field"><Search size={16} /><input placeholder={`Search ${kind}s…`} aria-label={`Search ${kind} index`} value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <div className="index-list">
        {indexError && <p className="notice" role="alert">{indexError} <button onClick={() => setRetry(retry + 1)}>Retry</button></p>}
        {!indexError && kind === "surah" && !surahs.length && <p className="muted">Loading surah index…</p>}
        {options.map((option) => {
          const value = typeof option === "number" ? option : option.number;
          return <button className={`index-row ${value === number ? "selected" : ""}`} key={value} onClick={() => setNumber(value)} aria-current={value === number ? "true" : undefined}>
            <span className="surah-number">{value}</span><span><strong>{typeof option === "number" ? `Juz ${value}` : option.name_english}</strong><small>{typeof option === "number" ? "Daily reading portion" : `${option.name_translation} · ${option.verses_count} ayats`}</small></span>
            {typeof option !== "number" && <span className="arabic" lang="ar">{option.name_arabic}</span>}
          </button>;
        })}
        {!options.length && (surahs.length > 0 || kind === "juz") && <p className="empty small">No matches found.</p>}
      </div>
    </aside>
    <section className="reader"><header className="reader-heading panel"><span className="eyebrow">{kind === "surah" ? `${currentSurah?.revelation_place || "QURAN"} · ${verses.length} AYATS` : "A DAILY PORTION"}</span>
      <div className="between"><h2>{kind === "juz" ? `Juz ${number}` : currentSurah?.name_english || `Surah ${number}`}</h2><span lang="ar" className="arabic reader-arabic">{kind === "surah" && currentSurah?.name_arabic}</span></div>
      <div className="reader-settings"><label><input type="checkbox" checked={showTranslation} onChange={(event) => setShowTranslation(event.target.checked)} /> Translation</label><label><input type="checkbox" checked={showTransliteration} onChange={(event) => setShowTransliteration(event.target.checked)} /> Transliteration</label>
        <select aria-label="Translation language" value={translation} onChange={(event) => setTranslation(event.target.value)}><option value="sahih_international">English · Sahih International</option><option value="pickthall">English · Pickthall</option><option value="yusuf_ali">English · Yusuf Ali</option><option value="urdu">Urdu</option><option value="french">French</option><option value="indonesian">Indonesian</option><option value="turkish">Turkish</option></select></div>
    </header>
    {error && <div className="notice" role="alert">{error} <button onClick={() => setRetry(retry + 1)}>Retry</button></div>}
    {loading && <div className="loading panel" role="status"><BookOpen size={28} /><p>Opening your reading…</p></div>}
    {verses.map((verse, index) => <article id={`ayah-${verse.verse_key}`} className={`ayah-card panel ${active === index ? "is-playing" : ""}`} key={verse.verse_key}>
      <div className="between"><span className="ayah-reference">{verse.verse_key}</span><div className="ayah-actions">
        <button className="icon-button" aria-label={`Play ayah ${verse.verse_key}`} onClick={() => { if (active === index && playing) audio.current?.pause(); else void play(index); }}>{active === index && playing ? <Pause size={17} /> : <Play size={17} />}</button>
        <button className={`icon-button ${library.ayats.includes(verse.verse_key) ? "is-saved" : ""}`} disabled={!ready} aria-pressed={library.ayats.includes(verse.verse_key)} aria-label={`Bookmark ayah ${verse.verse_key}`} onClick={() => toggleAyat(verse.verse_key)}><Bookmark size={17} fill={library.ayats.includes(verse.verse_key) ? "currentColor" : "none"} /></button>
      </div></div>
      <p className="arabic ayah-text" dir="rtl" lang="ar">{verse.arabic}</p>
      {showTransliteration && <p className="transliteration">{verse.transliteration}</p>}
      {showTranslation && <p className="translation" lang={translation === "urdu" ? "ur" : undefined} dir={translation === "urdu" ? "rtl" : undefined}>{verse.translations[translation] || "This translation is unavailable for this ayah."}</p>}
      <div className="ayah-footer"><button className="text-button" disabled={!ready} onClick={() => setNote(verse.verse_key)}><FilePenLine size={15} />{library.notes[verse.verse_key] ? "Edit note" : "Write note"}</button><button className="text-button muted" disabled={!!tafsirLoading} onClick={() => void openTafsir(verse.verse_key)}>{tafsirLoading === verse.verse_key ? "Loading…" : "Read tafsir"} <ChevronRight size={14} /></button></div>
      {tafsir?.key === verse.verse_key && <div className="tafsir"><div className="between"><strong>{tafsir.name}</strong><button className="icon-button" aria-label="Close tafsir" onClick={() => setTafsir(undefined)}><X size={16} /></button></div><p>{tafsir.text}</p></div>}
    </article>)}
    {!loading && !error && !verses.length && <div className="empty panel">No ayats returned. <button onClick={() => setRetry(retry + 1)}>Try again</button></div>}
    <div className="reading-pagination"><button className="button secondary" disabled={number <= 1} onClick={() => setNumber(number - 1)}><ChevronLeft size={16} /> Previous {kind}</button><button className="button secondary" disabled={number >= (kind === "surah" ? 114 : 30)} onClick={() => setNumber(number + 1)}>Next {kind} <ChevronRight size={16} /></button></div>
    </section></div>
    <div className="audio-player"><span className="audio-icon"><Headphones size={21} /></span><div><strong>{audioLoading ? "Loading recitation…" : active === null ? "Listen & reflect" : `Ayah ${verses[active]?.verse_key}`}</strong><small>Mishary Rashid Alafasy</small></div>
      <button className="play-button" aria-label={playing ? "Pause recitation" : "Play recitation"} disabled={!verses.length || audioLoading} onClick={() => void togglePlayback()}>{playing ? <Pause size={20} /> : <Play size={20} />}</button>
      <button className="icon-button" aria-label="Next ayah" disabled={audioLoading || active !== null && active >= verses.length - 1 || !verses.length} onClick={() => void play(active === null ? 0 : active + 1)}><SkipForward size={20} /></button>
      <button className={`icon-button ${repeat ? "is-saved" : ""}`} aria-label="Repeat current ayah" aria-pressed={repeat} onClick={() => setRepeat(!repeat)}><Repeat size={19} /></button>
      <audio ref={audio} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { setPlaying(false); setError("The recitation could not be loaded. Check your connection and try again."); }} onEnded={() => { if (repeat && active !== null) void play(active); else if (active !== null && active < verses.length - 1) void play(active + 1); else setPlaying(false); }} />
    </div>
    {note && <NoteEditor key={note} verseKey={note} onClose={() => setNote(undefined)} />}
  </>;
}
