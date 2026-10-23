# Rollercoaster Weight Tracker

A lightweight React app for tracking weight, activities, and trends. Features real-time graphs, 7-day forecasts, local insights, easy data export, and an installable PWA shell.

**Tech stack:** Vite + React 18, Recharts, Supabase, PWA service worker.

## Quick start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`.

## Configuration

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then run `supabase/setup.sql` in the Supabase SQL editor. Without credentials the app still boots, but it shows a banner explaining what is missing and no data can be loaded or saved.

## Commands

```bash
npm run dev        # dev server
npm run build      # production build
npm run preview    # serve the production build
npm run lint       # eslint (js + jsx), zero warnings allowed
npm test           # vitest
```

## Deployment to Vercel

1. Push to GitHub.
2. Go to [vercel.com](https://vercel.com) and import your repo.
3. Deploy. The app is fully static and serverless.

## Features

### Tracking & Data

- 📊 Real-time weight graphs with moving averages (7 & 30-day)
- 📅 Calendar view with quick-add weight entries
- 🏋️ Activity logging (gym, bike, boxing, running) plus free-form notes
- 📥 Import external weight data (JSON/CSV) — merges by person + date
- 📤 Export data as JSON, CSV, or AI-ready prompt

### Analytics

- 🎯 Goal tracking and progress zones
- 📈 7-day trend projection with linear forecasting
- 💡 Local insights (trend analysis, weekly pace, consistency metrics)
- 📊 Weekly & monthly summary reports with min/max/avg stats

### Performance & Offline

- 🌐 **PWA support** — install on home screen
- 📴 **Offline shell** — the app shell and static assets are cached, so the UI loads without a connection. Data lives in Supabase, so reading and writing still needs the network.
- ⚡ Virtual scrolling for large weight lists (100+ entries)
- 📦 Route-level code splitting plus per-dependency chunks: the first load is **~67 kB gzipped** (React + router + CSS). The charting stack (Recharts + d3, ~114 kB gzip) and the Supabase client (~50 kB gzip) are only fetched when you actually open the graph or the data is needed.

## Data model

The `weights` table has a `UNIQUE(person_id, date)` constraint: **one entry per person per day**. Saving a second entry for the same day updates the existing row instead of failing.

## PWA Features

The app is installable as a Progressive Web App:

- On mobile: tap share → "Add to home screen"
- On desktop: click install icon in browser address bar
- Navigations are served network-first so a new deploy is picked up immediately; the cached shell is only the offline fallback
- API traffic is never cached by the service worker — stale weights are worse than no cache

## Security

There is **no authentication** yet: the app ships with the Supabase anon key and relies on the database RLS policies in `supabase/setup.sql`. Anyone with the URL can read the data. Adding Supabase Auth is the natural next step before exposing the app publicly.
