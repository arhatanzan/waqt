"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bookmark, Download, FilePenLine, Upload } from "lucide-react";
import { getDuas } from "@/lib/api";
import type { Dua } from "@/lib/models";
import { useLibrary } from "./library-provider";
import NoteEditor, { NotePreview } from "./notes";
import { DuaCard } from "./duas";

export default function Saved({ openAyah }: { openAyah: (key: string) => void }) {
  const { library, toggleAyat, importLibrary, ready } = useLibrary();
  const [tab, setTab] = useState<"ayats" | "notes" | "duas">("ayats");
  const [duas, setDuas] = useState<Dua[]>([]);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [note, setNote] = useState<string>();
  const [pendingImport, setPendingImport] = useState<string>();
  const input = useRef<HTMLInputElement>(null);
  const confirm = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (tab !== "duas") return;
    const controller = new AbortController();
    setError(""); setLoaded(false);
    getDuas(controller.signal).then((data) => { setDuas(data.duas); setLoaded(true); }).catch((error: unknown) => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Saved duas could not be loaded.");
    });
    return () => controller.abort();
  }, [tab, retry]);
  useEffect(() => { if (pendingImport) confirm.current?.showModal(); }, [pendingImport]);
  function exportData() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(library, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "waqt-library.json"; link.click();
    URL.revokeObjectURL(url);
  }
  const keys = tab === "notes" ? Object.keys(library.notes).sort((a, b) => library.notes[b].updatedAt.localeCompare(library.notes[a].updatedAt)) : library.ayats;
  return <>
    <div className="page-heading"><div><span className="eyebrow">A SPACE OF YOUR OWN</span><h1>Your personal library<span className="brand-dot">.</span></h1><p className="muted">The verses you love. The thoughts you want to keep.</p></div><span className="heading-icon"><Bookmark size={30} /></span></div>
    <div className="library-toolbar"><div className="segmented library-tabs"><button className={tab === "ayats" ? "selected" : ""} onClick={() => setTab("ayats")}>Saved Ayats ({library.ayats.length})</button><button className={tab === "notes" ? "selected" : ""} onClick={() => setTab("notes")}>Notes ({Object.keys(library.notes).length})</button><button className={tab === "duas" ? "selected" : ""} onClick={() => setTab("duas")}>Duas ({library.duas.length})</button></div>
      <div className="backup-actions"><button className="button secondary" onClick={exportData} disabled={!ready}><Download size={15} /> Export</button><button className="button secondary" disabled={!ready} onClick={() => input.current?.click()}><Upload size={15} /> Import</button>
        <input ref={input} hidden type="file" accept=".json,application/json" aria-label="Import library backup" onChange={async (event) => {
          const file = event.target.files?.[0]; event.target.value = "";
          if (!file) return;
          if (file.size > 5_000_000) { setError("Backup is too large. Maximum size is 5 MB."); return; }
          try {
            const text = await file.text();
            if (!text.trim()) { setError("The backup file is empty. Choose a valid Waqt library backup."); return; }
            setPendingImport(text);
          } catch { setError("The backup file could not be read."); }
        }} /></div>
    </div>
    <div className="notice library-notice"><Bookmark size={17} /><span>Your library is stored in this browser, not in an account. Export a backup before switching devices or clearing browser data.</span></div>
    {error && <p role="alert" className="notice">{error} <button onClick={() => setRetry(retry + 1)}>Retry</button></p>}
    {ready && tab !== "duas" && (keys.length ? keys.map((key) => <article className="panel saved-card" key={key}><div className="between"><div><span className="eyebrow">SURAH {key.split(":")[0]} · AYAH {key.split(":")[1]}</span><h2>Ayah {key}</h2></div><div className="ayah-actions"><button className="icon-button" aria-label={`Edit note for ayah ${key}`} onClick={() => setNote(key)}><FilePenLine size={18} /></button>
      {library.ayats.includes(key) && <button className="icon-button is-saved" aria-label={`Remove bookmark ${key}`} onClick={() => toggleAyat(key)}><Bookmark size={18} fill="currentColor" /></button>}</div></div>
      {library.notes[key] ? <><NotePreview text={library.notes[key].text} /><small className="muted">Updated {new Date(library.notes[key].updatedAt).toLocaleDateString()}</small></> : <p className="muted">A verse to return to. Open it to read, listen, or add a reflection.</p>}
      <button className="text-button saved-open" onClick={() => openAyah(key)}>Read in the Quran <ArrowRight size={16} /></button></article>) : <div className="empty panel"><Bookmark size={30} /><h2>{tab === "notes" ? "Your reflections begin here" : "Keep a verse close"}</h2><p>{tab === "notes" ? "Use “Write note” on any ayah to save a thought, video, or recording." : "Tap the bookmark beside any ayah in the Quran reader to find it here."}</p><button className="button" onClick={() => openAyah("1:1")}>Explore the Quran <ArrowRight size={16} /></button></div>)}
    {tab === "duas" && <div className="dua-grid">{duas.filter((dua) => library.duas.includes(dua.id)).map((dua) => <DuaCard key={dua.id} dua={dua} />)}</div>}
    {tab === "duas" && !loaded && !error && <div className="loading panel" role="status">Loading your saved duas…</div>}
    {tab === "duas" && loaded && library.duas.length === 0 && <div className="empty panel"><Bookmark size={28} /><h2>A little collection of comfort</h2><p>Bookmark a dua from the Dua tab to keep it here.</p></div>}
    {note && <NoteEditor key={note} verseKey={note} onClose={() => setNote(undefined)} />}
    {pendingImport && <dialog ref={confirm} className="note-dialog import-dialog" onCancel={() => setPendingImport(undefined)}><h2>Replace your library?</h2><p>Importing replaces existing notes and bookmarks on this device. Export a backup first if you want to keep them.</p><div className="dialog-actions"><button className="button secondary" onClick={() => setPendingImport(undefined)}>Cancel</button><button className="button" onClick={() => { importLibrary(pendingImport); setPendingImport(undefined); }}>Replace library</button></div></dialog>}
  </>;
}
