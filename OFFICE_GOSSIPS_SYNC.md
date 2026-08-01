# Office Gossips server sync

Company pages, communities, posts, gossip identities, and reference checks are synced to **backend1** so they work across devices and are ready for HQ analytics.

## API (backend1)

Base: `{API}/office-gossips`

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/bundle` | Pull shared catalog |
| `POST` | `/bundle` | Merge client creates/updates |
| `GET` | `/hq/summary` | HQ rollup (admin key in production) |

Durable file: `backend1/data/office-gossips-bundle.json` (same pattern as HQ chat / audit JSON fallback). Later migrate to Prisma without changing the client contract.

## Client behavior

- `localStorage` stays a fast cache (`saasa:office-gossips-v5`, identities, reference checks).
- On login, `OfficeGossipsSyncHost` pulls the bundle and merges into local cache.
- Saves (create company, posts, fee identity, reference actions) debounce-push to the server.
- Creating a company page triggers an immediate push.

## Deploy note

Restart / redeploy **backend1** so `/api/office-gossips` is mounted. Frontend alone is not enough — both apps must be updated.
