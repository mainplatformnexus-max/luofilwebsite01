# LUO FILM

A streaming platform for Asian entertainment (dramas, movies, anime, variety shows) built with React, Vite, TypeScript, and Firebase.

## Admin Dashboard Features

- **Live TV Channels**: Upload and manage live TV channels with stream URL, thumbnail URL, category, country, live/VIP flags. Displayed at `/live-tv`.
- **Sports**: Upload and manage sports content with stream URL, thumbnail URL, categories, tags. Displayed at `/sport`.
- **Carousels**: Hero banner slides with image URL, title, link, order, rating, tags. Displayed on HeroBanner.
- **Ads / Promo Banners**: URL-based image ads with title, subtitle, CTA, page targeting. Displayed on frontend pages.
- **Overview**: Real-time stats from Firestore — users, subscribers, movies, series, live channels, sports. User growth and subscription plan charts from real data.
- **Wallet**: Real-time Firestore `transactions` collection. Calculates balance from income vs withdrawals. Admin can record withdrawals. Export to text file.
- **Activities**: Real-time Firestore `activities` collection. Search and filter by action type.
- **Subscription**: Real-time Firestore `users` collection with subscription fields. Admin can grant/change/revoke subscriptions by updating user documents.

## Subscription System

- ALL content (movies, series, live TV, sports) requires an active subscription to watch or download.
- Subscription status is stored in Firestore under `users/{uid}.subscription` with: `plan`, `startDate`, `endDate`, `status`.
- `useSubscription(userId)` hook reads from Firestore in real-time and checks if `endDate > now`.
- PlayPage shows a paywall if user has no active subscription.
- Detail page shows subscription banner + lock icons on Play/Download buttons.
- DownloadModal component shows quality options (360p→4K) with per-tier access requirements.

## Download Quality Tiers

- 360p / 480p — Any active subscription (Standard, Classic, etc.)
- 720p / 1080p — Pro, Premium, Ultra, VIP plans
- 4K UHD — VIP Monthly only

## Home Page Sections (auto-appear when content exists)

Sections that appear dynamically when content is assigned to them (via admin `section` field or genre/country matching):
- Mainland Chinese, Suspense Adventure, Fantasy and Adventure, Thai Romance Drama
- Teen Dramas, Inspirational Dramas, Crime, Comedy, War, Romance K-dramas
- Thriller, Heart-Stealing CEO Series, Modern Love, Sci-fi, Kung Fu
- Zombie & Horror, For Kids

## Admin Content Sections (upload forms)

Movies and Series admin upload forms have 30+ section options including all the new home page sections.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router DOM v6
- **State/Data**: TanStack React Query + Firebase Firestore
- **Auth**: Firebase Authentication (Google OAuth)
- **Database**: Firebase Firestore (real-time)
- **Analytics**: Firebase Analytics

## Project Structure

```
src/
  App.tsx          - Main app with routing
  main.tsx         - Entry point
  pages/           - Page components (Index, Detail, Play, Drama, Movie, Anime, etc.)
  pages/admin/     - Admin panel pages
  components/      - Shared UI components (Navbar, HeroBanner, ContentRow, etc.)
  components/ui/   - shadcn/ui primitives
  components/admin/ - Admin layout and components
  contexts/        - React contexts (AuthContext)
  hooks/           - Custom hooks (useFirestore, use-mobile, use-toast)
  lib/             - Utilities (firebase.ts, firestore.ts, utils.ts)
  data/            - Static data (movies.ts, shows.ts)
```

## Running the App

The app runs via the "Start application" workflow using `npm run dev` on port 5000.

## Firebase Configuration

Firebase credentials are hardcoded in `src/lib/firebase.ts`. The app connects to the `luo-film` Firebase project.

## Admin Panel

Accessible at `/admin` — provides management for users, movies, series, episodes, celebrities, carousels, ranking, wallet, activities, subscriptions, comments, and ads.

## Key Notes

- `lovable-tagger` devDependency was removed (Lovable-specific, incompatible with Vite 8)
- Vite server configured for `host: "0.0.0.0"` and `port: 5000` for Replit compatibility
- `allowedHosts: true` set for proxied preview access
