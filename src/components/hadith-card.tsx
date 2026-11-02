"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Bookmark, ExternalLink } from "lucide-react";
import { hadithHref, pageHref, safeSourceUrl, type Hadith } from "@/lib/thaqalayn";
import { useLibrary } from "./library-provider";

export function ProviderText({ text }: { text: string }) {
  return <div className="provider-text"><ReactMarkdown>{text.replace(/<br\s*\/?>/gi, "\n\n").replace(/<\/?p>/gi, "\n\n")}</ReactMarkdown></div>;
}

export default function HadithCard({ hadith, detail = false }: { hadith: Hadith; detail?: boolean }) {
  const { library, toggleHadith, ready } = useLibrary();
  const saved = library.hadiths.some((item) => item.bookId === hadith.bookId && item.id === hadith.id);
  const source = safeSourceUrl(hadith.URL);
  const gradings = hadith.gradingsFull || [];
  return <article className="panel hadith-card">
    <div className="between">
      <div><Link className="eyebrow" href={hadithHref(hadith.bookId)}>{hadith.book}{hadith.volume ? ` · Volume ${hadith.volume}` : ""}</Link>
        <h2><Link href={hadithHref(hadith.bookId, hadith.id)}>{hadith.chapter || `Hadith ${hadith.id}`}</Link></h2>
        <p className="muted small">Hadith {hadith.id}</p></div>
      <button className={`icon-button ${saved ? "is-saved" : ""}`} disabled={!ready} aria-pressed={saved}
        aria-label={`${saved ? "Remove bookmark for" : "Bookmark"} ${hadith.book} hadith ${hadith.id}`}
        onClick={() => toggleHadith(hadith.bookId, hadith.id)}><Bookmark size={19} fill={saved ? "currentColor" : "none"} /></button>
    </div>
    <div className="hadith-links small">
      {hadith.category && <Link className="text-button" href={pageHref(hadithHref(hadith.bookId), { category: hadith.category }, 1)}>{hadith.category}</Link>}
      {hadith.chapter && <Link className="text-button" href={pageHref(hadithHref(hadith.bookId), { category: hadith.category || undefined, chapter: hadith.chapter }, 1)}>Browse this chapter</Link>}
    </div>
    {hadith.arabicText && <div className="arabic ayah-text hadith-arabic" lang="ar" dir="rtl"><ProviderText text={hadith.arabicText} /></div>}
    {hadith.englishText && <div lang="en"><ProviderText text={hadith.englishText} /></div>}
    {!hadith.arabicText && !hadith.englishText && <p className="notice">No Arabic or English text was supplied for this narration.</p>}
    {hadith.frenchText && <details open={detail}><summary>French translation</summary><div lang="fr"><ProviderText text={hadith.frenchText} /></div></details>}
    {(hadith.thaqalaynSanad || hadith.thaqalaynMatn) && <details><summary>Chain of transmission and narration text</summary>
      {hadith.thaqalaynSanad && <><h3>Chain (sanad)</h3><ProviderText text={hadith.thaqalaynSanad} /></>}
      {hadith.thaqalaynMatn && <><h3>Text (matn)</h3><ProviderText text={hadith.thaqalaynMatn} /></>}
    </details>}
    <details open={detail}><summary>Source details and provider gradings</summary>
      <dl className="source-details">
        {hadith.author && <><dt>Author</dt><dd>{hadith.author}</dd></>}
        {hadith.translator && <><dt>Translator</dt><dd>{hadith.translator}</dd></>}
        {hadith.categoryId != null && <><dt>Category ID</dt><dd>{hadith.categoryId}</dd></>}
        {hadith.chapterInCategoryId != null && <><dt>Chapter ID</dt><dd>{hadith.chapterInCategoryId}</dd></>}
        {(["majlisiGrading", "behbudiGrading", "mohseniGrading"] as const).map((field) => hadith[field] &&
          <div className="source-detail-row" key={field}><dt>{field.replace("Grading", "")} grading</dt><dd dir="auto">{hadith[field]}</dd></div>)}
      </dl>
      {gradings.map((grading, index) => <div className="grading" key={index}>
        <strong>{grading.author?.name_en || grading.author?.name_ar || "Provider grading"}</strong>
        {grading.author?.name_ar && grading.author.name_en && <p lang="ar" dir="rtl">{grading.author.name_ar}</p>}
        {grading.author?.death_date && <p>{grading.author.death_date}</p>}
        {safeSourceUrl(grading.author?.link) && <a className="text-button" href={safeSourceUrl(grading.author?.link)} target="_blank" rel="noopener noreferrer">Grader source <ExternalLink size={14} /></a>}
        {grading.grade_ar && <p lang="ar" dir="rtl">{grading.grade_ar}</p>}
        {grading.grade_en && <p>{grading.grade_en}</p>}
        {grading.reference_en && <ProviderText text={grading.reference_en} />}
      </div>)}
      {!gradings.length && !hadith.majlisiGrading && !hadith.behbudiGrading && !hadith.mohseniGrading && <p className="muted">No grading was supplied.</p>}
      <p className="muted small">Gradings are reproduced from ThaqalaynAPI, not independently assigned by Waqt.</p>
    </details>
    <div className="hadith-links"><Link className="text-button" href={hadithHref(hadith.bookId, hadith.id)}>Open dedicated hadith page</Link>
      {source && <a className="text-button" href={source} target="_blank" rel="noopener noreferrer">Read on Thaqalayn <ExternalLink size={14} /></a>}</div>
  </article>;
}
