# Frequency — Project Overview (PDR)

## Product Vision

Frequency is a personal habit and action tracking app. Users define custom "actions" (habits/tasks), log when they perform them, and review history via a calendar and log feed. It is a private, single-user app, used on the web and on an iPhone 13.

## Target Platforms

- **Primary:** Web (React + Vite), deployed on Vercel — new features are built here first
- **Secondary:** iOS (iPhone 13) via Expo + EAS Build + Sideloadly — mirrors the web app after features are finished
- **Backend:** Hono API on Vercel, shared by both clients
- **Distribution:** Personal use only — not distributed via App Store

## Current State

| Layer | Stack | Status |
|---|---|---|
| Web frontend | React 19 + Vite + TailwindCSS 4 | ✅ Live on Vercel — primary client, active development |
| Backend API | Hono + Drizzle ORM + Turso (SQLite) | ✅ Live on Vercel — active development |
| Mobile frontend | Expo 54 + NativeWind 4 + expo-router | 🔄 Screens ported; synced from web as features land |

## Core Features

| Feature | Description |
|---|---|
| **Authentication** | Email/password login, registration, Google OAuth |
| **Actions** | Create, edit, delete custom habit/task templates (name, icon, color, reminder time) |
| **Logging** | Tap to log an action occurrence with optional note and timestamp |
| **Log History** | Scrollable feed of logs with 7-day date pills filter |
| **Calendar View** | Monthly grid showing active days; tappable day detail; streak + monthly stats |
| **Dashboard** | Quick actions grid + last 24h activity feed |
| **Settings** | Profile info, manage actions, log out |

## Development Workflow

- Features are built and verified on **BE + web** first, then synced to mobile.
- Development is AI-assisted with Claude Code. Each repo has a `CLAUDE.md` (commands, layout, gotchas); the workspace root `D:\vibe\freq\CLAUDE.md` describes how the repos fit together.
- Local dev: BE on `localhost:3001`, web on `localhost:5173`, mobile web preview on `localhost:8081`.

## Key Constraints

- **No App Store submission** — iOS app is installed via Sideloadly (re-sign weekly)
- **Windows development machine** — EAS Build (cloud) used for iOS compilation; no Mac required
- **Single database** — local BE and production share the same Turso database
- **Google OAuth only on deployed BE** — local testing uses email + password

## Repositories

| Repo | Purpose |
|---|---|
| `frequency/` | Web app (React + Vite) — primary client |
| `frequency-be/` | Backend API (Hono + Drizzle + Turso) |
| `frequency-mobile/` | iOS app (Expo) — synced from web |
