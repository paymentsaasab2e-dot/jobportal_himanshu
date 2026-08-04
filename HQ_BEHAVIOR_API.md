# HQ Behavior API

HQ is **display / analytics only**. The behaviour engine **does save** data; insights are computed from it, then forwarded here.

## Does the behaviour engine save?

**Yes.**

| Layer | What is saved |
|-------|----------------|
| Browser | Full activity in `saasa:user-activity-v1` (sessions, visits, time, events) |
| Insights | Computed from that saved data (triggers, alert timing, etc.) |
| Login DB | Server `Session` rows (IP, device, geo, duration) |
| HQ store | Realtime snapshot + latest + history + **many tickets** in `data/hq-analytics.json` |

## HQ endpoints (analytics display)

| Call | Use |
|------|-----|
| `GET /api/hq-behavior` | **Realtime** session-style feed (live board) |
| `GET /api/hq-behavior?mode=realtime` | Same |
| `GET /api/hq-behavior?mode=latest&userId=` | Full latest when HQ drills in |
| `GET /api/hq-behavior?mode=history&userId=` | **Past** points for reports (fetch on demand) |
| `POST /api/hq-behavior` | Client forward → updates realtime + latest; appends history ~every 5 min |
| `GET /api/hq-tickets` | **Multiple** tickets (append model, never wipe older) |
| `POST /api/hq-tickets` | Raise another ticket |
| `GET /api/hq-sessions` / `?userId=` | Login sessions + alert windows |

Flow: save locally → compute insights → forward realtime to HQ → HQ fetches history only for reports.

Also:

- `POST /api/hq-behavior`
- `GET /api/hq-behavior`
- `GET /api/hq-behavior?userId=<candidateId>`
- `GET /api/hq-sessions` → backend `GET /api/hq/sessions` (recent logins + alert windows)
- `GET /api/hq-sessions?userId=<candidateId>` → backend `GET /api/hq/sessions/:id`

## Purpose

Use this endpoint for HQ / sales / operations follow-up when the product detects:

- user visits services but does not purchase
- user researches the same company repeatedly
- user keeps exploring the same role/position
- user has repeated rejections with weak CV signals
- user has rejections **despite** a strong CV (keyword / ATS / profile gap)
- user loses after interview stage
- multi-signal combos (premium + company intent, incomplete profile + job hunting, etc.)
- user shows strong intent but low conversion

The current implementation persists HQ analytics in `data/hq-analytics.json` (realtime + latest + history + tickets). HQ only displays / reports; product logic stays in the behaviour engine.

## Payload shape

`POST /api/hq-behavior`

