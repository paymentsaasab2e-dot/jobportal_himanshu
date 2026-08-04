# HQ Help Tickets API

Support tickets raised from the portal **Help** page (`/help`). HQ is **display / action via API only** — list open tickets, update status, and (later) notify the user.

Related docs: [`HQ_BEHAVIOR_API.md`](./HQ_BEHAVIOR_API.md) (behaviour realtime / history / sessions).

---

## Setup

### Prerequisites

1. Phase 1 frontend running (Next.js), e.g. `http://localhost:3000`
2. Help route public: `/help` (and `/faq` for product Q&A — separate from tickets)
3. Persistence file (auto-created on first ticket):

```
jobportal_himanshu/data/hq-analytics.json
```

Same file stores behaviour realtime/history **and** tickets (multi-ticket array). Gitignored via `data/.gitignore`.

### User-facing page

| Path | Purpose |
|------|---------|
| `/help` | Common problems + **raise ticket** form |
| `/faq` | Product FAQ only (no ticket form) |

### Auth behaviour on `/help`

| User state | Navbar | Name / email on form |
|------------|--------|----------------------|
| **Logged in** | App `Header` | Auto-filled from account (`user.name`, `user.email`); read-only when present |
| **Guest** | Marketing `Navbar` | Empty — user must type name + email |

Ticket always includes `userId` when signed in.

### Optional email

On submit, the browser also opens:

```
mailto:support@saasab2e.com?subject=[Help tkt_…] …
```

Email is a side channel; **HQ source of truth is `POST/GET /api/hq-tickets`**.

---

## Flow

```
User opens /help
  → (optional) expands a common problem → “Raise ticket for this” prefills category/subject
  → fills / confirms form → Submit
       ├─ save local copy (localStorage `saasa:help-tickets-v1`)
       ├─ POST /api/hq-tickets   → append ticket (status: open)
       └─ optional mailto to support@saasab2e.com

HQ / ops
  → GET /api/hq-tickets              → list (newest first)
  → GET /api/hq-tickets?status=open  → queue
  → PATCH /api/hq-tickets            → open | in_progress | closed
```

**Not built yet:** in-app bell / floating alert when HQ changes status (user is not auto-notified in product).

---

## API endpoints (HQ)

Base URL = Phase 1 frontend origin (e.g. `http://localhost:3000`).

No admin key required on these Next routes today (same pattern as `/api/hq-behavior`). Restrict at network / reverse-proxy in production if needed.

### Create ticket (Help form → HQ)

`POST /api/hq-tickets`

```json
{
  "id": "tkt_optional_client_id",
  "createdAt": "2026-08-04T08:00:00.000Z",
  "name": "R. A. Lamkhade",
  "email": "user@email.com",
  "category": "Login & account",
  "subject": "Cannot sign in or OTP not arriving",
  "description": "…",
  "problemId": "login-otp",
  "userId": "candidateObjectIdOrNull"
}
```

**Required:** `name`, `email`, `subject`, `description`  
**Server sets:** `status: "open"`, `source: "help_page"`  
**Multi-ticket:** always **appends**; does not replace older tickets for the same email/user.

**Response**

```json
{
  "success": true,
  "data": { /* full ticket object */ }
}
```

---

### List tickets (HQ board)

`GET /api/hq-tickets`  
`GET /api/hq-tickets?limit=100`  
`GET /api/hq-tickets?status=open`  
`GET /api/hq-tickets?status=in_progress`  
`GET /api/hq-tickets?status=closed`  
`GET /api/hq-tickets?email=user@email.com`  
`GET /api/hq-tickets?id=tkt_…`

**What HQ fetches**

```json
{
  "success": true,
  "data": {
    "count": 12,
    "openCount": 5,
    "tickets": [
      {
        "id": "tkt_…",
        "createdAt": "2026-08-04T08:00:00.000Z",
        "name": "…",
        "email": "…",
        "category": "Tokens & payments",
        "subject": "…",
        "description": "…",
        "problemId": "tokens",
        "userId": "…",
        "status": "open",
        "source": "help_page"
      }
    ],
    "note": "Multiple tickets per user/email are kept. HQ display / analytics only."
  }
}
```

