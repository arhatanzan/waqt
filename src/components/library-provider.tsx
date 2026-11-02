"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { emptyLibrary, librarySchema, type Library } from "@/lib/models";

const STORAGE_KEY = "waqt.library.v1";
type LibraryContext = {
  library: Library;
  ready: boolean;
  error: string;
  toggleAyat: (key: string) => void;
  toggleHadith: (bookId: string, id: number) => void;
  saveNote: (key: string, text: string) => boolean;
  importLibrary: (text: string) => boolean;
};
const Context = createContext<LibraryContext | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [library, setLibrary] = useState<Library>(emptyLibrary);
  const current = useRef(library);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    function load() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const value = saved ? librarySchema.parse(JSON.parse(saved)) : emptyLibrary;
        current.current = value;
        setLibrary(value);
        setError("");
      } catch {
        setError("Your saved library could not be read. Existing data has not been overwritten. Import a valid backup or free up browser storage.");
      }
      setReady(true);
    }
    load();
    const sync = (event: StorageEvent) => { if (event.key === STORAGE_KEY) load(); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const commit = useCallback((update: (value: Library) => Library) => {
    try {
      // Re-read before each change so other tabs' most recent writes are preserved.
      const saved = localStorage.getItem(STORAGE_KEY);
      const latest = saved ? librarySchema.parse(JSON.parse(saved)) : current.current;
      const value = librarySchema.parse(update(latest));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      current.current = value;
      setLibrary(value);
      setError("");
      return true;
    } catch {
      setError("Changes were not saved. Browser storage may be full, disabled, or contain invalid data. Export your library before clearing any data.");
      return false;
    }
  }, []);
  const toggleAyat = (key: string) => {
    commit((value) => ({ ...value, ayats: value.ayats.includes(key) ? value.ayats.filter((k) => k !== key) : [...value.ayats, key] }));
  };
  const toggleHadith = (bookId: string, id: number) => {
    commit((value) => ({
      ...value,
      hadiths: value.hadiths.some((item) => item.bookId === bookId && item.id === id)
        ? value.hadiths.filter((item) => item.bookId !== bookId || item.id !== id)
        : [...value.hadiths, { bookId, id }],
    }));
  };
  const saveNote = (key: string, text: string) => commit((value) => {
    const notes = { ...value.notes };
    if (text.trim()) notes[key] = { text, updatedAt: new Date().toISOString() };
    else delete notes[key];
    return { ...value, notes };
  });
  const importLibrary = (text: string) => {
    try {
      const imported = librarySchema.parse(JSON.parse(text));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
      current.current = imported;
      setLibrary(imported);
      setError("");
      return true;
    } catch {
      setError("Import failed. Choose a valid Waqt library backup; no data was changed.");
      return false;
    }
  };
  return <Context.Provider value={{ library, ready, error, toggleAyat, toggleHadith, saveNote, importLibrary }}>
    {error && <div role="alert" className="storage-error">{error}</div>}
    {children}
  </Context.Provider>;
}
export function useLibrary() {
  const context = useContext(Context);
  if (!context) throw new Error("LibraryProvider is required");
  return context;
}
