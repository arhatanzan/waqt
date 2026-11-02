"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { BookOpen, Search, Shuffle } from "lucide-react";
import { getBooks, getHadiths, hadithHref, pageHref, safeSourceUrl, type Book, type HadithFilters, type HadithPage } from "@/lib/thaqalayn";
import { useResource } from "@/lib/use-resource";
import HadithCard, { ProviderText } from "./hadith-card";

export function ResourceStatus({ error, retry, loading }: { error: string; retry: () => void; loading: boolean }) {
  if (error) return <div className="notice" role="alert">{error} <button className="text-button" onClick={retry}>Retry</button></div>;
  return loading ? <div className="loading panel" role="status">Opening the Thaqalayn library...</div> : null;
}

export function CorpusHeading({ title, description }: { title: string; description: string }) {
  return <div className="page-heading"><div><span className="eyebrow">THAQALAYN LIBRARY</span><h1>{title}<span className="brand-dot">.</span></h1><p className="muted">{description}</p></div><span className="heading-icon"><BookOpen size={30} /></span></div>;
}

export function CorpusLinks() {
  return <nav className="corpus-links" aria-label="Thaqalayn sections">
    <Link href="/hadith">All books</Link><Link href="/hadith/search">Search all narrations</Link>
    <Link href="/hadith/random"><Shuffle size={16} /> Random narration</Link><Link href="/ingredients">Ingredient guide</Link>
  </nav>;
}

export function BookCatalogue() {
  const books = useResource(getBooks);
  const [query, setQuery] = useState("");
  const filtered = books.data?.filter((book) =>
    [book.BookName, book.englishName, book.author, book.translator, book.bookDescription, book.bookId].join(" ").toLowerCase().includes(query.toLowerCase()));
  return <>
    <CorpusHeading title="The hadith collection" description="Every book and volume made available by ThaqalaynAPI, with access to every narration." />
    <CorpusLinks />
    <div className="library-toolbar"><div className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Filter books" placeholder="Filter books, authors, or translators..." /></div></div>
    <ResourceStatus error={books.error} retry={books.retry} loading={!books.data} />
    {books.data && <p className="muted collection-count">{filtered?.length} of {books.data.length} books and volumes. The catalogue is fetched from the provider, not a fixed selection.</p>}
    <div className="book-grid">{filtered?.map((book) => <article className="panel book-card" key={book.bookId}>
      <span className="eyebrow">{book.volume ? `Volume ${book.volume}` : "Collection"} · IDs {book.idRangeMin}–{book.idRangeMax}</span>
      <h2><Link href={hadithHref(book.bookId)}>{book.BookName}</Link></h2>
      {book.englishName && <p className="muted">{book.englishName}</p>}
      <p>{book.author}</p>
      {book.translator && <p className="muted small">Translation: {book.translator}</p>}
      {safeSourceUrl(book.bookCover) && <a className="text-button small" href={safeSourceUrl(book.bookCover)} target="_blank" rel="noopener noreferrer">Book cover (provider link)</a>}
      {book.bookDescription && <details><summary>About this book</summary><ProviderText text={book.bookDescription} /></details>}
      <Link className="button secondary" href={hadithHref(book.bookId)}>Browse all narrations</Link>
    </article>)}</div>
    {books.data && !filtered?.length && <div className="empty panel">No books match your filter.</div>}
    <p className="muted small">Texts, translations, metadata, and gradings are supplied by <a className="text-button" href="https://github.com/MohammedArab1/ThaqalaynAPI" target="_blank" rel="noopener noreferrer">ThaqalaynAPI</a>. Availability follows its catalogue and updates.</p>
  </>;
}

function SearchForm({ action, filters, bookId, includeBooks = false, books = [] }: { action: string; filters: HadithFilters; bookId?: string; includeBooks?: boolean; books?: Book[] }) {
  return <form action={action} className="panel corpus-form">
    <label>Search Arabic or English<input type="search" name="q" defaultValue={filters.q} maxLength={1000} placeholder="Search words; use | for alternatives" /></label>
    <label>Search language<select name="lang" defaultValue={filters.lang || "any"}><option value="any">Arabic and English</option><option value="en">English</option><option value="ar">Arabic</option></select></label>
    {includeBooks && <label>Collection<select name="book" key={books.length} defaultValue={bookId || ""}><option value="">All books and volumes</option>{books.map((book) => <option value={book.bookId} key={book.bookId}>{book.BookName}{book.volume ? ` · ${book.volume}` : ""} · {book.author}</option>)}</select></label>}
    {!includeBooks && !filters.q && <>
      <label>Category<input name="category" defaultValue={filters.category} placeholder="Exact category name" maxLength={1000} /></label>
      <label>Chapter<input name="chapter" defaultValue={filters.chapter} placeholder="Exact chapter name" maxLength={1000} /></label>
      <label>Grading<input name="grading" defaultValue={filters.grading} placeholder="Provider grading" maxLength={1000} /></label>
    </>}
    <button className="button" type="submit"><Search size={16} /> Apply</button>
    <p className="muted small">Search matches word forms, not substrings. Text search and book filters are separate modes; clear the search to use category, chapter, or grading filters. Category and chapter links on narrations fill in their exact names.</p>
  </form>;
}

