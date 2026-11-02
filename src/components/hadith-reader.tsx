"use client";

import { useCallback } from "react";
import Link from "next/link";
import { getBooks, getHadith, getRandomHadith, hadithHref } from "@/lib/thaqalayn";
import { useResource } from "@/lib/use-resource";
import HadithCard from "./hadith-card";
import { CorpusHeading, CorpusLinks, ResourceStatus } from "./thaqalayn-library";

export default function HadithReader({ bookId, id }: { bookId?: string; id?: number }) {
  const random = id === undefined;
  const load = useCallback((signal: AbortSignal) => random
    ? getRandomHadith(bookId, signal)
    : getHadith(bookId || "", id, signal), [bookId, id, random]);
  const resource = useResource(load);
  const books = useResource(getBooks);
  const book = books.data?.find((item) => item.bookId === resource.data?.bookId);
  return <>
    <CorpusHeading title={random ? "A narration to reflect on" : `Hadith ${id}`} description={random ? "Discover a narration from the whole corpus or a selected collection." : "A dedicated, shareable page for the complete source narration."} />
    <CorpusLinks />
    {random && <div className="library-toolbar"><form action="/hadith/random" className="random-form"><label>Collection <select name="book" key={books.data?.length} defaultValue={bookId || ""}><option value="">Entire corpus</option>{books.data?.map((item) => <option key={item.bookId} value={item.bookId}>{item.BookName} · {item.volume || 1} · {item.author}</option>)}</select></label><button className="button secondary">Choose</button></form>
      <button className="button" onClick={resource.retry}>Another random narration</button></div>}
    <ResourceStatus error={resource.error} retry={resource.retry} loading={!resource.data} />
    <ResourceStatus error={books.error} retry={books.retry} loading={!books.data} />
    {resource.data && <>
      <div className="hadith-links"><Link className="text-button" href={hadithHref(resource.data.bookId)}>Back to collection</Link>
        <Link className="text-button" href={hadithHref(resource.data.bookId, resource.data.id)}>Permanent link</Link></div>
      <HadithCard hadith={resource.data} detail />
      {book && <nav className="pagination panel" aria-label="Adjacent narrations">
        {resource.data.id > book.idRangeMin && <Link className="button secondary" href={hadithHref(book.bookId, resource.data.id - 1)}>Previous hadith</Link>}
        {resource.data.id < book.idRangeMax && <Link className="button secondary" href={hadithHref(book.bookId, resource.data.id + 1)}>Next hadith</Link>}
      </nav>}
    </>}
  </>;
}
