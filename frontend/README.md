# CareBridge AI — Frontend

**React + Vite + TypeScript** (module 1 of the architecture). Talks to the **FastAPI** backend (module 2),
uses **Supabase** for auth and file storage (module 6) and deploys to **Vercel** (module 7).

## Quick start
```bash
npm install
cp .env.example .env      # defaults to demo mode (VITE_USE_MOCK=true)
npm run dev               # http://localhost:5173
npm run build             # production build in dist/
npm run typecheck         # strict TypeScript check
```
Demo mode needs no backend. Sign in with the pre-filled credentials (Patient or Caregiver).

## Stack
| Concern | Choice |
|---|---|
| UI | React 18, function components + hooks |
| Build | Vite 5, TypeScript (strict) |
| Routing | react-router-dom 6 (`BrowserRouter`; Vercel rewrite included) |
| State | tiny external store (`src/store.ts`) with `useSyncExternalStore`, persisted to `localStorage` |
| Validation | `zod` schemas that mirror the backend Pydantic models (`src/lib/schema.ts`) |
| Auth / storage | `@supabase/supabase-js` (optional; falls back to a demo session) |
| i18n | English is the only language written in the code. 40+ languages are translated automatically (Google Translate) and cached |
| App | Installable PWA (manifest + service worker) and a Capacitor wrapper for Android and iOS |
| Charts / QR | hand-written SVG, no chart library |
| Styling | one CSS file (`src/styles.css`), CSS variables from the CareBridge palette, CSS 3D transforms |

## Languages (automatic, nothing hand-translated)
- Default is **English**. The picker lists 40+ languages (Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Urdu, Arabic, Spanish, French, Chinese, Japanese and more). Right-to-left languages flip the layout.
- Every on-screen string is written once in English as `t('...')`. When a language is chosen, `src/translate.ts` translates the strings in batches, caches them in `localStorage`, and pre-fetches every other known screen in the background (`scripts/extract-strings.mjs` lists the strings; it only lists English, it does not translate).
- `VITE_TRANSLATE_PROVIDER=google` (default) calls the free Google Translate web endpoint from the browser. It needs no key but is unofficial and rate-limited. **For production, set `api` and implement `POST /api/translate` with Google Cloud Translation** (500k characters per month are free) or any provider.
- Medicine names, doses and numbers come from your document and are never sent for translation. A banner reminds users that text is machine-translated and offers "Show English".
- Why not the Google Translate page widget? It rewrites the page, which makes React show stale text and can crash it. Translating strings keeps the UI correct.

## Web and mobile app (one codebase)
- **Web:** `npm run dev` / deploy to Vercel.
- **Installable (PWA):** `public/manifest.webmanifest`, `public/sw.js` (offline shell, never caches API or translation calls) and icons. Android/Chrome shows an install prompt (Settings, avatar menu, landing page). iPhone: Share, then Add to Home Screen (instructions are in the app).
- **Native Android / iOS (Capacitor):**
  ```bash
  npm install
  npm run build
  npx cap add android      # needs Android Studio
  npx cap add ios          # needs Xcode on a Mac
  npm run cap:sync         # build + copy web assets into the native projects
  npm run cap:android      # or cap:ios, then run from the IDE
  ```
  The native app schedules **daily dose reminders with the OS** (works when the app is closed) through `@capacitor/local-notifications`, handles the Android back button, and respects quiet hours. Set the app icon and splash with `npx @capacitor/assets generate`.
- **Google sign-in:** enable the Google provider in Supabase (Auth, Providers). For the native app also add the deep-link redirect URL.

## Folder map
```
src/
  main.tsx, App.tsx          entry, routes, global effects (tilt, scroll, session restore)
  store.ts, actions.ts       state + every user action (optimistic, then syncs through api)
  i18n.tsx, translate.ts     t("English") → current language, 40+ languages, batching + cache
  native.ts, pwa.ts          Capacitor reminders/back button, install prompt, service worker
  auth.ts                    Supabase auth (or demo)
  api/client.ts              ALL network calls, typed, validated with zod
  mock/                      demo backend + demo Telugu strings
  lib/                       validation rules, formatting, schema, session
  components/                ui primitives, modal sheets, shell, toasts
  pages/                     Landing, Auth, Home, Plan, Meds, Recovery, Appts, Records,
                             Family, Ask, Upload, Review, Settings
```

## Connect the FastAPI backend
Set `VITE_USE_MOCK=false` and `VITE_API_URL` (or use the dev proxy: `/api` → `http://localhost:8000`).
Every request sends `Authorization: Bearer <Supabase access token>`.

| Method + path | Purpose | Request → Response |
|---|---|---|
| `POST /api/documents` | upload PDF/JPG/PNG (multipart `file`) | → `{documentId, blurry, extraction?, confidence?}` |
| `POST /api/plans` | generate plan from the **reviewed** extraction | `{documentId, extraction}` → `{version, planId?}` |
| `GET /api/plans/current/pdf` | recovery sheet PDF (ReportLab / HTML-to-PDF) | → `application/pdf` |
| `POST /api/translate` | only when `VITE_TRANSLATE_PROVIDER=api`. Keep `{placeholders}`, numbers, units, drug names | `{strings[], target}` → `{translations:{[en]:string}}` |
| `POST /api/chat` | answer only from the patient's own summary | `{question, lang}` → `{answer, line}` (`line` = 0-based source line or null) |
| `POST /api/dose-events` | log a dose | `DoseEvent` |
| `PUT /api/appointments/{id}` | save appointment + status | `Appt` |
| `PUT/DELETE /api/caregivers/{id}` | invite, change permissions, revoke | `Caregiver` |
| `POST /api/shares`, `DELETE /api/shares/{token}` | expiring share link | `{expires}` → `{token}` |
| `GET /api/account/export`, `DELETE /api/account` | export / delete all data | JSON blob / 204 |

Response shapes are defined in `src/lib/schema.ts`. Keep the Pydantic models in sync with them.

### Backend rules the UI relies on
- **Row Level Security** in Supabase: every row scoped to the patient; caregivers read only what the patient shares.
- **Extraction** returns per-field OCR confidence (0–100). Fields below 75 are flagged for review.
- **Safety:** urgent words (fever, breathing, chest pain …) are checked in the browser first and show a call-108 banner. Do not move this behind the network.
- **Never** return dosing advice that is not in the document. `/api/chat` must say "not in your summary" instead of guessing.

## Deploy to Vercel
Import the repo, framework = Vite, build command `npm run build`, output `dist`.
Add the env vars from `.env.example`. `vercel.json` already contains the SPA rewrite, cache headers and security headers.
To proxy `/api` to Render, add a rewrite: `{ "source": "/api/(.*)", "destination": "https://YOUR-API.onrender.com/api/$1" }` **before** the SPA rule.

## Behaviour notes
- Plan status (Draft / Needs Clarification / Validation Failed / Ready to Use) is computed by `src/lib/plan.ts`. It never claims clinical approval.
- Reminders run only while the app is open (browser notifications need permission). Real push needs a service worker + backend scheduler.
- The share-link QR is a decorative pattern. Generate a real QR server-side.
- Demo data is synthetic. Have a person verify translated medical text before real use.
