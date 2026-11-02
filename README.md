# Waqt

A responsive Islamic hub built with Next.js App Router, React, TypeScript, Tailwind CSS, Motion, and Lucide. Quran data comes from [UmmahAPI](https://ummahapi.com/api/docs). Hadiths, supplication searches, and the ingredient guide use [ThaqalaynAPI](https://github.com/MohammedArab1/ThaqalaynAPI) exclusively; notes and bookmarks remain in the browser.

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

- `src/app/`: dedicated pages, shared layout, global styles, and restricted server-side Quran/Thaqalayn proxies.
- `src/components/`: responsive shell, prayer dashboard, Surah/Juz reader, full hadith library, ingredient guide, saved library, and note editor.
- `src/lib/`: validated API adapters, data/storage schemas, media parsing, prayer calculations, and tests.
- `scripts/prepare-legacy.mjs`: copies the original static app into `public/timetable/` during production builds.
- Original `src/index.html`, `src/js/`, `src/css/`, and `src/data/`: retained timetable, calendar, event, azaan, and PDF tools.

## Features and behavior

- Dedicated `/prayer`, `/quran`, `/hadith`, `/dua`, `/ingredients`, and `/saved` pages with desktop/mobile navigation, system-aware light/dark theme, reduced-motion support, Arabic typography, and accessible native dialogs. Old root hash links such as `/#dua` migrate to the corresponding page. Theme, sidebar, and library state persist across navigation.
- The header toggle collapses the desktop/tablet sidebar to a 70px icon rail and expands the content area. The preference persists across reloads. At phone widths (700px and below), bottom navigation replaces the sidebar.
- The Prayer tab's Azan player provides native play/pause, seeking, and volume controls (where supported by the browser). It remains accessible when the sidebar is collapsed and on phones. Leaving Prayer removes the player and stops playback.
- Prayer dashboard defaults to Lucknow. Search Open-Meteo cities or explicitly request geolocation; the selected city's IANA time zone drives dates and times, independently of the device zone.
- Original Shia calculations are preserved: Fajr at -18°, Saher at -19° minus ten minutes, sunrise plus one minute, noon minus one minute, and evening -4.5° minus five minutes. Asr/Isha are not assigned new calculation rules. Polar missing events are marked unavailable rather than estimated.
- Hijri dates use the browser's calculated Islamic calendar; local moon-sighting dates may differ.
- Complete UmmahAPI Surah and Juz indexes, Arabic/transliteration, toggleable translations, Ibn Kathir tafsir, and per-ayah Mishary Alafasy audio with pause, next, auto-advance, and repeat.
- Every ayah can be bookmarked or annotated. **My Library → Saved Ayats** is the dedicated saved-verse view; **Notes** includes annotated verses even without bookmarks. Opening a saved reference scrolls to the corresponding ayah.
- Notes support Markdown bold, italics, lists, and links, with automatic embedded YouTube, direct audio, and direct video previews. Raw HTML is not executed. Other URLs appear as source links, not arbitrary iframes. Media depends on the source's availability/embedding policy and loads from third-party hosts.
- `/hadith` lists every book and volume from Thaqalayn's live catalogue, without a hardcoded selection. `/hadith/[bookId]` browses every narration with provider pagination, first/previous/next/last links, page jumping, and category/chapter/grading filters. Book descriptions are metadata, never presented as duas.
- `/hadith/search` supports Arabic/English full-text search across the entire corpus or any book (`|` separates alternatives). Search uses word forms rather than substrings. Text search and category/chapter/grading filters are separate provider modes.
- `/hadith/[bookId]/[id]` provides shareable complete narrations: Arabic, English, available French, author/translator, category/chapter references, sanad/matn, original source links, and all supplied gradings. `/hadith/random` supports the whole corpus or a selected book. Waqt does not independently grade narrations.
- `/dua` searches the Thaqalayn corpus for supplication-related narrations (initial query: `supplication|invocation|dua|دعاء`). Thaqalayn has no dedicated dua endpoint; matches may discuss supplication rather than contain a standalone dua. No UmmahAPI dua requests or fallbacks exist, and the Ummah proxy rejects `duas`.
- `/ingredients` includes the entire Thaqalayn ingredient dataset with alternative names, source-dependent statuses, and notes, originally sourced from Al Maarif. It is not a new religious ruling or medical advice.
- Thaqalayn uses V2 for catalogue, random, and ingredients, and the documented **V3 beta** for paginated browsing, filtering, search, and individual narrations. Responses are validated; contract changes and outages produce explicit errors with retry rather than silent empty content or another-provider fallbacks. Non-random upstream responses are cached for 24 hours; random responses are not cached. The provider's rate limits are surfaced to the user.
- Hadith bookmarks use stable `(bookId, id)` references and are available in My Library, including narrations saved from Dua search. Older backups are accepted; legacy numeric dua bookmarks remain in exports but are not reinterpreted as unrelated hadiths or resolved against UmmahAPI.
- Versioned, validated local storage, cross-tab updates, explicit save failures, and JSON export/import with replacement confirmation. Notes are not encrypted; use only on trusted devices. There is no account, cloud sync, or backend database.

## Admin login

Set both `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env.local` for local development, then restart `npm run dev`. Deployment variables are not automatically available locally; configure them separately in the host's environment and redeploy for production. Missing variables produce an explicit configuration error rather than an invalid-password error.

Open an ayah's note editor and select **Admin Login**. Successful login creates an eight-hour signed, HTTP-only, SameSite cookie (Secure in production); passwords are never saved in browser storage. The server verifies the session when opening another note, and Logout clears the cookie. Changing either credential invalidates existing sessions.

Authentication does not yet connect notes to GitHub or restrict local notes: saves still use browser storage. GitHub synchronization and server-side note permissions remain unimplemented.

## Netlify

The root `netlify.toml` runs `npm run build` and publishes `.next`; Netlify's automatic Next.js adapter handles server rendering and route handlers. Keep the existing `QURAN_API` variable available to builds/functions and redeploy. A plain static-file host cannot run this application's API proxy.

Development and production builds preserve the original application at `/timetable/`, which redirects to `/timetable/index.html` (including its original external CDN dependencies). The original documentation is retained in `public/README.md`.
