# System Audit Logs (Admin + HQ)

Comprehensive **system audit logs for administrative actions** — who did what, when, on which entity — for portal management, stakeholders, and HQ attachment.

This is **not** candidate browsing analytics (see `HQ_BEHAVIOR_API.md`).  
Audit = privileged / destructive / config actions. Behavior = sales & engagement signals.

---

## Why this exists (stakeholder view)

| Audience         | Benefit                                                     |
| ---------------- | ----------------------------------------------------------- |
| Management / ops | Reconstruct “who deleted X / approved Y”                    |
| Support          | Prove token / account changes with a timeline               |
| Security         | Spot unusual admin bulk actions                             |
| HQ / enterprise  | Attachable release package + poll feed for CRM / dashboards |

**One-liner:** Every sensitive admin action is logged with actor, time, and target so HQ can review, export, and prove accountability.

---

## What is logged today

| Action                                        | When                                  |
| --------------------------------------------- | ------------------------------------- |
| `candidate.hard_delete`                       | Super admin deletes one candidate     |
| `candidate.bulk_delete`                       | Super admin bulk delete               |
| `job.delete`                                  | Super admin deletes one job           |
| `job.bulk_delete`                             | Super admin bulk delete jobs          |
| `interviewer.application_approve` / `_reject` | Admin reviews interviewer application |
| `audit.hq_release`                            | An HQ release package is persisted    |

You can also write custom events via `POST /api/audit/events`.

---

## Architecture

```
Super admin UI / API controllers
        │
        ▼
backend1  audit.service  ──► Mongo SystemAuditLog (Prisma)
        │                 └─► data/system-audit-logs.json (fallback)
        ▼
 /api/audit/*  (admin key)
        │
        ├─► Administration UI  (/administration)
        └─► HQ attach
              ├─ backend: GET|POST /api/audit/hq/release
              ├─ backend: GET /api/audit/hq/feed
              └─ Next proxy: /api/hq-audit
```

---

## Auth

Header: `x-internal-admin-key`

Env (backend1), first match wins for audit middleware:

- `SYSTEM_AUDIT_ADMIN_KEY`
- `INTERVIEW_ADMIN_KEY`
- `INTERNAL_API_KEY`

In **non-production**, if no key is set, routes stay open (same pattern as interviewer admin).  
In **production**, set a key or requests return `403`.

Optional actor labels from clients:

- `x-admin-actor-id`
- `x-admin-actor-label`
- `x-admin-actor-role`
- `x-audit-source`

---

## API reference (backend1 — port 5000)

Base: `http://localhost:5000/api/audit`

### List events

```http
GET /api/audit/events?page=1&limit=50&action=&entityType=&actorId=&source=&from=&to=&q=
```

Response:

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "...",
        "action": "candidate.hard_delete",
        "entityType": "candidate",
        "entityId": "...",
        "actorLabel": "Super Admin",
        "actorRole": "admin",
        "source": "superadminpage",
        "status": "success",
        "metadata": {},
        "capturedAt": "2026-07-30T09:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 50, "total": 12 }
  }
}
```

### Write event (HQ / tooling)

```http
POST /api/audit/events
Content-Type: application/json
x-internal-admin-key: <key>

{
  "action": "settings.feature_flag_update",
  "entityType": "settings",
  "entityId": "feature.tokens",
  "actorLabel": "HQ Ops",
  "source": "hq",
  "metadata": { "from": false, "to": true }
}
```

### Get one event

```http
GET /api/audit/events/:id
```

---

## HQ release endpoint (attach this to HQ)

### Preview package (no persist)

```http
GET /api/audit/hq/release?sinceHours=24&limit=200
```

### Persist + acknowledge (recommended for HQ ingest)

```http
POST /api/audit/hq/release
Content-Type: application/json
x-internal-admin-key: <key>

{
  "sinceHours": 24,
  "limit": 200,
  "acknowledge": true,
  "hqSystemId": "hq-crm",
  "note": "Nightly ops pull"
}
```

Package shape (high level):

```json
{
  "releaseId": "hqaud_...",
  "version": "1.0",
  "product": "HRYantra Portal (backend1)",
  "generatedAt": "...",
  "window": { "sinceHours": 24, "from": "...", "to": "..." },
  "summary": {
    "eventCount": 18,
    "byAction": { "job.delete": 2, "candidate.hard_delete": 1 },
    "highRiskActions": []
  },
  "events": [],
  "attachHints": {
    "pollFeed": "GET /api/audit/hq/feed",
    "release": "GET|POST /api/audit/hq/release",
    "nextProxy": "GET|POST /api/hq-audit (jobportal Next app)"
  }
}
```

### Continuous feed

```http
GET /api/audit/hq/feed?sinceHours=24&limit=50
```

Returns recent `events` + last `releases`.

### Prior releases

```http
GET /api/audit/hq/releases
```

---

## Next.js HQ proxy (frontend)

Stable URL for HQ if they prefer the Vercel / Next origin:

| Method | URL                           | Behavior                    |
| ------ | ----------------------------- | --------------------------- |
| `GET`  | `/api/hq-audit`               | Proxies → backend `hq/feed` |
| `GET`  | `/api/hq-audit?mode=release`  | Release preview             |
| `GET`  | `/api/hq-audit?mode=events&…` | List events                 |
| `POST` | `/api/hq-audit`               | Persist release on backend  |

Set `AUDIT_API_ORIGIN=http://localhost:5000` (or hosted API origin) if needed.

---

## Admin UI

Open: **`/administration`**

- Filter / search audit table
- Event detail drawer
- **Preview HQ release** / **Persist HQ release**
- Link to `/superadminpage` (actions that generate logs)

Sidenav already points to `/administration`.

---

## How to attach in HQ (checklist)

1. Ensure backend1 is running (`npm run dev` in `backend1`, port **5000**).
2. Set `SYSTEM_AUDIT_ADMIN_KEY` (or reuse `INTERVIEW_ADMIN_KEY`) in production.
3. HQ scheduler / webhook:
   - Poll `GET /api/audit/hq/feed` every N minutes, **or**
   - Nightly `POST /api/audit/hq/release` and store `releaseId` + `events` in CRM.
4. Optionally use Next proxy `POST https://<frontend>/api/hq-audit` so HQ only knows one URL.
5. Map `highRiskActions` to an ops alert channel (Slack / email) when `eventCount` of deletes &gt; threshold.

---

## Prisma / storage

Model: `SystemAuditLog` in `backend1/prisma/schema.prisma` (`system_audit_logs` collection).

After schema change:

```bash
cd job-seek-backend/hrayntra_aws/backend1
npx prisma generate
npx prisma db push
```

If Prisma write fails, events still land in:

`backend1/data/system-audit-logs.json`

HQ releases:

`backend1/data/hq-audit-releases.json`

---

## Related docs

- `HQ_BEHAVIOR_API.md` — candidate behavior / sales triggers (separate pipeline)
- Super admin deletes: `/superadminpage`

---

## Extending later

Call `recordAdminAudit({ ... })` from any controller after a sensitive mutation:

```js
const {
  recordAdminAudit,
  auditContextFromReq,
} = require("../services/audit.service");

recordAdminAudit({
  ...auditContextFromReq(req, { source: "my-module" }),
  action: "tokens.manual_grant",
  entityType: "candidate",
  entityId: candidateId,
  metadata: { amount: 50 },
});
```

Good next candidates: account suspend, token grants, company page overrides, feature flags.
