"use client";

import { useEffect, useState } from "react";
import { motion, MotionConfig } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Bookmark, LibraryBig, Moon, Sun, Clock3, ArrowUpRight, Sparkles, Menu, X } from "lucide-react";
import { LibraryProvider, useLibrary } from "./library-provider";

const navigation = [
  { id: "prayer", label: "Prayer Times", icon: Clock3 },
  { id: "quran", label: "Quran", icon: BookOpen },
  { id: "hadith", label: "Hadith", icon: LibraryBig },
  { id: "saved", label: "My Library", icon: Bookmark },
] as const;
function Content({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const tab = pathname.split("/")[1];
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [themeError, setThemeError] = useState("");
  const { library } = useLibrary();
  useEffect(() => {
    try {
      const preference = localStorage.getItem("waqt.theme");
      setDark(preference ? preference === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
      const sidebarPref = localStorage.getItem("waqt.sidebar");
      setSidebarOpen(sidebarPref !== "closed");
    } catch { setThemeError("Theme preferences cannot be saved in this browser."); }
  }, []);
  useEffect(() => {
    if (pathname !== "/") return;
    const legacy = window.location.hash.slice(1);
    router.replace(navigation.some((item) => item.id === legacy) ? `/${legacy}` : "/prayer");
  }, [pathname, router]);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; }, [dark]);
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
  return <div className={`app-shell${sidebarOpen ? "" : " sidebar-collapsed"}`}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside id="main-sidebar" className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
      <Link className="brand" href="/prayer" aria-label="Waqt home"><span className="brand-mark"><Moon size={25} /></span><span>waqt<span className="brand-dot">.</span><small>MAKE TIME FOR WHAT MATTERS</small></span></Link>
      <div className="sidebar-label">YOUR DAILY COMPANION</div>
      <nav aria-label="Main navigation">{navigation.map(({ id, label, icon: Icon }) =>
        <Link key={id} href={`/${id}`} className={`nav-item ${tab === id ? "active" : ""}`} aria-current={tab === id ? "page" : undefined} aria-label={label} title={label}>
          <Icon size={20} /><span>{label}</span>{id === "saved" && <span className="nav-count">{library.ayats.length + library.hadiths.length + library.duas.length}</span>}
        </Link>)}</nav>
      <div className="sidebar-bottom">
        <div className="sidebar-quote"><Sparkles size={20} /><p>A little closer.<br />Every single day.</p><span>Your space to pause, reflect,<br />and reconnect.</span></div>
        <a className="legacy-link" href="/timetable/" target="_blank" rel="noopener noreferrer">Timetable & PDF tools <ArrowUpRight size={15} /></a>
        <div className="sidebar-footer"><span>MADE WITH INTENTION</span><span>✦</span></div>
      </div>
    </aside>
    <div className="workspace">
      <header className="topbar"><span className="topbar-crumb">Your daily companion <span>/</span> <strong>{navigation.find((item) => item.id === tab)?.label}</strong></span>
        <span className="mobile-brand">waqt<span className="brand-dot">.</span></span>
        <div className="topbar-actions">
          <button className="icon-button sidebar-toggle" onClick={toggleSidebar} aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"} aria-expanded={sidebarOpen} aria-controls="main-sidebar" title="Toggle sidebar">
            {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <span className="peace-greeting">Assalamu Alaikum <span>✦</span></span>
          <button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${dark ? "light" : "dark"} mode`}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button>
          <span className="profile-mark" aria-label="Personal space">W</span></div>
      </header>
      <main id="main-content" tabIndex={-1}>
        {themeError && <p role="alert" className="notice">{themeError}</p>}
        <motion.div key={pathname} initial={{ y: 8 }} animate={{ y: 0 }} transition={{ duration: .18 }}>
          {children}
        </motion.div>
        <footer className="page-footer"><span>Find a moment of peace in your everyday.</span><span>WAQT <span className="brand-dot">✦</span> YOUR DAILY COMPANION</span></footer>
      </main>
      <nav className="mobile-nav" aria-label="Mobile navigation">{navigation.map(({ id, label, icon: Icon }) =>
        <Link href={`/${id}`} key={id} className={tab === id ? "active" : ""} aria-current={tab === id ? "page" : undefined}><Icon size={21} /><span>{label}</span></Link>)}</nav>
    </div>
  </div>;
}
export default function Hub({ children }: { children: React.ReactNode }) { return <MotionConfig reducedMotion="user"><LibraryProvider><Content>{children}</Content></LibraryProvider></MotionConfig>; }
