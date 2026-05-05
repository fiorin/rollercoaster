# Rollercoaster Weight Tracker

A lightweight React app for tracking weight, activities, and trends. Features real-time graphs, 7-day forecasts, local insights, easy data export, and **full offline support with PWA**.

**Tech stack:** Vite + React 18, Recharts, Supabase, PWA service worker.

## Quick start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`.

## Deployment to Vercel

1. Push to GitHub.
2. Go to [vercel.com](https://vercel.com) and import your repo.
3. Deploy. The app is fully static and serverless.

## Features

### Tracking & Data

- 📊 Real-time weight graphs with moving averages (7 & 30-day)
- 📅 Calendar view with quick-add weight entries
- 🏋️ Activity logging (gym, bike, boxing, running)
- 📥 Import external weight data (JSON/CSV)

### Analytics

- 🎯 Goal tracking and progress zones
- 📈 7-day trend projection with linear forecasting
- 💡 Local insights (trend analysis, weekly pace, consistency metrics)
- 📊 Weekly & monthly summary reports with min/max/avg stats
- 📤 Export data as JSON, CSV, or AI-ready prompt

### Performance & Offline

- 🌐 **PWA support** — install on home screen
- 📱 **Full offline support** — works without internet
- ⚡ Virtual scrolling for large weight lists (100+ entries)
- 📦 Optimized code splitting (755MB gzipped total)

## PWA Features

The app is installable as a Progressive Web App:

- On mobile: tap share → "Add to home screen"
- On desktop: click install icon in browser address bar
- Works offline with cached assets
- Syncs data when connection is restored