export function Pagination({ data, path, filters, bookId }: { data: HadithPage; path: string; filters: HadithFilters; bookId?: string }) {
  const { pagination } = data;
  return <nav className="pagination panel" aria-label="Hadith result pages">
    <span>{pagination.total.toLocaleString()} narrations · Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span>
    <div className="pagination-links">
      {pagination.hasPrev && <><Link className="button secondary" href={pageHref(path, filters, 1, bookId)}>First</Link><Link className="button secondary" href={pageHref(path, filters, pagination.page - 1, bookId)}>Previous</Link></>}
      {pagination.hasNext && <><Link className="button secondary" href={pageHref(path, filters, pagination.page + 1, bookId)}>Next</Link><Link className="button secondary" href={pageHref(path, filters, pagination.totalPages, bookId)}>Last</Link></>}
    </div>
    {pagination.totalPages > 1 && <form action={path} className="page-jump">
      {Object.entries(filters).filter(([key, value]) => key !== "page" && value).map(([key, value]) => <input type="hidden" name={key} value={value} key={key} />)}
      {bookId && <input type="hidden" name="book" value={bookId} />}
      <label>Go to page <input name="page" type="number" min={1} max={pagination.totalPages} defaultValue={pagination.page} required /></label><button className="button secondary">Go</button>
    </form>}
  </nav>;
}

export function HadithResults({ filters, bookId, dua = false, path }: { filters: HadithFilters; bookId?: string; dua?: boolean; path: string }) {
  const books = useResource(getBooks);
  const load = useCallback((signal: AbortSignal) => getHadiths(bookId, filters, signal), [bookId, filters]);
  const canLoad = Boolean(bookId || filters.q?.trim());
  const results = useResource(load, canLoad);
  const book = books.data?.find((item) => item.bookId === bookId);
  const action = path;
  const includeBooks = action === "/hadith/search" || dua;
  return <>
    <CorpusHeading title={dua ? "Supplication in the narrations" : includeBooks ? "Search the hadith corpus" : book?.BookName || "Read the collection"}
      description={dua ? "Search Thaqalayn narrations about dua and supplication. These are source narrations, not a separately verified dua catalogue." : "Full Arabic and available translations, references, chains of transmission, and provider gradings."} />
    <CorpusLinks />
    {dua && <p className="notice">ThaqalaynAPI does not expose a dedicated dua endpoint. Results below are full-text matches, which may discuss supplication rather than contain a standalone dua. No UmmahAPI content or fallback is used.</p>}
    {!includeBooks && book && <section className="panel book-intro"><p>{book.author}{book.volume ? ` · Volume ${book.volume}` : ""}</p>
      {book.translator && <p className="muted">Translator: {book.translator}</p>}
      {book.bookDescription && <details><summary>About this collection</summary><ProviderText text={book.bookDescription} /></details>}
      <Link className="text-button" href={`/hadith/random?book=${encodeURIComponent(book.bookId)}`}>Random narration from this book</Link>
    </section>}
    <SearchForm action={action} filters={filters} bookId={bookId} includeBooks={includeBooks} books={books.data} />
    <ResourceStatus error={results.error} retry={results.retry} loading={canLoad && !results.data} />
    <ResourceStatus error={books.error} retry={books.retry} loading={!books.data} />
    {!canLoad && <p className="notice">Enter a search term to search all narrations, or choose a collection to browse it.</p>}
    {results.data && <>
      <Pagination data={results.data} path={action} filters={filters} bookId={includeBooks ? bookId : undefined} />
      <div className="hadith-list">{results.data.data.map((hadith) => <HadithCard hadith={hadith} key={`${hadith.bookId}:${hadith.id}`} />)}</div>
      {!results.data.data.length && <div className="empty panel"><h2>No narrations on this page</h2><p>Try a different query, clear filters, or return to page 1.</p><Link className="button secondary" href={pageHref(action, filters, 1, includeBooks ? bookId : undefined)}>First page</Link></div>}
      {results.data.data.length > 0 && <Pagination data={results.data} path={action} filters={filters} bookId={includeBooks ? bookId : undefined} />}
    </>}
  </>;
}
