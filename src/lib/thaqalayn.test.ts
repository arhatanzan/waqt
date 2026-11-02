import { afterEach, describe, expect, it, vi } from "vitest";
import { allowedPath, allowedThaqalaynPath, thaqalaynQuery } from "./api-path";
import { getBooks, getHadith, getHadiths, getIngredients, getRandomHadith, hadithHref, hadithQuerySchema, pageHref, safeSourceUrl } from "./thaqalayn";

afterEach(() => vi.unstubAllGlobals());
const bookId = "Al-Amali-Mufid";
const hadith = {
  bookId, id: 1, book: "Al-Amali", volume: 1,
  category: "The First Assembly", chapter: "Good Deeds",
  englishText: "Full narration", arabicText: "Arabic text", frenchText: "French text",
  URL: "https://thaqalayn.net/hadith/13/1/1/1",
  thaqalaynSanad: "Chain", thaqalaynMatn: "Text",
  gradingsFull: [{ author: { name_en: "Grader", name_ar: null, link: null, death_date: null }, grade_ar: "Grade", grade_en: null, reference_en: "Reference" }],
};
function respond(data: unknown, status = 200) {
  const fetch = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify(data), { status })));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("Thaqalayn proxy contract", () => {
  it.each(["v2/allbooks", "v2/ingredients", "v2/random", `v2/${bookId}/random`, `v3/${bookId}`, `v3/${bookId}/1`, "v3/query", `v3/query/${bookId}`, "v3/Al-Imama-wa’l-Tabsira-min-al-Hayra-Babawayh"])("allows documented endpoint %s", (path) => {
    expect(allowedThaqalaynPath(path)).toBe(true);
  });
  it.each(["v2/book/test", "v3/../random", "v3/query/../../test", "v3/test/0", "v3/test/-1", "v3/test/1/extra", "v3/test?key=secret", "v2/allbooks/random", "v2/duas", "v3/%2f", "v3/query/"])("rejects unsupported endpoint %s", (path) => {
    expect(allowedThaqalaynPath(path)).toBe(false);
  });
  it("blocks UmmahAPI duas at the proxy boundary", () => expect(allowedPath("duas")).toBe(false));
  it("forwards and encodes Arabic, alternatives, language, and pagination", () => {
    const query = new URLSearchParams({ q: "دعاء|supplication", lang: "any", page: "3", limit: "20" });
    expect(new URLSearchParams(thaqalaynQuery("v3/query", query)).get("q")).toBe("دعاء|supplication");
    expect(new URLSearchParams(thaqalaynQuery("v3/query", query)).get("page")).toBe("3");
  });
  it("forwards category, chapter, and grading filters", () => {
    const query = new URLSearchParams({ category: "The First Assembly", chapter: "Registering Good Deeds", grading: "Sahih" });
    expect(thaqalaynQuery(`v3/${bookId}`, query)).toBe(query.toString());
  });
  it.each(["page=0", "page=1.5", "limit=101", "q=", "lang=fr&q=test", "q=test&q=other", "url=https://evil.example", "q=test&chapter=1"])("rejects invalid search parameters %s", (query) => {
    expect(() => thaqalaynQuery("v3/query", new URLSearchParams(query))).toThrow();
  });
  it("does not allow arbitrary queries on catalogue and random endpoints", () => {
    expect(() => thaqalaynQuery("v2/allbooks", new URLSearchParams("q=test"))).toThrow();
    expect(() => thaqalaynQuery("v2/random", new URLSearchParams("bookId=test"))).toThrow();
  });
});

