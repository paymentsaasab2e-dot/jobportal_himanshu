# HQ Behavior API

This app now sends per-user behavior summaries and HQ trigger flags to:

- `POST /api/hq-behavior`
- `GET /api/hq-behavior`
- `GET /api/hq-behavior?userId=<candidateId>`

## Purpose

Use this endpoint for HQ / sales / operations follow-up when the product detects:

- user visits services but does not purchase
- user researches the same company repeatedly
- user keeps exploring the same role/position
- user has repeated rejections with weak CV signals
- user shows strong intent but low conversion

The current implementation stores the latest payload per user in-memory in the Next app route for demo/integration purposes. HQ can later replace this route with a backend service, CRM webhook, or queue consumer.

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
  ]
}
```

## GET responses

### `GET /api/hq-behavior`

Returns the latest payloads for up to 100 users.

### `GET /api/hq-behavior?userId=<candidateId>`

Returns the latest payload for one user.

## Current behavior triggers

### `hq_service_no_purchase`

Raised when:

- premium/service page visits are high
- no purchase/apply conversion is visible

Recommended use:

- HQ or sales can call and explain the right service/package

### `hq_company_high_intent`

Raised when:

- the same company is viewed/researched repeatedly
- often from Office Gossips / company pages / reference surfaces

Recommended use:

- push jobs from that company
- push reference-check connections for that company
- offer company-specific prep

### `hq_role_research`

Raised when:

- the same job family / role is revisited multiple times

Recommended use:

- recommend matching roles, quizzes, interview prep, and role-specific courses

### `hq_cv_risk`

Raised when:

- rejections are high
- CV score is weak

Recommended use:

- push AI CV fixes first
- if needed, HQ can offer guided CV or recruiter-facing services

## Where the data comes from

- `src/lib/user-activity-tracker/store.ts`
- `src/lib/user-activity-tracker/insights.ts`
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
