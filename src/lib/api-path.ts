export function allowedPath(path: string) {
  return /^(quran\/surahs|quran\/(surah\/([1-9]|[1-9]\d|10\d|11[0-4])(?:\/ayah\/([1-9]|[1-9]\d|[12]\d\d))?|juz\/([1-9]|[12]\d|30))|tafsir\/ibn_kathir\/surah\/([1-9]|[1-9]\d|10\d|11[0-4])\/ayah\/([1-9]|[1-9]\d|[12]\d\d))$/.test(path);
}

export function allowedThaqalaynPath(path: string) {
  const [version, resource, detail, ...extra] = path.split("/");
  if (extra.length || !resource) return false;
  if (version === "v2" && ["allbooks", "ingredients", "random"].includes(resource)) return detail === undefined;
  if (version === "v3" && resource === "query") return detail === undefined || validBookId(detail);
  if (!validBookId(resource)) return false;
  if (version === "v2") return detail === "random";
  return version === "v3" && (detail === undefined || /^[1-9]\d*$/.test(detail));
}

export function validBookId(value: string) {
  return !["allbooks", "ingredients", "random", "query", "book", "hadith"].includes(value) &&
    /^[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*$/u.test(value);
}

export function thaqalaynQuery(path: string, search: URLSearchParams) {
  const parts = path.split("/");
  const isSearch = parts[0] === "v3" && parts[1] === "query";
  const isList = parts[0] === "v3" && parts.length === 2 && !isSearch;
  const allowed = isSearch ? ["q", "page", "limit", "lang"] : isList ? ["page", "limit", "chapter", "category", "grading"] : [];
  const result = new URLSearchParams();
  for (const [key, value] of search) {
    if (!allowed.includes(key) || result.has(key)) throw new Error("Unsupported or duplicate query parameter.");
    if (key === "page" || key === "limit") {
      if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) || (key === "limit" && Number(value) > 100)) {
        throw new Error("Page must be a positive integer; limit must be between 1 and 100.");
      }
    } else if (key === "lang") {
      if (!["any", "en", "ar"].includes(value)) throw new Error("Unsupported search language.");
    } else if (!value.trim() || value.length > 1000) {
      throw new Error("Search and filter values must contain between 1 and 1000 characters.");
    }
    result.set(key, value);
  }
  if (isSearch && !result.has("q")) throw new Error("A search query is required.");
  return result.toString();
}
