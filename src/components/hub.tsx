"use client";

import { useEffect, useState } from "react";
import { motion, MotionConfig } from "motion/react";
import { BookOpen, Bookmark, Heart, Moon, Sun, Clock3, ArrowUpRight, Sparkles, Menu, X } from "lucide-react";
import PrayerDashboard from "./prayer-dashboard";
import Quran from "./quran";
import Duas from "./duas";
import Saved from "./saved";
import AzanPlayer from "./azan-player";
import { LibraryProvider, useLibrary } from "./library-provider";

type Tab = "prayer" | "quran" | "dua" | "saved";
const navigation = [
  { id: "prayer", label: "Prayer Times", icon: Clock3 },
  { id: "quran", label: "Quran", icon: BookOpen },
  { id: "dua", label: "Dua", icon: Heart },
  { id: "saved", label: "My Library", icon: Bookmark },
] as const;
function Content() {
  const [tab, setTab] = useState<Tab>("prayer");
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [themeError, setThemeError] = useState("");
  const [openAyah, setOpenAyah] = useState<string | undefined>();
  const { library } = useLibrary();
  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.slice(1);
      if (navigation.some((item) => item.id === hash)) {
        setTab(hash as Tab);
        window.scrollTo({ top: 0 });
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    try {
      const preference = localStorage.getItem("waqt.theme");
      setDark(preference ? preference === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
      const sidebarPref = localStorage.getItem("waqt.sidebar");
      setSidebarOpen(sidebarPref !== "closed");
    } catch { setThemeError("Theme preferences cannot be saved in this browser."); }
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; }, [dark]);
  function navigate(next: Tab) { setTab(next); window.location.hash = next; window.scrollTo({ top: 0 }); }
  function toggleTheme() {
    setDark(!dark);
    try { localStorage.setItem("waqt.theme", dark ? "light" : "dark"); }
    catch { setThemeError("Theme preferences cannot be saved in this browser."); }
  }
  function toggleSidebar() {
    setSidebarOpen(!sidebarOpen);
    try { localStorage.setItem("waqt.sidebar", sidebarOpen ? "closed" : "open"); }
    catch { setThemeError("Sidebar preference cannot be saved in this browser."); }
  }
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
      <a className="brand" href="#prayer" onClick={() => navigate("prayer")}><span className="brand-mark"><Moon size={25} /></span><span>waqt<span className="brand-dot">.</span><small>MAKE TIME FOR WHAT MATTERS</small></span></a>
      <div className="sidebar-label">YOUR DAILY COMPANION</div>
      <nav aria-label="Main navigation">{navigation.map(({ id, label, icon: Icon }) =>
        <a key={id} href={`#${id}`} onClick={() => navigate(id)} className={`nav-item ${tab === id ? "active" : ""}`} aria-current={tab === id ? "page" : undefined} title={label}>
          <Icon size={20} /><span>{label}</span>{id === "saved" && <span className="nav-count">{library.ayats.length + library.duas.length}</span>}
        </a>)}</nav>
      <div className="sidebar-bottom">
        <AzanPlayer />
        <div className="sidebar-quote"><Sparkles size={20} /><p>A little closer.<br />Every single day.</p><span>Your space to pause, reflect,<br />and reconnect.</span></div>
        <a className="legacy-link" href="/timetable/" target="_blank" rel="noopener noreferrer">Timetable & PDF tools <ArrowUpRight size={15} /></a>
        <div className="sidebar-footer"><span>MADE WITH INTENTION</span><span>✦</span></div>
      </div>
    </aside>
    <div className="workspace">
      <header className="topbar"><span className="topbar-crumb">Your daily companion <span>/</span> <strong>{navigation.find((item) => item.id === tab)?.label}</strong></span>
        <span className="mobile-brand">waqt<span className="brand-dot">.</span></span>
        <div className="topbar-actions">
          <button className="icon-button sidebar-toggle" onClick={toggleSidebar} aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"} title="Toggle sidebar">
            {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <span className="peace-greeting">Assalamu Alaikum <span>✦</span></span>
          <button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${dark ? "light" : "dark"} mode`}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button>
          <span className="profile-mark" aria-label="Personal space">W</span></div>
      </header>
      <main id="main-content" tabIndex={-1}>
        {themeError && <p role="alert" className="notice">{themeError}</p>}
        <motion.div key={tab} initial={{ y: 8 }} animate={{ y: 0 }} transition={{ duration: .18 }}>
          {tab === "prayer" && <PrayerDashboard navigate={navigate} />}
          {tab === "quran" && <Quran initialAyah={openAyah} />}
          {tab === "dua" && <Duas />}
          {tab === "saved" && <Saved openAyah={(key) => { setOpenAyah(key); navigate("quran"); }} />}
        </motion.div>
        <footer className="page-footer"><span>Find a moment of peace in your everyday.</span><span>WAQT <span className="brand-dot">✦</span> YOUR DAILY COMPANION</span></footer>
      </main>
      <nav className="mobile-nav" aria-label="Mobile navigation">{navigation.map(({ id, label, icon: Icon }) =>
        <a href={`#${id}`} key={id} onClick={() => navigate(id)} className={tab === id ? "active" : ""} aria-current={tab === id ? "page" : undefined}><Icon size={21} /><span>{label}</span></a>)}</nav>
    </div>
  </div>;
}
export default function Hub() { return <MotionConfig reducedMotion="user"><LibraryProvider><Content /></LibraryProvider></MotionConfig>; }