| Query | Effect |
|-------|--------|
| *(none)* | Newest-first list (default limit 100) |
| `limit` | Cap list size (1–200) |
| `status` | Filter `open` \| `in_progress` \| `closed` |
| `email` | All tickets for that email (multi) |
| `id` | Single ticket (`data` = object or `null`) |

---

### Update status (HQ action)

`PATCH /api/hq-tickets`

```json
{
  "id": "tkt_…",
  "status": "in_progress"
}
```

Allowed `status`: `open` | `in_progress` | `closed`

**Response:** `{ "success": true, "data": { /* updated ticket */ } }`

---

## Ticket categories (current options)

Form dropdown + problem prefills use:

1. Login & account  
2. Jobs & applications  
3. Profile & CV  
4. Tokens & payments  
5. Office Gossips  
6. Reference check  
7. LMS & interview prep  
8. Employers  
9. Other  

---

## Common problems (Help UI → `problemId`)

| `problemId` | Title | Prefill category |
|-------------|--------|------------------|
| `login-otp` | Cannot sign in or OTP not arriving | Login & account |
| `duplicate-email-phone` | Email or mobile already in use | Login & account |
| `few-jobs` | Few or no matching jobs | Jobs & applications |
| `apply-failed` | Application not submitting or status missing | Jobs & applications |
| `tokens` | Not enough tokens for a paid action | Tokens & payments |
| `og-setup` | Office Gossips keeps asking to set up | Office Gossips |
| `hryantra-alerts` | Not seeing HRYantra tips or chat alerts | Office Gossips |
| `reference-check` | Reference check stuck or fee issue | Reference check |
| `profile-save` | Profile or CV changes not saving | Profile & CV |
| `employer-access` | Employer demo or workspace access | Employers |

Expanding a problem shows try-steps; **Raise ticket for this** prefills the form (`problemId` + category + subject).

---

## Triggers

Help tickets are **user-initiated**, not behaviour-engine triggers.

| Trigger | When | What happens |
|---------|------|----------------|
| Form submit on `/help` | User clicks Submit ticket | `POST /api/hq-tickets` + localStorage + optional mailto |
| Prefill from problem | User clicks “Raise ticket for this” | Scrolls to form; sets category / subject / description / `problemId` |
| HQ status PATCH | Ops updates ticket | Status stored only — **no** automatic user notification / bell yet |

### Not ticket triggers (other HQ systems)

These live under behaviour / sessions APIs — useful context when handling a ticket for a known `userId`:

| Endpoint | Use with tickets |
|----------|------------------|
| `GET /api/hq-behavior?mode=realtime` | Live session-style board |
| `GET /api/hq-behavior?mode=latest&userId=` | Full latest behaviour for that user |
| `GET /api/hq-behavior?mode=history&userId=` | Past snapshots for reports |
| `GET /api/hq-sessions?userId=` | Login sessions, IP, location, **alertTiming** |

Behaviour `hqTriggers` / insights (e.g. `hq_service_no_purchase`) are **sales/career flags**, not help-desk tickets.

---

## Suggested HQ workflow

1. Poll `GET /api/hq-tickets?status=open` (or load all and filter in UI).  
2. Open ticket → read `subject`, `description`, `category`, `problemId`, `userId`, `email`.  
3. Optionally load `GET /api/hq-behavior?mode=latest&userId=` + `GET /api/hq-sessions?userId=` for context.  
4. Act offline / email user → `PATCH` status to `in_progress` then `closed`.  
5. Later: wire `PATCH` → `recordCandidateNotification(userId, …)` so the user gets an in-app alert.

---

## Code map

| Piece | Path |
|-------|------|
| Help page UI | `src/app/(website)/help/page.tsx` |
| Problems + categories + client POST | `src/app/(website)/help/data/problems.ts` |
| Next API route | `src/app/api/hq-tickets/route.ts` |
| Persist append/list/update | `src/lib/hq-data-store.ts` |
| Storage file | `data/hq-analytics.json` |
| Navbar: logged-in Header on `/help` | `src/app/(website)/layout.tsx` |

---

## Quick curl examples

```bash
# List open tickets
curl -s "http://localhost:3000/api/hq-tickets?status=open"

# One ticket
curl -s "http://localhost:3000/api/hq-tickets?id=tkt_xxx"

# Mark in progress
curl -s -X PATCH "http://localhost:3000/api/hq-tickets" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"tkt_xxx\",\"status\":\"in_progress\"}"
```
