# Frequency — Project Overview (PDR)

## Product Vision

Frequency is a personal habit and action tracking app. Users define custom "actions" (habits/tasks), log when they perform them, and review history via a calendar and log feed. It is a private, single-user mobile app designed for iPhone 13, built with React Native (Expo).

## Target Platform

- **Primary:** iOS (iPhone 13) via Expo + EAS Build + Sideloadly
- **Deployment:** Personal device only — not distributed via App Store
- **Backend:** Deployed on Vercel (unchanged during migration)

## Current State

| Layer | Stack | Status |
|---|---|---|
| Web frontend | React 19 + Vite + TailwindCSS 4 | 🚧 Being replaced by mobile app |
| Mobile frontend | Expo + NativeWind + expo-router | 🔄 In progress (`frequency-mobile/`) |
| Backend API | Hono + Drizzle ORM + Turso (SQLite) | ✅ Live on Vercel |

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

## Key Constraints

- **No App Store submission** — personal use via Sideloadly (re-sign weekly)
- **Windows development machine** — EAS Build (cloud) used for iOS compilation
- **No Mac required** — Expo Go for dev testing; EAS for IPA production
- **Backend unchanged** — same Hono API; mobile app calls it over HTTPS

## Repositories

| Repo | Purpose |
|---|---|
| `frequency/` | Legacy web app (React + Vite) — read-only reference |
| `frequency-be/` | Backend API — unchanged |
| `frequency-mobile/` | New React Native app (Expo) — active development |
