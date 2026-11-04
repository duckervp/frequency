# Runbook: baseline Drizzle migrations on Turso
**Date:** 2026-11-04 | **Code:** frequency-be (`src/db/migrations/0000_baseline.sql`, `src/db/baseline.ts`, `npm run db:baseline`) | **Risk:** low

## Summary
Production was created with `db:push`, so it has the tables but no migration history, and `db:migrate` would try to create them again. The baseline records migration `0000_baseline` as applied without running it. From then on schema changes go through `db:generate` + `db:migrate`. No table or row is changed.

Checked before writing this: the production schema (tables, columns, indexes, foreign keys) is identical to what `0000_baseline` builds, and production has no `__drizzle_migrations` table.

## Who is involved
| Role | Needs to | Access required |
|---|---|---|
| Developer | Back up, run the baseline, check | `frequency-be/.env` with the Turso URL and token |

## Before you start
- [ ] `frequency-be` is on the commit that contains `src/db/migrations/0000_baseline.sql` and `src/db/baseline.ts`.
- [ ] Backup taken. A JSON export of all tables and the schema was saved on 2026-11-04 to `D:\vibe\freq\backups\turso-2026-11-04-before-baseline.json` (2 users, 4 actions, 6 logs).

## Steps
| # | Who | Action (exact command, run in `frequency-be`) | Verify (expected result) |
|---|---|---|---|
| 1 | Developer | `npm run db:baseline` | Prints `[baseline] Marked 1 migration(s) up to 0000_baseline as applied` |
| 2 | Developer | `npx drizzle-kit migrate` | Finishes without error and applies nothing (no "CREATE TABLE ... already exists") |
| 3 | Developer | Run `npm run db:baseline` again | Fails with `Database already has migration history` (proves it cannot run twice) |

## Rollback
| If this fails | Do this | Verify |
|---|---|---|
| Step 1 or 2 errors | Drop the history table: in the Turso dashboard SQL console (or `turso db shell <db-name>`) run `DROP TABLE IF EXISTS __drizzle_migrations;`. Data tables are untouched, so the backup is only needed if something else went wrong | `SELECT name FROM sqlite_master WHERE name = '__drizzle_migrations'` returns no rows |

## After
- [ ] Use `db:generate` + `db:migrate` for every schema change; do not use `db:push` on Turso.
- [ ] Tick the migration item in `frequency/docs/project-roadmap.md`.
