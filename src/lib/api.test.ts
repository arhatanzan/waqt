import { afterEach, describe, expect, it, vi } from "vitest";
import { allowedPath } from "./api-path";
import { getAyahAudio, getDuas, getReading, getSurahs } from "./api";

afterEach(() => vi.unstubAllGlobals());
describe("server API allowlist", () => {
  it.each(["quran/surahs", "quran/surah/114", "quran/juz/30", "quran/surah/2/ayah/255", "duas", "tafsir/ibn_kathir/surah/1/ayah/1"])("allows %s", (path) => expect(allowedPath(path)).toBe(true));
  it.each(["quran/surah/115", "quran/juz/31", "../duas", "https://example.com", "quran/surahs?key=secret", "quran/surah/0"])("rejects %s", (path) => expect(allowedPath(path)).toBe(false));
});
describe("UmmahAPI response adapters", () => {
  function respond(data: unknown, status = 200) {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(status === 200 ? { success: true, data } : data), { status })));
  }
  it("reads the surah index and rejects unexpected shapes", async () => {
    respond({ surahs: [] }); expect(await getSurahs()).toEqual({ surahs: [] });
    respond({ chapters: [] }); await expect(getSurahs()).rejects.toThrow();
  });
  it("reads surah/juz verses", async () => {
    respond({ verses: [] }); expect(await getReading("juz", 1)).toEqual({ verses: [] });
  });
  it("selects ayah audio from the real single-ayah response envelope", async () => {
    respond({ audio: [
      { reciter_id: 1, ayah_audio: "https://everyayah.com/001001.mp3" },
      { reciter_id: 12 },
      { reciter_id: 13, ayah_audio: null },
    ] });
    expect(await getAyahAudio("1:1")).toBe("https://everyayah.com/001001.mp3");
  });
  it("reads referenced duas and categories", async () => {
    respond({ duas: [], categories: [] }); expect(await getDuas()).toEqual({ duas: [], categories: [] });
  });
  it("accepts a source-backed dua with no additional reference", async () => {
    respond({ duas: [{ id: 13, category: "wudu", title: "Test", arabic: "Test", transliteration: "Test", translation: "Test", source: "Source collection", reference: null }], categories: [] });
    expect((await getDuas()).duas[0].reference).toBeNull();
  });
  it("surfaces API failures rather than returning empty content", async () => {
    respond({ error: "Upstream unavailable" }, 502);
    await expect(getSurahs()).rejects.toThrow("Upstream unavailable");
  });
});
