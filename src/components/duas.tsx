"use client";

import { useEffect, useState } from "react";
import { Bookmark, Heart, Search } from "lucide-react";
import { getDuas } from "@/lib/api";
import type { Dua } from "@/lib/models";
import { useLibrary } from "./library-provider";

export function DuaCard({ dua }: { dua: Dua }) {
  const { library, toggleDua, ready } = useLibrary();
  const saved = library.duas.includes(dua.id);
  return <article className="dua-card panel"><div className="between"><div><span className="eyebrow">{dua.category.replaceAll("_", " ")}</span><h2>{dua.title}</h2></div>
    <button className={`icon-button ${saved ? "is-saved" : ""}`} disabled={!ready} aria-pressed={saved} aria-label={`Bookmark ${dua.title}`} onClick={() => toggleDua(dua.id)}><Bookmark size={19} fill={saved ? "currentColor" : "none"} /></button></div>
    <p className="arabic ayah-text" dir="rtl" lang="ar">{dua.arabic}</p><p className="transliteration">{dua.transliteration}</p><p className="translation">{dua.translation}</p>
    <div className="dua-source"><BookReference /><span>{dua.reference || dua.source}{dua.reference && dua.reference !== dua.source ? ` · ${dua.source}` : ""}</span></div>
    {dua.authenticity_note && <p className="notice small">{dua.authenticity_note}</p>}
  </article>;
}
function BookReference() { return <span aria-hidden="true">↳</span>; }
export default function Duas() {
  const [data, setData] = useState<{ duas: Dua[]; categories: { id: string; name: string }[] }>();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [favorites, setFavorites] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const { library } = useLibrary();
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    getDuas(controller.signal).then(setData).catch((error: unknown) => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not load duas.");
    });
    return () => controller.abort();
  }, [retry]);
  const filtered = data?.duas.filter((dua) => (category === "all" || category === dua.category) && (!favorites || library.duas.includes(dua.id)) &&
    `${dua.title} ${dua.translation} ${dua.transliteration} ${dua.arabic} ${dua.source}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <div className="page-heading"><div><span className="eyebrow">WORDS FOR EVERY MOMENT</span><h1>Keep your heart connected<span className="brand-dot">.</span></h1><p className="muted">Supplications for the ordinary days and the extraordinary ones.</p></div><span className="heading-icon"><Heart size={30} /></span></div>
    <section className="dua-intro"><span className="arabic" lang="ar" dir="rtl">ادْعُونِي أَسْتَجِبْ لَكُمْ</span><p>“Call upon Me; I will respond to you.”</p><small>GHAFIR · 40:60</small></section>
    <div className="library-toolbar"><div className="search-field"><Search size={18} /><input placeholder="Search duas, meanings, or references…" aria-label="Search duas" value={query} onChange={(event) => setQuery(event.target.value)} /></div><button className={`button ${favorites ? "" : "secondary"}`} aria-pressed={favorites} onClick={() => setFavorites(!favorites)}><Bookmark size={17} /> Favorites</button></div>
    <div className="category-list"><button className={category === "all" ? "selected" : ""} onClick={() => setCategory("all")}>All duas</button>{data?.categories.map((item) => <button key={item.id} className={category === item.id ? "selected" : ""} onClick={() => setCategory(item.id)}>{item.name}</button>)}</div>
    <div className="section-heading"><h2>{category === "all" ? favorites ? "Your favorite duas" : "Explore the collection" : data?.categories.find((item) => item.id === category)?.name}</h2><span className="muted small">{filtered?.length || 0} duas</span></div>
    <p className="muted small">Arabic, transliteration, translations, and references are supplied by ThaqalaynAPI. Source collections are shown for each dua; inclusion does not imply a new authenticity grading.</p>
    {error && <div role="alert" className="notice">{error} <button onClick={() => setRetry(retry + 1)}>Retry</button></div>}
    {!data && !error && <div className="loading panel" role="status">Opening the dua library…</div>}
    <div className="dua-grid">{filtered?.map((dua) => <DuaCard key={dua.id} dua={dua} />)}</div>
    {data && !filtered?.length && <div className="empty panel"><Heart size={28} /><h3>No duas found</h3><p>Try a different search or category, or save your first favorite.</p></div>}
  </>;
}
