import { describe, expect, it } from "vitest";
import { emptyLibrary, librarySchema } from "./models";
import { parseMedia } from "./media";

describe("library persistence contract", () => {
  it("round trips bookmarks, dua favorites, and ayah-linked rich notes", () => {
    const library = {
      ...emptyLibrary, ayats: ["2:255"], duas: [1, 23],
      notes: { "2:255": { text: "**Reflect**\nhttps://youtu.be/dQw4w9WgXcQ\nhttps://example.com/lesson.mp3", updatedAt: new Date().toISOString() } },
    };
    expect(librarySchema.parse(JSON.parse(JSON.stringify(library)))).toEqual(library);
  });
  it("rejects malformed or oversized imported data", () => {
    expect(librarySchema.safeParse({ ...emptyLibrary, version: 2 }).success).toBe(false);
    expect(librarySchema.safeParse({ ...emptyLibrary, ayats: ["0:0"] }).success).toBe(false);
    expect(librarySchema.safeParse({ ...emptyLibrary, notes: { "1:1": { text: "a".repeat(20001), updatedAt: "yesterday" } } }).success).toBe(false);
  });
  it("loads existing backups without losing legacy dua IDs or notes", () => {
    const legacy = { version: 1, ayats: ["2:255"], duas: [13], notes: {} };
    expect(librarySchema.parse(legacy)).toEqual({ ...legacy, hadiths: [] });
  });
  it("stores hadith references by book and ID without collisions", () => {
    const library = { ...emptyLibrary, hadiths: [{ bookId: "Book-A", id: 1 }, { bookId: "Book-B", id: 1 }] };
    expect(librarySchema.parse(JSON.parse(JSON.stringify(library)))).toEqual(library);
    expect(librarySchema.safeParse({ ...emptyLibrary, hadiths: [{ bookId: "Book-A", id: 0 }] }).success).toBe(false);
    expect(librarySchema.safeParse({ ...emptyLibrary, hadiths: [{ bookId: "../other", id: 1 }] }).success).toBe(false);
  });
});
describe("safe live media previews", () => {
  it.each(["https://youtu.be/dQw4w9WgXcQ", "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://youtube.com/shorts/dQw4w9WgXcQ"])("embeds recognized YouTube URLs: %s", (url) => {
    expect(parseMedia(url)[0]).toMatchObject({ kind: "youtube", embed: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" });
  });
  it("recognizes recordings with query strings and removes duplicate URLs", () => {
    expect(parseMedia("https://example.com/audio.MP3?token=public https://example.com/audio.MP3?token=public")).toHaveLength(1);
    expect(parseMedia("https://example.com/audio.m4a?a=1")[0].kind).toBe("audio");
  });
  it("does not turn arbitrary hosts, HTML, or executable URLs into embeds", () => {
    expect(parseMedia("javascript:alert(1) data:text/html,test")).toEqual([]);
    expect(parseMedia("https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ")[0].kind).toBe("link");
    expect(parseMedia("https://youtu.be/not-valid")[0].kind).toBe("link");
  });
  it("detects links pasted inside Markdown and ordinary prose", () => {
    expect(parseMedia("[Recording](https://example.com/talk.mp3).")[0]).toEqual({ kind: "audio", url: "https://example.com/talk.mp3" });
  });
});
