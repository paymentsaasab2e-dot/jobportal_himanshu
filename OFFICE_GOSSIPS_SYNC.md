# Office Gossips server sync

Company pages, communities, posts, gossip identities, and reference checks sync to **backend1** (MongoDB via Prisma). JSON is only a one-time import / cold fallback.

## Storage model

| Layer | Collection / model | What |
|-------|-------------------|------|
| **Platform** | `office_gossip_entities` (`OfficeGossipEntity`) | Communities, company pages, posts, comments, reference checks, DM threads, follows — upsert by `(kind, entityId)` |
| **Per-user** | `user_office_gossip_profiles` (`UserOfficeGossipProfile`) | Identity, personalised feed/chat events, personal meta — keyed by `userId` (same idea as behaviour profile) |
| **Meta** | `office_gossip_meta` | Bundle `updatedAt` |
| **Audit** | `system_audit_logs` (`SystemAuditLog`) | Admin actions — Mongo primary (JSON only if DB write fails) |

HQ Engagement **Community & chat** reads `GET /api/office-gossips/hq/summary` (counts users + ref-check initiated / responded / completed).

## API (backend1)

Base: `{API}/office-gossips`

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/bundle` | Pull shared catalog |
| `POST` | `/bundle` | Merge client creates/updates (no duplicates — upsert by id) |
| `GET` | `/hq/summary` | HQ rollup (admin key in production) |

Optional personalised fields on `POST /bundle`:

- `userId` + `feedEvents` — personal feed/chat events for that user
- `feedEventsByUser` — map of `userId → events[]`
- `personalMetaByUser` — map of `userId → meta`

## Client behavior

- `localStorage` stays a fast cache (`saasa:office-gossips-v5`, identities, reference checks).
- On login, `OfficeGossipsSyncHost` pulls the bundle and merges into local cache.
- Saves debounce-push to the server (upsert — no duplicates).

## Deploy

1. `cd backend1 && npx prisma db push && npx prisma generate`
2. Restart **backend1** (and **backendphase2** for HQ stats).
3. First start imports existing `data/office-gossips-bundle.json` into Mongo if collections are empty.
