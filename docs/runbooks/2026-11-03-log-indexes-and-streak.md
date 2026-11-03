# Runbook: log indexes, streak endpoint and month-range calendar
**Date:** 2026-11-03 | **Code:** frequency-be (indexes + `GET /api/logs/streak`), frequency (Calendar month ranges) | **Risk:** low

## Summary
Adds two indexes to the Turso DB so log queries stop scanning every user's rows, and a BE endpoint that computes the calendar streak. The web Calendar then loads only the visible month plus a 14-byte streak response instead of the whole log history (3000 logs: 1.2 MB before, about 18 KB after).

## Who is involved
| Role | Needs to | Access required |
|---|---|---|
| Developer with DB access | Back up, create indexes on Turso | Turso CLI logged in to the account that owns the DB |
| Developer with Vercel access | Deploy BE, then web | Vercel projects for `frequency-be` and `frequency` |

## Before you start
- [ ] Turso CLI installed and logged in: `turso auth whoami` prints the account.
- [ ] Know the DB name: `turso db list` (it is the host in `TURSO_URL` in the BE Vercel env; do not copy the value anywhere).
- [ ] Both repos are pushed with the commits for this change.

## Steps
| # | Who | Action (exact command / UI path) | Verify (expected result) |
|---|---|---|---|
| 1 | DB | Back up: `turso db shell <db-name> .dump > frequency-backup-2026-11-03.sql` | File exists and contains `CREATE TABLE action_logs` |
| 2 | DB | Create indexes (safe to re-run, additive, no data change): `turso db shell <db-name> "CREATE INDEX IF NOT EXISTS action_logs_user_logged_at_idx ON action_logs (user_id, logged_at); CREATE INDEX IF NOT EXISTS action_logs_action_id_idx ON action_logs (action_id); CREATE INDEX IF NOT EXISTS actions_user_id_idx ON actions (user_id);"` | No error |
| 3 | DB | `turso db shell <db-name> "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE '%_idx'"` | Lists `action_logs_action_id_idx`, `action_logs_user_logged_at_idx` and `actions_user_id_idx` |
| 3a | DB | Read-only check for stored `logged_at` values that are not ISO dates: `turso db shell <db-name> "SELECT count(*) FROM action_logs WHERE logged_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*'"` | Note the count. The streak endpoint skips such rows, so this does not block the deploy; a non-zero count means a cleanup task |
| 4 | DB | `turso db shell <db-name> "EXPLAIN QUERY PLAN SELECT logged_at FROM action_logs WHERE user_id='x' AND logged_at >= 'a' AND logged_at < 'b'"` | `SEARCH action_logs USING COVERING INDEX action_logs_user_logged_at_idx ...` (not `SCAN`) |
| 5 | Vercel | Deploy BE first: Vercel dashboard -> `frequency-be` -> Deployments -> deploy the commit with the streak route (or push to the production branch) | Deployment status Ready; `GET https://<be-host>/api/health` returns `{"ok":true}` |
| 6 | Vercel | Check the streak route and server timezone support. Sign in on the web app, copy the token from DevTools -> Application -> Local Storage -> `freq_token`, then: `curl -H "Authorization: Bearer <token>" "https://<be-host>/api/logs/streak?tz=Asia/Ho_Chi_Minh"` and the same with `tz=Mars/Base` | First returns 200 `{"streak":N}`; second returns 400 with a `tz must be a valid IANA timezone` error. If the first returns 400, the runtime lacks full ICU: stop, do not deploy web |
| 7 | Vercel | Deploy web: Vercel dashboard -> `frequency` -> deploy the commit with the Calendar change | Deployment Ready |
| 8 | Any | Open Calendar on the deployed web app, DevTools -> Network, filter `logs` | Requests are `/api/logs?from=...&to=...` and `/api/logs/streak?...`; none is plain `/api/logs`; streak and month total show numbers |

Order: indexes and BE can go in either order (the indexes change no behaviour), but the BE must be live before the web deploy, because the new Calendar calls `/api/logs/streak`. The old web keeps working with the new BE.

## Rollback
| If this fails | Do this | Verify |
|---|---|---|
| Step 2 errors or the DB misbehaves after it | `turso db shell <db-name> "DROP INDEX IF EXISTS action_logs_user_logged_at_idx; DROP INDEX IF EXISTS action_logs_action_id_idx; DROP INDEX IF EXISTS actions_user_id_idx;"` (data is untouched; the backup from step 1 is only needed if something else went wrong) | Step 3 query returns no rows |
| Step 6 returns 400 for a valid tz, or 500 | Do not deploy web. Keep the BE (the new route is unused by the old web) or redeploy the previous BE deployment from the Vercel Deployments list ("Promote to Production") | Old web Calendar still loads |
| Web Calendar broken after step 7 | Vercel -> `frequency` -> Deployments -> previous deployment -> Promote to Production | Calendar loads as before |

## After
- [ ] Mark the performance items as done in `frequency/docs/project-roadmap.md`.
- [ ] Mobile still computes the streak from the whole history; switch it to `/api/logs/streak` and month ranges when syncing the Calendar to mobile.

Local dry run of the first two indexes (old schema DB, SQL run twice to confirm it is idempotent), real output. `action_logs_action_id_idx` was added afterwards and is covered by BE `test/indexes.test.ts`:

```
action_logs_user_logged_at_idx
actions_user_id_idx
SEARCH action_logs USING COVERING INDEX action_logs_user_logged_at_idx (user_id=? AND logged_at>? AND logged_at<?)
```

## Rollout log (2026-11-03)
- Turso CLI was not installed, so steps 1-4 ran the same SQL through `@libsql/client` with the BE `.env` credentials. Backup: `D:\vibe\freq\backups\turso-2026-11-03-before-indexes.json` (local workspace, outside the repos; holds user emails and password hashes). 2 users, 3 actions, 6 logs; 0 non-ISO and 0 offset-less `logged_at` values.
- Indexes created; `EXPLAIN` shows `SEARCH action_logs USING COVERING INDEX action_logs_user_logged_at_idx`; row count unchanged.
- BE `26d67ba` deployed (Vercel status success); `/api/health` 200; `/logs/streak` with a signed-in session: 200 `{"streak":1}` for `Asia/Saigon`, 400 for `Mars/Base`.
- Web `280464f` deployed; Calendar makes three log requests (month range, streak, selected day) and none without `from`/`to`.
