# Waqt

A responsive Islamic hub built with Next.js App Router, React, TypeScript, Tailwind CSS, Motion, and Lucide. Quran and Dua data come from [UmmahAPI](https://ummahapi.com/api/docs); notes and bookmarks remain in the browser.

## Run locally

Use Node.js 20.9 or newer (Node 22 or 24 LTS recommended).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Set `QURAN_API` to your UmmahAPI key. `UMMAH_API_KEY` is also supported. The existing Netlify `QURAN_API` variable requires no rename. No key is required for UmmahAPI's anonymous tier. The requested `NEXT_PUBLIC_UMMAH_API_KEY` is accepted for compatibility, but prefer the server-only names: public-prefixed variables should never hold secrets.

```sh
npm test
npm run typecheck
npm run build
npm start
```

## Structure

- `src/app/`: main layout, global styles, and restricted server-side UmmahAPI proxy.
- `src/components/`: responsive shell, prayer dashboard, Surah/Juz reader, audio controls, Dua library, saved library, and note editor.
- `src/lib/`: validated API adapters, data/storage schemas, media parsing, prayer calculations, and tests.
- `scripts/prepare-legacy.mjs`: copies the original static app into `public/timetable/` during production builds.
- Original `src/index.html`, `src/js/`, `src/css/`, and `src/data/`: retained timetable, calendar, event, azaan, and PDF tools.

## Features and behavior

- Desktop sidebar, mobile bottom navigation, hash-addressable tabs, system-aware light/dark theme, reduced-motion support, Arabic typography, and accessible native dialogs.
- Prayer dashboard defaults to Lucknow. Search Open-Meteo cities or explicitly request geolocation; the selected city's IANA time zone drives dates and times, independently of the device zone.
- Original Shia calculations are preserved: Fajr at -18°, Saher at -19° minus ten minutes, sunrise plus one minute, noon minus one minute, and evening -4.5° minus five minutes. Asr/Isha are not assigned new calculation rules. Polar missing events are marked unavailable rather than estimated.
- Hijri dates use the browser's calculated Islamic calendar; local moon-sighting dates may differ.
- Complete UmmahAPI Surah and Juz indexes, Arabic/transliteration, toggleable translations, Ibn Kathir tafsir, and per-ayah Mishary Alafasy audio with pause, next, auto-advance, and repeat.
- Every ayah can be bookmarked or annotated. **My Library → Saved Ayats** is the dedicated saved-verse view; **Notes** includes annotated verses even without bookmarks. Opening a saved reference scrolls to the corresponding ayah.
- Notes support Markdown bold, italics, lists, and links, with automatic embedded YouTube, direct audio, and direct video previews. Raw HTML is not executed. Other URLs appear as source links, not arbitrary iframes. Media depends on the source's availability/embedding policy and loads from third-party hosts.
- Dua search, all provider categories, source references, provider authenticity notes, and favorite bookmarks. Sources are displayed as supplied, not independently graded. [ThaqalaynAPI](https://github.com/MohammedArab1/ThaqalaynAPI) is a separate hadith corpus, not substituted for Quran or presented as a verified Dua dataset.
- Versioned, validated local storage, cross-tab updates, explicit save failures, and JSON export/import with replacement confirmation. Notes are not encrypted; use only on trusted devices. There is no account, cloud sync, or backend database.

## Netlify

The root `netlify.toml` runs `npm run build` and publishes `.next`; Netlify's automatic Next.js adapter handles server rendering and route handlers. Keep the existing `QURAN_API` variable available to builds/functions and redeploy. A plain static-file host cannot run this application's API proxy.

Development and production builds preserve the original application at `/timetable/`, which redirects to `/timetable/index.html` (including its original external CDN dependencies). The original documentation is retained in `public/README.md`.