```json
{
  "userId": "candidate_123",
  "capturedAt": "2026-07-28T09:00:00.000Z",
  "activityStateUpdatedAt": "2026-07-28T08:59:40.000Z",
  "rollup7d": {
    "userId": "candidate_123",
    "range": "week",
    "fromDate": "2026-07-22",
    "toDate": "2026-07-28",
    "logins": 8,
    "visits": 34,
    "jobCardClicks": 11,
    "applies": 1,
    "activeMs": 256000,
    "pageVisitsByCategory": {
      "jobs": 12,
      "community": 8,
      "premium": 4,
      "ai_cv": 3
    },
    "activeMsByCategory": {
      "jobs": 84000,
      "community": 65000,
      "ai_cv": 42000
    },
    "insights": [
      {
        "id": "browser_not_applier",
        "label": "Browsing jobs, not applying",
        "severity": "watch",
        "summary": "High job time/clicks vs applies",
        "evidence": ["11 job card clicks", "1 applies recorded"]
      }
    ],
    "topCompanies": [
      {
        "key": "Rushacorp",
        "label": "Rushacorp",
        "count": 5,
        "activeMs": 0
      }
    ],
    "topRoles": [
      {
        "key": "react-developer",
        "label": "React Developer",
        "count": 6,
        "activeMs": 0
      }
    ],
    "hqTriggers": [
      {
        "id": "hq_service_no_purchase",
        "flag": "sales_follow_up",
        "title": "Visited services but did not purchase",
        "reason": "High premium-service curiosity without conversion.",
        "evidence": ["4 premium visits in the last 7 days"],
        "recommendedAction": "Sales/HQ can call and explain the most relevant paid service.",
        "priority": 90
      }
    ]
  },
  "suggestionMetrics": {
    "userId": "candidate_123",
    "salesFollowUpScore": 55,
    "salesFollowUpReady": true,
    "salesQueueReason": "Clicked suggestions multiple times without purchasing"
  },
  "triggers": [
    {
      "id": "hq_service_no_purchase",
      "flag": "sales_follow_up",
      "title": "Visited services but did not purchase",
      "reason": "High premium-service curiosity without conversion.",
      "evidence": ["4 premium visits in the last 7 days"],
      "recommendedAction": "Sales/HQ can call and explain the most relevant paid service.",
      "priority": 90
    }
  ],
  "interests": [
    {
      "key": "interview_prep",
      "label": "Interview prep",
      "score": 42.5,
      "updatedAt": "2026-07-28T08:55:00.000Z"
    },
    {
      "key": "job_search",
      "label": "Job search",
      "score": 38,
      "updatedAt": "2026-07-28T08:50:00.000Z"
    },
    {
      "key": "frontend",
      "label": "Frontend",
      "score": 31,
      "updatedAt": "2026-07-28T08:40:00.000Z"
    }
  ],
  "personalizedRecs": [
    {
      "id": "rec_interview_prep",
      "interestKey": "interview_prep",
      "interestScore": 42.5,
      "title": "Quick interview practice",
      "text": "You’re about 43 on Interview prep — try one short mock today.",
      "actionUrl": "/lms/interview-prep",
      "priority": 86
    }
  ],
  "alertTiming": {
    "bestHours": [10, 21, 9],
    "bestHourLabels": ["10:00 AM", "9:00 PM", "9:00 AM"],
    "bestWeekdays": ["Tue", "Wed"],
    "bestWindowLabel": "Tue / Wed · 10:00 AM–9:00 PM",
    "avoidHours": [3, 4, 5],
    "timezone": "Asia/Kolkata",
    "confidence": "medium",
    "reason": "Most active around 10:00 AM and 9:00 PM local time · avg session 18 min · often from Mumbai, Maharashtra, India",
    "sampleSessions": 12,
    "avgDurationMs": 1080000,
    "medianDurationMs": 900000
  },
  "locations": [
    {
      "key": "Mumbai, Maharashtra, India",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "sessions": 8,
      "totalDurationMs": 7200000
    }
  ],
  "sessionEngagement": {
    "sessionCount": 12,
    "avgDurationMs": 1080000,
    "uniqueIps": 2,
    "uniqueDevices": 2,
    "byHour": [],
    "byWeekday": []
  }
}
```

### Alert timing (`alertTiming`)

Derived from **login session start times + duration** (and location when present). HQ / sales should prefer `bestWindowLabel` when pushing HRYantra alerts or suggestion nudges.

Also available on:

| Endpoint | Auth |
|----------|------|
| `GET /api/hq/sessions/:candidateId` (backend1) | `x-internal-admin-key` |
| `GET /api/hq/sessions` (backend1 feed) | `x-internal-admin-key` |
| `GET /api/hq-sessions?userId=` (Next proxy) | same header optional |
| `GET /hq/candidates/:id/behavior` (phase2 HQ) | HQ auth |

### Multi-interest ratings (`interests`)

Derived from the behavioural engine + Office Gossips engagement (join / like / comment / circle open). Each topic has a **0–100** strength rating so HQ can personalize without guessing from a single role/company.

- Synced into every `POST /api/hq-behavior` payload alongside rollups and triggers
- Client relays again when interests change (`saasa:interest-affinity-updated`)

### Short personalized recs (`personalizedRecs`)

Top interests become **short, simple, personalized** nudge lines HQ can push via HRYantra chat or sales scripts. Prefer `title` + `text` + `actionUrl`; sort by `priority`.

- Source: `src/lib/interest-affinity-store.ts` → `buildHqInterestSnapshot`
- Wired in: `src/lib/hq-behavior.ts`, `UserActivityTrackerHost`

## GET responses

### `GET /api/hq-behavior`

Returns the latest payloads for up to 100 users.

### `GET /api/hq-behavior?userId=<candidateId>`

Returns the latest payload for one user.

## Current behavior triggers

### Classic signals

