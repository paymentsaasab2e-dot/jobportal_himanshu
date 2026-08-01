# HRYantra Chat ↔ HQ API

How **HRYantra Verified Chat** notifies users, and how **HQ** can send / read chats **per candidate**.

---

## Why notifications / FAB looked broken

| Issue | Cause | Fix now |
|-------|--------|---------|
| No floating badge on Office Gossips | FAB was **hidden** on `/community` so it wouldn’t cover Send | FAB shows again, raised above the bottom tab bar |
| Bell didn’t move for chat tips | Suggestions only wrote **localStorage** chat, not `/api/notifications` | System pushes also call `recordCandidateNotification` |
| HQ couldn’t push from outside | Chat lived only in the browser | New **`/api/hq-chat`** on backend1 + client poll sync |
| Listener only on community page | `installHryantraHqChatListener` only ran inside `/community` | Global `HryantraChatSyncHost` in root layout |

**What users see on a new HRYantra message**

1. Red badge on the floating **HR** circle (unread count)  
2. Toast: “New message from HRYantra”  
3. Header **bell** unread (+ panel entry “Open chat” → `/community`)  
4. Unread chip on the HRYantra row inside Chat tab  

Auto suggestions (behaviour / rejection recovery) still push into the same chat and now also hit the bell.

---

## Architecture

```
HQ / ops
   POST /api/hq-chat/users/:userId/messages   (as HRYantra)
        │
        ├─► store (data/hq-hryantra-chats.json)
        └─► Notification row for candidate (bell)

App (logged-in user)
   HryantraChatSyncHost  ──poll every 20s──► GET .../pending?since=
        │
        ▼
   localStorage verified chat + FAB badge + toast
   user replies ──► POST .../replies  (HQ can read thread)
```

Suggestions engine (client) still uses `pushHryantraVerifiedMessage` for auto tips.

---

## Auth

HQ / admin routes need header:

```http
x-internal-admin-key: <SYSTEM_AUDIT_ADMIN_KEY | INTERVIEW_ADMIN_KEY | INTERNAL_API_KEY>
```

Local/dev: open if no key is set (same as audit).

Client sync routes (`pending`, `replies`, `mark-read`) are open by `userId` path for the logged-in app (harden with JWT later if needed).

---

## Endpoints (backend1 — `http://localhost:5000`)

Controller: `src/controllers/hq-chat.controller.js`  
Service: `src/services/hq-chat.service.js`  
Routes: `src/routes/hq-chat.routes.js` → mounted at **`/api/hq-chat`**

### HQ — send as HRYantra

```http
POST /api/hq-chat/users/:userId/messages
x-internal-admin-key: <key>
Content-Type: application/json

{
  "text": "We noticed strong CV fit — want help with interview prep?",
  "actionUrl": "/lms/interview-prep",
  "hqMeta": { "campaign": "interview_nudge", "agent": "ops-12" },
  "notifyUser": true
}
```

- Appears in user’s HRYantra chat after sync  
- Creates a **system notification** (bell) unless `notifyUser: false`

### HQ — read one user’s full chat

```http
GET /api/hq-chat/users/:userId?limit=200
x-internal-admin-key: <key>
```

### HQ — inbox (all users with activity)

```http
GET /api/hq-chat/inbox?limit=50&q=<optional search>
x-internal-admin-key: <key>
```

Returns threads with `lastMessage`, `unreadForUser`, `unreadForHq`, `updatedAt`.

### HQ — mark HQ-side unread cleared

```http
POST /api/hq-chat/users/:userId/read
x-internal-admin-key: <key>
```

### App — pull new HQ messages

```http
GET /api/hq-chat/users/:userId/pending?since=<ISO timestamp>
```

### App — push user reply for HQ visibility

```http
POST /api/hq-chat/users/:userId/replies
Content-Type: application/json

{
  "text": "Thanks, I'll check that.",
  "clientMessageId": "optional-dedupe-id"
}
```

### App — mark user unread cleared on server

```http
POST /api/hq-chat/users/:userId/mark-read
```

---

## Related notification API (bell)

Already exists — HQ chat send uses it internally:

```http
POST /api/notifications/:candidateId
{
  "type": "system",
  "title": "New message from HRYantra",
  "description": "...",
  "actionButton": "Open chat",
  "actionPath": "/community",
  "metadata": { "kind": "hryantra_chat", "channel": "alert" }
}
```

```http
GET /api/notifications/:candidateId
```

---

## Browser event (same tab / local tools)

```js
window.dispatchEvent(
  new CustomEvent('saasa:hryantra-hq-chat', {
    detail: {
      userId: '<candidateId>',
      text: 'Manual HQ note…',
      actionUrl: '/explore-jobs',
      hqMeta: { source: 'console' },
    },
  }),
);
```

---

## Quick HQ attach checklist

1. Backend1 running on `:5000`  
2. Know candidate `userId` (Mongo ObjectId from candidates / login)  
3. `POST /api/hq-chat/users/{userId}/messages` with admin key  
4. User should see toast + FAB badge within ~20s (or on window focus)  
5. `GET /api/hq-chat/users/{userId}` to review the full conversation  

---

## UI pieces

| Piece | Path |
|-------|------|
| Floating HR badge | `HryantraChatFab.tsx` |
| Sync + listener host | `HryantraChatSyncHost.tsx` |
| Local chat store | `hryantra-verified-chat-store.ts` |
| Chat UI | Office Gossips → Chat → HRYantra |
| Auto suggestions | `suggestions-engine` → `pushHryantraVerifiedMessage` |

---

## Storage

- Client: `localStorage` key `saasa:hryantra-verified-chat-v1`  
- Server HQ mirror: `backend1/data/hq-hryantra-chats.json`  
- Bell: Prisma `Notification` collection  

---

## Still auto vs HQ manual

| Source | How it sends |
|--------|----------------|
| Behaviour / rejection suggestions | Client engine → local chat + bell |
| HQ / ops human or CRM | `POST /api/hq-chat/users/:id/messages` |
| Same-tab tooling | `saasa:hryantra-hq-chat` event |