describe("Thaqalayn content adapters", () => {
  it("retains every catalogue book without manufacturing duas", async () => {
    const books = Array.from({ length: 45 }, (_, i) => ({
      bookId: `Collection-${i}`, BookName: `Book ${i}`, author: "Author", idRangeMin: 1, idRangeMax: 100,
      englishName: "English name", translator: "Translator", volume: i + 1, bookDescription: "About the book", bookCover: null,
    }));
    const fetch = respond(books);
    expect(await getBooks()).toEqual(books);
    expect(fetch).toHaveBeenCalledExactlyOnceWith("/api/thaqalayn/v2/allbooks", { signal: undefined });
    expect(books[0]).not.toHaveProperty("arabic");
  });
  it("preserves complete hadith texts, chains, references, and gradings", async () => {
    respond(hadith);
    expect(await getHadith(bookId, 1)).toEqual(hadith);
  });
  it("uses provider pagination beyond the first page without truncating the corpus", async () => {
    const response = { data: [hadith], pagination: { page: 118, limit: 20, total: 2343, totalPages: 118, hasNext: false, hasPrev: true } };
    const fetch = respond(response);
    expect(await getHadiths(bookId, { page: "118" })).toEqual(response);
    expect(fetch).toHaveBeenCalledExactlyOnceWith(`/api/thaqalayn/v3/${bookId}?page=118&limit=20`, { signal: undefined });
  });
  it("searches all books or a selected book using the real query endpoints", async () => {
    const fetch = respond({ data: [], pagination: { page: 2, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: true } });
    await getHadiths(undefined, { q: "دعاء|supplication", lang: "ar", page: "2" });
    const url = new URL(fetch.mock.calls[0][0], "https://waqt.test");
    expect(url.pathname).toBe("/api/thaqalayn/v3/query");
    expect(url.searchParams.get("q")).toBe("دعاء|supplication");
    expect(url.searchParams.get("page")).toBe("2");
    await getHadiths(bookId, { q: "mercy" });
    expect(fetch.mock.calls[1][0]).toContain(`/v3/query/${bookId}?`);
  });
  it("supports global and book-specific random narrations", async () => {
    const fetch = respond(hadith);
    await getRandomHadith();
    await getRandomHadith(bookId);
    expect(fetch.mock.calls.map((call) => call[0])).toEqual(["/api/thaqalayn/v2/random", `/api/thaqalayn/v2/${bookId}/random`]);
  });
  it("retains the complete ingredient information", async () => {
    const data = [{ ingredient: "Test", statuses: ["Source-dependent"], otherNames: ["Other"], info: ["Full note"], unknown: null }];
    respond(data);
    expect(await getIngredients()).toEqual(data);
  });
  it.each([404, 429, 502])("surfaces provider status %s without another provider fallback", async (status) => {
    const fetch = respond({ error: "Provider unavailable" }, status);
    await expect(getHadiths(undefined, { q: "supplication" })).rejects.toThrow("Provider unavailable");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).not.toContain("ummah");
  });
  it("rejects malformed provider data without converting it to successful empty content", async () => {
    respond({ success: true, data: { duas: [] } });
    await expect(getBooks()).rejects.toThrow("unexpected response");
  });
  it("propagates cancellation without a fallback request", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetch = vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError"));
    vi.stubGlobal("fetch", fetch);
    await expect(getBooks(controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
  });
  it("keeps all filters and book scope in dedicated page links", () => {
    const link = pageHref("/hadith/search", { q: "mercy", lang: "en", page: "1" }, 3, bookId);
    expect(link).toBe(`/hadith/search?q=mercy&lang=en&page=3&book=${bookId}`);
    expect(hadithHref("Al-Imama-wa’l-Tabsira-min-al-Hayra-Babawayh", 1)).toContain("%E2%80%99");
  });
  it("rejects malformed URL filter types and page numbers", () => {
    expect(hadithQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(hadithQuerySchema.safeParse({ q: ["one", "two"] }).success).toBe(false);
    expect(hadithQuerySchema.safeParse({ page: "3", lang: "ar" }).success).toBe(true);
  });
  it("only makes safe provider URLs clickable", () => {
    expect(safeSourceUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeSourceUrl("https://thaqalayn.net/hadith/1")).toBe("https://thaqalayn.net/hadith/1");
  });
});
