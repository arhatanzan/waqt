"use client";

import { useState } from "react";
import { getIngredients } from "@/lib/thaqalayn";
import { useResource } from "@/lib/use-resource";
import { ProviderText } from "./hadith-card";
import { CorpusHeading, CorpusLinks, ResourceStatus } from "./thaqalayn-library";

export default function Ingredients() {
  const resource = useResource(getIngredients);
  const [query, setQuery] = useState("");
  const filtered = resource.data?.filter((item) =>
    [item.ingredient, ...(item.otherNames || []), ...(item.statuses || []), ...(item.info || []), ...(item.unknown || [])].join(" ").toLowerCase().includes(query.toLowerCase()));
  return <>
    <CorpusHeading title="Ingredient guide" description="The complete ingredient and ruling dataset served by ThaqalaynAPI, originally sourced from Al Maarif." />
    <CorpusLinks />
    <p className="notice">Provider rulings are reproduced as supplied. This is not a new ruling or medical advice; consult the original source and your religious authority for your circumstances.</p>
    <div className="library-toolbar"><div className="search-field"><input aria-label="Search ingredients" placeholder="Search ingredients, alternative names, or rulings..." value={query} onChange={(event) => setQuery(event.target.value)} /></div></div>
    <ResourceStatus error={resource.error} retry={resource.retry} loading={!resource.data} />
    {resource.data && <p className="muted collection-count">{filtered?.length} of {resource.data.length} ingredients · <a className="text-button" href="https://al-m.ca/halalguide/" target="_blank" rel="noopener noreferrer">Original Al Maarif guide</a></p>}
    <div className="book-grid">{filtered?.map((item) => <article className="panel book-card" key={item.ingredient}>
      <h2>{item.ingredient}</h2>
      {item.otherNames?.length ? <p className="muted">Also known as: {item.otherNames.join(", ")}</p> : null}
      {item.statuses?.length ? <ul>{item.statuses.map((status, index) => <li key={index}><ProviderText text={status} /></li>)}</ul> : <p className="muted">No status supplied.</p>}
      {item.info?.map((info, index) => <ProviderText key={index} text={info} />)}
      {item.unknown?.filter(Boolean).map((text, index) => <ProviderText key={index} text={text} />)}
    </article>)}</div>
    {resource.data && !filtered?.length && <div className="empty panel">No ingredients match your search.</div>}
  </>;
}
