export function allowedPath(path: string) {
  return /^(quran\/surahs|quran\/(surah\/([1-9]|[1-9]\d|10\d|11[0-4])(?:\/ayah\/([1-9]|[1-9]\d|[12]\d\d))?|juz\/([1-9]|[12]\d|30))|duas|tafsir\/ibn_kathir\/surah\/([1-9]|[1-9]\d|10\d|11[0-4])\/ayah\/([1-9]|[1-9]\d|[12]\d\d))$/.test(path);
}