#### `hq_service_no_purchase` (`sales_follow_up`)
- Premium/service visits high + no apply conversion
- HQ/sales call for the right package

#### `hq_company_high_intent` (`high_intent`)
- Same company researched repeatedly (≥4)
- Push company jobs, reference checks, prep

#### `hq_role_research` (`career_assist`)
- Same role/family revisited (≥4)
- Matching jobs, quizzes, courses, mock interviews

#### `hq_cv_risk` (`watch`)
- High rejections + **weak** CV score (&lt;70)
- AI CV first; optional guided resume service

---

### Multi-signal combination triggers

These fire when **several** tracked signals align (not a single metric).

| ID | Flag | Audience | Combination | User nudge / sales action |
|----|------|----------|-------------|---------------------------|
| `hq_keyword_ats_gap` | `sales_follow_up` | both | Rejections high + **good** CV (≥70) + thin skills / missing profile sections / low market fit | Tailor JD keywords + finish profile; sales: ATS rewrite package |
| `hq_interview_stage_loss` | `career_assist` | both | ≥2 post-interview rejections (+ good CV or active apps) | Mock interview; sales: paid coaching |
| `hq_role_skill_mismatch` | `career_assist` | both | Role repeat + rejections / low skills | Role courses + keyword write-ups; LMS+CV bundle |
| `hq_company_research_no_apply` | `high_intent` | both | Company intent + community visits + ≤1 apply | Jobs + reference check; company intel package |
| `hq_premium_plus_intent` | `sales_follow_up` | hq | Premium visits + company/role intent | Warm lead — package tied to their target |
| `hq_cv_hesitation` | `user_nudge` | both | Heavy AI CV time + low applies | Apply nudge; optional rewrite assist |
| `hq_profile_incomplete_job_hunter` | `user_nudge` | both | Missing sections / low completeness + job browsing | Finish profile; guided completion service |
| `hq_ready_but_not_applying` | `career_assist` | both | Skills present + browse-heavy + low applies | One-click apply nudge; application coaching |
| `hq_shallow_premium_browse` | `sales_follow_up` | hq | Short sessions + premium visits | Short nurture offer, not hard sell |
| `hq_learn_then_target_role` | `user_nudge` | both | LMS-heavy + role interest | Bridge learning → applications |
| `hq_low_market_fit` | `career_assist` | both | Market fit &lt;55 + active hunting | CV gap coach + quizzes; consultation |

Each trigger may include:
- `audience`: `hq` | `user` | `both`
- `comboSignals`: list of signal keys that combined (e.g. `rejections`, `good_cv`, `skills_or_profile_gap`)

### Related behaviour insights (feed triggers + suggestions)

- `rejection_keyword_gap` — strong CV but still rejected (keyword/profile gap)
- `post_interview_drop` — losses after interview stage
- `incomplete_profile_active` — job hunting with incomplete profile
- `low_market_fit_active` — weak market fit while applying/browsing
- Plus existing: `skills_no_apply`, `browser_not_applier`, `rejection_cv_issue`, `rejection_skill_gap`, `lms_heavy`, `premium_curious`, `cv_edit_hesitation`, `community_research_mode`, `short_sessions`

### Suggestion mapping

`behaviourSignals.preferSlotIds` and `userSuggestionHints` are derived from the same combo triggers so the in-app suggestions engine and HQ see a consistent story (e.g. keyword gap → prefer `ai_cv` + `jobs` + `profile`).

Profile sync now also tracks `marketFit`, `missingSectionsCount`, and `missingSectionKeys` for these combinations.

- `src/lib/user-activity-tracker/store.ts`
- `src/lib/user-activity-tracker/insights.ts`
- `src/lib/interest-affinity-store.ts`
- `src/components/common/UserActivityTrackerHost.tsx`
- `src/lib/suggestions-engine/*`
- `src/lib/hq-behavior.ts`
- `src/app/api/hq-behavior/route.ts`

## Suggested HQ workflow

1. Poll `GET /api/hq-behavior`
2. Filter `triggers` by `flag` and `priority`
3. Push users into:
   - sales call queue
   - career assistance queue
   - high-intent recruiter follow-up queue
4. Mark handled flags in HQ/CRM
5. Later replace this route with backend persistence and webhook delivery
