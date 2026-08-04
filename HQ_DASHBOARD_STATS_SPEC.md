# HQ Dashboard Stats Spec

Setup-ready spec for the **HQ / Management** dashboard: what to show, what to move off HQ, what to add, graph types, data fields, and simple functional logic.

**Audience:** Platform management (Pranavi / SAASA HQ) — platform health, usage, monetization, risk.  
**Not for:** Tenant recruiters, employer admins, or individual employees (those get their own dashboards later).

Related docs:

- [`HQ_HELP_TICKETS_API.md`](./HQ_HELP_TICKETS_API.md) — support tickets
- [`HQ_BEHAVIOR_API.md`](./HQ_BEHAVIOR_API.md) — behaviour / sessions
- Screenshots reference: current Phase 2 HQ live boards (KPI row, charts, activity, quick actions)

---

## 1. Design rules

| Rule | Meaning |
|------|---------|
| **Cross-tenant only** | Every HQ number is aggregated across customers, or ranked *by tenant*. Never “my interviews today” for one recruiter. |
| **Business + usage** | Management needs revenue/growth **and** proof tenants get hiring outcomes. |
| **Outcomes > volume** | Prefer joins / placements / activation over raw résumé count. |
| **Trends matter** | Prefer 7d / 30d / MoM next to totals. |
| **Alerts are first-class** | Surface at-risk tenants and stuck funnels above vanity charts. |

### Viewpoint split

| Lens | Question |
|------|----------|
| **HQ / Management** | Is the platform healthy, growing, monetizing, and are tenants using it? |
| **User / Tenant ops** | Is *my* hiring pipeline moving? What do *I* do today? |

---

## 2. Category legend

| Tag | Meaning | Action on HQ dash |
|-----|---------|-------------------|
| `HQ_KEEP` | Core management KPI | Keep / polish |
| `HQ_AGG` | Platform aggregate OK; detail belongs on tenant dash | Keep summary only |
| `USER_MOVE` | Recruiter / employee / single-tenant ops | Remove or demote from HQ |
| `HQ_ADD` | Missing but high value for management | Add (this spec) |

---

## 3. Current widgets — categorize

### 3.1 Top live banner / alerts

| Widget | Tag | Notes |
|--------|-----|-------|
| Live Phase 2 snapshot (tenants, open jobs, interviews today, apps 7d) | `HQ_AGG` | Keep as **platform pulse**. Drop “interviews today” as a hero signal unless tied to tenant activity health. |
| Alert: tenants with zero open jobs + zero candidates | `HQ_KEEP` | At-risk / inactive customers |
| Alert: applications exist but no joined placements | `HQ_KEEP` | Outcome stuck — product value risk |

### 3.2 KPI cards (top row)

| Widget | Tag | Graph / viz | Verdict |
|--------|-----|-------------|---------|
| Total Companies (HQ CRM) | `HQ_KEEP` | KPI number + 7d/30d delta | Keep |
| Total Tenants (active / paused) | `HQ_KEEP` | KPI + sparkline (30d tenant count) | Keep |
| Pipeline Value ($) | `HQ_KEEP` | KPI + sparkline | Keep; clarify currency + stage definition |
| Candidates (total) | `HQ_AGG` | KPI | Demote: show **active candidates used in hiring (7d/30d)** as primary; total DB size as secondary |
| Trial Accounts | `HQ_KEEP` | KPI | Keep |
| Paid Accounts | `HQ_KEEP` | KPI | Keep |
| Demo Requests | `HQ_KEEP` | KPI | Keep |
| Active Jobs | `HQ_AGG` | KPI | Keep as platform total |

### 3.3 Charts mid / lower

| Widget | Tag | Graph type (current) | Verdict |
|--------|-----|----------------------|---------|
| Tenant Activity | `HQ_KEEP` | Multi-series **line** or grouped **bar** by tenant | Keep; add concentration callout (% from top 1–3 tenants) |
| Jobs by Status | `HQ_AGG` | **Bar** (OPEN / CLOSED / FILLED / …) | Keep platform rollup only |
| Demo → Trial → Paid funnel | `HQ_KEEP` | **Funnel** or stepped bar | Keep; add conversion % between stages |
| Lead Pipeline (qualified / demo) | `HQ_KEEP` | **Horizontal bar** or stage chips + count | Keep |
| Landing Value | `HQ_KEEP` | KPI / small bar | Keep |

### 3.4 Distribution & health row

| Widget | Tag | Graph type | Verdict |
|--------|-----|------------|---------|
| Tenant Distribution (agency / standalone) | `HQ_KEEP` | **Doughnut** | Keep |
| Subscription Plans (Pro / Basic / Enterprise) | `HQ_KEEP` | **Bar** | Keep; pair with MRR when added |
| Hiring Funnel (Jobs → Candidates → Apps → Interviews → Placements → Joined) | `HQ_AGG` | **Progress list** or funnel | Keep as platform throughput; fix misleading % on raw candidates |
| Workload Mix (% candidates vs jobs vs apps…) | `HQ_AGG` | **Doughnut** | Optional / secondary — storage shape, not management priority |
| Platform Health Score | `HQ_KEEP` | **Semi-gauge** (0–100) | Keep; document formula (see §5) |
| Geographical Distribution | `HQ_KEEP` | **Horizontal bar** or ranked list | Keep |
| Top Performing Tenants | `HQ_KEEP` | **Table** | Keep; add At-Risk table twin |
| Demo Analytics (verified / pending / …) | `HQ_KEEP` | **Doughnut** | Keep |
| Recruitment Analytics (interview / lead / placement / join rates) | `HQ_AGG` | **KPI grid** | Keep as platform benchmarks |

### 3.5 Activity, status, quick actions

| Widget | Tag | Verdict |
|--------|-----|---------|
| Recent Activity (job posts + purchases) | `HQ_AGG` | Keep but **weight tenant/sales events** over single job titles |
| Live Platform Status tiles | `HQ_AGG` | Keep tenants / paused / open jobs / apps 7d; demote interviews/follow-ups/tasks |
| Quick Actions: Create Tenant, Create Plan, System Logs | `HQ_KEEP` | Keep |
| Quick Actions: Add User, Send Email | `USER_MOVE` | Demote — tenant admin / ops tools |
| Quick Actions: Generate Report | `HQ_KEEP` | Keep (export HQ snapshot) |
| Per-employee performance table (name, plan, personal counters) | `USER_MOVE` | Off HQ → employer / manager dash |
| Platform version / last sync footer | `HQ_KEEP` | Fine as metadata |

---

## 4. What to remove or move off HQ

These belong on **employer admin** or **recruiter / employee** dashboards, not the management platform board.

| Item | Move to | Why |
|------|---------|-----|
| Interviews today | Recruiter home | Day-to-day work queue |
| Follow-ups today | Recruiter home | Same |
| Open tasks (personal) | Recruiter home | Same |
| Add User (primary CTA) | Tenant admin | Seat management inside a company |
| Send Email (primary CTA) | Ops / CRM tool | Not a usage KPI |
| Per-person rows (e.g. recruiter scorecards) | Employer manager view | Individual performance |
| Job-detail-heavy activity as hero feed | Optional HQ sample only | Dominates over sales/tenant signals |
| Raw “Candidates total” as hero KPI | Secondary metric | DB size ≠ adoption |

---

## 5. HQ layout (target)

### Row A — Business health

1. Total Tenants (active / paused)  
2. Paid vs Trial  
3. **MRR / ARR** (`HQ_ADD`)  
4. Pipeline Value  
5. Demo → Paid conversion %  

### Row B — Product usage (value proof)

1. Active tenants (logged in / posted job in window)  
2. Open jobs (platform)  
3. Apps / Interviews / Placements / Joins — **7d & 30d**  
4. Platform Health Score  

### Row C — Risk & concentration

1. Inactive / zero-activity tenants alert  
2. Stuck funnel (apps without joins)  
3. Top tenants table + **At-risk tenants** table  
4. Plan mix (+ MRR by plan)  

### Row D — Growth & market

1. Demo analytics  
2. Lead pipeline stages  
3. Geography  
4. Recent purchases / new tenants  

Optional secondary: Workload Mix, raw candidate DB size, API version strip.

---

## 6. New metrics to add (`HQ_ADD`) — full detail

Each block below is setup-ready: purpose, data shown, graph type, simple logic, functional notes.

---

### 6.1 MRR / ARR

| Field | Detail |
|-------|--------|
| **Tag** | `HQ_ADD` |
| **Purpose** | Show real monetization. Plan mix (Pro/Basic/Enterprise) without $ is incomplete for management. |
| **Primary number** | **MRR** — Monthly Recurring Revenue |
| **Secondary** | **ARR** = MRR × 12; MoM % change |
| **Graph type** | KPI card + **area/line sparkline** (last 6–12 months). Optional stacked **bar**: MRR by plan. |
| **Data to show** | `mrr`, `arr`, `mrrChangeMomPct`, `mrrByPlan[{ planId, planName, mrr, tenantCount }]`, `currency` |
| **Simple logic** | For each **paid, non-cancelled** tenant: `planPriceMonthly` (normalize annual plans ÷ 12). `MRR = sum(planPriceMonthly)`. Exclude trials, paused (or count paused separately as “at risk MRR”). |
| **Functional** | Source: subscription / plan assignment table. Recalc on plan change, upgrade, cancel, pause. HQ card reads pre-aggregated snapshot (cron or on-demand rollup). |
| **Edge cases** | Custom Enterprise pricing → store `overrideMrr` on tenant. Multi-currency → convert to HQ base currency or show base only. |

**Example display**

```
MRR          $12,400
ARR          $148,800
MoM          +8.2%
By plan      Pro $7.5k · Basic $2.1k · Enterprise $2.8k
```

---

### 6.2 Churn / pause / cancel rate

| Field | Detail |
|-------|--------|
| **Tag** | `HQ_ADD` |
| **Purpose** | “0 paused” as a static tile is weak — management needs **trend** of losing or freezing customers. |
| **Primary number** | Logo churn % (30d) and/or revenue churn % |
| **Secondary** | Paused count, cancelled count, net tenant change |
| **Graph type** | KPI + **line** (monthly churn %). Optional **bar**: cancelled vs paused vs reactivated. |
| **Data to show** | `tenantsStartOfPeriod`, `cancelledInPeriod`, `pausedInPeriod`, `logoChurnPct`, `revenueChurnPct`, `reactivatedInPeriod` |
| **Simple logic** | `logoChurnPct = cancelledInPeriod / tenantsStartOfPeriod * 100`. `revenueChurnPct = lostMrrInPeriod / mrrStartOfPeriod * 100`. Windows: 30d and calendar month. |
| **Functional** | Event log: `tenant.status` transitions (`active` → `paused` / `cancelled`). Snapshot daily for charts. |
| **Alert** | If logo churn 30d > threshold (e.g. 5%), banner on HQ. |

---

### 6.3 Activation rate

| Field | Detail |
|-------|--------|
| **Tag** | `HQ_ADD` |
| **Purpose** | New tenants that never post a job or get an application are silent failures. Activation = first real product value. |
| **Primary number** | % of new tenants activated within 7d / 14d |
| **Secondary** | Median days to first job; median days to first application |
| **Graph type** | KPI + **funnel**: Signed up → First job → First app → First placement. Optional cohort **bar**. |
| **Data to show** | `newTenantsInWindow`, `activatedCount`, `activationRatePct`, `medianDaysToFirstJob`, `definition` |
| **Simple logic** | Tenant is **activated** if within N days of `createdAt` they have: ≥1 job posted **OR** ≥1 application received (pick one definition and document it). Recommended default: **first job posted within 14 days**. |
| **Functional** | Cohort by signup week. HQ shows last 30d cohort rate + trend. |

**Recommended definition (lock this in product)**

```
Activated = tenant.createdAt + 14d window AND count(jobs created) >= 1
activationRate = activated / newTenantsInCohort
```

---

### 6.4 Active users (recruiters) — DAU / WAU

| Field | Detail |
|-------|--------|
| **Tag** | `HQ_ADD` |
| **Purpose** | 9 tenants ≠ 9 people using the product. Management needs people activity, not only org count. |
| **Primary number** | **WAU** (unique recruiters/admins with a session in 7d) |
| **Secondary** | DAU, DAU/WAU stickiness, WAU / seat capacity |
| **Graph type** | KPI + **line** (DAU/WAU over 30–90d). Optional **bar**: WAU by tenant (top 10). |
| **Data to show** | `dau`, `wau`, `mau`, `stickinessDauWau`, `activeRecruitersByTenant[]` |
| **Simple logic** | Unique `userId` with role in `{recruiter, admin, hiring_manager}` and ≥1 authenticated session (or meaningful event) in window. Reuse HQ behaviour/session store where possible ([`HQ_BEHAVIOR_API.md`](./HQ_BEHAVIOR_API.md)). |
| **Functional** | Daily rollup from session / login events. Exclude HQ internal staff if flagged `isInternal`. |

---

### 6.5 Time-to-first-value (TTFV)

| Field | Detail |
|-------|--------|
| **Tag** | `HQ_ADD` |
| **Purpose** | How fast new customers reach a meaningful milestone — predicts retention and sales quality. |
| **Primary number** | Median days: signup → first job; signup → first placement (if enough data) |
| **Secondary** | P50 / P90; % still at 0 jobs after 14d |
| **Graph type** | KPI pair + **histogram** or box-style summary (P50/P90). |
| **Data to show** | `medianDaysToFirstJob`, `p90DaysToFirstJob`, `medianDaysToFirstPlacement`, `sampleSize` |
| **Simple logic** | `days = date(firstJob.createdAt) - date(tenant.createdAt)`. Median across tenants with that event in last 90d. |
| **Functional** | Compute offline nightly; store on analytics snapshot. |

---

### 6.6 Time-to-fill (platform median)

| Field | Detail |
|-------|--------|
| **Tag** | `HQ_ADD` |
| **Purpose** | Core recruitment outcome HQ can sell: how long open → filled/joined across the platform. |
| **Primary number** | Median days job open → placement/joined |
| **Secondary** | By job type / by plan; trend MoM |
| **Graph type** | KPI + **line** (monthly median). Optional **bar** by plan. |
| **Data to show** | `medianDaysToFill`, `p90DaysToFill`, `filledJobsInWindow`, `definition` |
| **Simple logic** | For jobs that reached `PLACED` or `JOINED`: `days = statusAchievedAt - job.openedAt`. Exclude cancelled. Platform median over last 90d. |
| **Functional** | Requires reliable job status timestamps. If join date missing, use placement date and label clearly. |

---

### 6.7 Net revenue retention / expansion

| Field | Detail |
|-------|--------|
| **Tag** | `HQ_ADD` |
| **Purpose** | Are existing customers expanding (Basic→Pro, more seats) or shrinking? |
| **Primary number** | NRR % (trailing 12m or last month cohort) |
| **Secondary** | Expansion MRR, contraction MRR, upgrade count |
| **Graph type** | KPI + **waterfall bar** (start MRR → expansion → contraction → churn → end) or simple MoM expansion $. |
| **Data to show** | `nrrPct`, `expansionMrr`, `contractionMrr`, `upgradesCount`, `downgradesCount` |
| **Simple logic** | Classic SaaS: starting MRR of cohort + expansion − contraction − churn, divided by starting MRR. v1 can be simpler: **MoM expansion MRR** from plan upgrades only. |
| **Functional** | Plan-change events with old/new price. |

---

### 6.8 Support load (tickets)

| Field | Detail |
|-------|--------|
| **Tag** | `HQ_ADD` |
| **Purpose** | Usage pain shows up as tickets. Ties product health to CS load. Reuse help tickets API. |
| **Primary number** | Open tickets; median time-to-resolve (7d/30d) |
| **Secondary** | By category; new vs closed this week |
| **Graph type** | KPI + **bar** by category; optional **line** open tickets over time. |
| **Data to show** | `openCount`, `inProgressCount`, `closed7d`, `medianResolveHours`, `byCategory[]` |
| **Simple logic** | From `hq-analytics.json` tickets ([`HQ_HELP_TICKETS_API.md`](./HQ_HELP_TICKETS_API.md)): filter `status`, group `category`, resolve time = `closedAt - createdAt` when closed. |
| **Functional** | HQ card calls tickets list/summary endpoint; no new domain required for v1. |

---

### 6.9 Feature adoption

| Field | Detail |
|-------|--------|
| **Tag** | `HQ_ADD` |
| **Purpose** | Which product surfaces are actually used (AI match, interviews module, etc.). Guides roadmap. |
| **Primary number** | % of active tenants using feature X in 30d |
| **Secondary** | Ranked feature list; adoption by plan |
| **Graph type** | **Horizontal bar** (% tenants) or heatmap tenant×feature (later). |
| **Data to show** | `features[{ key, label, tenantsUsing, pctOfActiveTenants }]` |
| **Simple logic** | Feature used if tenant has ≥1 qualifying event in 30d (e.g. `interview.scheduled`, `ai.match.run`). `pct = tenantsUsing / activeTenants`. |
| **Functional** | Needs event taxonomy. Start with 4–6 features max. |

---

### 6.10 Concentration risk

| Field | Detail |
|-------|--------|
| **Tag** | `HQ_ADD` |
| **Purpose** | Tenant Activity already shows skew (one tenant dominates). Make it an explicit management risk KPI. |
| **Primary number** | % of platform jobs (or apps / candidates) from top 1 and top 3 tenants |
| **Secondary** | Herfindahl-style optional later; list of dominant tenants |
| **Graph type** | KPI chips + existing Tenant Activity chart annotation. |
| **Data to show** | `top1JobsPct`, `top3JobsPct`, `top1TenantName`, `metric` (`jobs` \| `applications` \| `candidates`) |
| **Simple logic** | Sort tenants by metric desc; `top1 = max/total`; `top3 = sum(top3)/total`. |
| **Alert** | If `top1JobsPct > 40%`, show warning — platform numbers are not diversified. |

---

### 6.11 Cohort retention

| Field | Detail |
|-------|--------|
| **Tag** | `HQ_ADD` |
| **Purpose** | Still active at Month 1 / Month 3 after signup. |
| **Primary number** | M1 and M3 active retention % |
| **Secondary** | Cohort table by signup month |
| **Graph type** | **Cohort heatmap** (rows = signup month, cols = M0…M6) or simple dual KPI for M1/M3. |
| **Data to show** | `cohorts[{ month, size, retainedM1, retainedM3, rateM1, rateM3 }]` |
| **Simple logic** | Tenant “retained” at Mn if still `active` (not cancelled) **and** had ≥1 login or ≥1 job event in that month (pick definition). |
| **Functional** | Monthly batch job. |

---

### 6.12 Reliability strip (light)

| Field | Detail |
|-------|--------|
| **Tag** | `HQ_ADD` |
| **Purpose** | Management trust: is the platform up? |
| **Primary number** | Uptime % (30d) or error rate |
| **Secondary** | Last incident; API p95 latency (optional) |
| **Graph type** | Small status pill + optional sparkline. Not a large card. |
| **Data to show** | `uptimePct30d`, `errorRate24h`, `status` (`operational` \| `degraded`) |
| **Simple logic** | From health checks / APM if available; else manual status until wired. |
| **Functional** | Footer-adjacent; do not dominate the dash. |

---

## 7. Existing HQ widgets — tighten definitions

Use these definitions so charts stay consistent.

### 7.1 Platform Health Score (0–100)

**Purpose:** Single adoption/health signal across ranked tenants.

**Suggested v1 formula (document & tune):**

```
Per tenant score (0–100):
  + hasOpenJobs          ? 25 : 0
  + appsIn30d > 0        ? 25 : 0
  + interviewsIn30d > 0  ? 20 : 0
  + placementsIn30d > 0  ? 20 : 0
  + loginIn7d            ? 10 : 0

Platform Health = average(tenantScore) for tenants with status=active
Optional: exclude tenants younger than 7 days
```

**Graph:** Semi-circle gauge. Subtitle: `N ranked tenants`.

### 7.2 Hiring Funnel (platform)

| Stage | Count source |
|-------|----------------|
| Jobs | Open + recently active jobs (define window) |
| Candidates | Prefer **touched in hiring** over full DB |
| Applications | Applications created in window or all-time — pick one; label UI |
| Interviews | Interview records |
| Placements | Status placed |
| Joined | Status joined |

**Conversion labels:** Stage_n / Jobs (or stage / previous stage) — never show “+40,000%” style growth on raw candidate imports.

**Graph:** Vertical progress list or funnel.

### 7.3 Demo → Trial → Paid

| Stage | Definition |
|-------|------------|
| Demo Requests | Inbound demos (all or verified — label which) |
| Landing Purchases | Paid via landing |
| Trial Accounts | Active trials |
| Paid Customers | Paying tenants |
| Active Tenants | Paid or trial with status active |

**Graph:** Funnel. Show `%` between consecutive stages.

### 7.4 Top Performing Tenants table

| Column | Source |
|--------|--------|
| Tenant name | Tenant profile |
| Plan | Current plan |
| Active jobs | Count open |
| Applications | Windowed (7d or 30d — label) |
| Placements | Windowed |
| Health | Per-tenant score from §7.1 |

**Twin table (add):** At-Risk Tenants — low health, zero jobs, churning, or no login 14d+.

---

## 8. Graph type cheat sheet (HQ)

| Metric | Recommended graph |
|--------|-------------------|
| Single KPI + trend | Number + sparkline (line/area) |
| Plan / status mix | Bar or doughnut |
| Sales / product funnel | Funnel or stepped horizontal bar |
| Tenant comparison | Grouped bar or multi-line |
| Rankings | Table |
| Health | Gauge |
| Geography | Horizontal bar / ranked list |
| Cohort retention | Heatmap (or dual KPI until heatmap ready) |
| MRR by plan | Stacked bar |
| Concentration | KPI + annotation on Tenant Activity |
| Support by category | Bar |

Avoid: decorative gauges for every metric; employee-level sparklines on HQ.

---

## 9. Suggested API / snapshot shape (functional)

Nightly or on-demand rollup consumed by HQ UI. Illustrative only — align with existing HQ stores when implementing.

```ts
type HqDashboardSnapshot = {
  capturedAt: string;
  currency: string;

  business: {
    totalCompanies: number;
    totalTenants: number;
    activeTenants: number;
    pausedTenants: number;
    trialAccounts: number;
    paidAccounts: number;
    mrr: number;
    arr: number;
    mrrChangeMomPct: number | null;
    mrrByPlan: { planId: string; planName: string; mrr: number; tenantCount: number }[];
    pipelineValue: number;
    pipelineByStage: { stage: string; count: number; value: number }[];
    demoRequests: number;
    demoByStatus: { status: string; count: number }[];
    logoChurnPct30d: number | null;
    nrrPct: number | null;
  };

  usage: {
    openJobs: number;
    jobsByStatus: { status: string; count: number }[];
    candidatesTotal: number;
    candidatesActive30d: number;
    applications7d: number;
    applications30d: number;
    interviews7d: number;
    interviews30d: number;
    placements30d: number;
    joined30d: number;
    hiringFunnel: { stage: string; count: number }[];
    platformHealthScore: number;
    rankedTenantCount: number;
    dau: number;
    wau: number;
    activationRate14d: number | null;
    medianDaysToFirstJob: number | null;
    medianDaysToFill: number | null;
    concentration: { top1JobsPct: number; top3JobsPct: number; top1TenantName: string | null };
  };

  risk: {
    zeroActivityTenants: number;
    appsWithoutJoins: boolean;
    atRiskTenants: {
      tenantId: string;
      name: string;
      plan: string;
      health: number;
      reason: string;
    }[];
  };

  topTenants: {
    tenantId: string;
    name: string;
    plan: string;
    activeJobs: number;
    applications: number;
    placements: number;
    health: number;
  }[];

  geo: { label: string; count: number }[];
  tenantTypeMix: { type: string; count: number }[];
  support: {
    openCount: number;
    inProgressCount: number;
    medianResolveHours7d: number | null;
    byCategory: { category: string; count: number }[];
  };

  featureAdoption: { key: string; label: string; pctOfActiveTenants: number }[];
};
```

---

## 10. Implementation priority

| Priority | Items | Why |
|----------|-------|-----|
| **P0** | Keep HQ_KEEP widgets; remove/demote `USER_MOVE`; fix candidate hero metric; document health + funnel defs | Clean management view fast |
| **P1** | MRR/ARR, Activation rate, WAU, Concentration, Support load (tickets already exist) | Highest management value |
| **P2** | Churn trends, TTFV, Time-to-fill, At-risk table twin | Retention / CS |
| **P3** | NRR/expansion, Feature adoption, Cohort heatmap, Reliability strip | Mature SaaS board |

---

## 11. Keep / Move / Add — checklist

### Keep on HQ

- [ ] Total Tenants (+ active/paused)
- [ ] Paid / Trial accounts
- [ ] Subscription Plans chart
- [ ] Tenant Distribution
- [ ] Pipeline Value + Lead Pipeline
- [ ] Demo Requests + Demo funnel + Demo Analytics
- [ ] Platform Health Score (with documented formula)
- [ ] Top Performing Tenants
- [ ] Geographical Distribution
- [ ] Inactive / stuck-funnel alerts
- [ ] Create Tenant / Create Plan / System Logs / Generate Report
- [ ] Platform Hiring Funnel & Jobs by Status (**aggregates only**)
- [ ] Tenant Activity (+ concentration callout)

### Move / demote off HQ

- [ ] Interviews today / Follow-ups today / Open tasks (as hero tiles)
- [ ] Add User / Send Email as primary quick actions
- [ ] Per-employee performance tables
- [ ] Job-title spam as main Recent Activity (rebalance to tenant/sales)
- [ ] Raw Candidates total as primary KPI

### Add for management

- [ ] MRR / ARR (+ by plan)
- [ ] Churn / pause rate (30d trend)
- [ ] Activation rate (14d)
- [ ] DAU / WAU (recruiters)
- [ ] Time-to-first-value
- [ ] Time-to-fill (median)
- [ ] NRR / expansion (or MoM expansion MRR v1)
- [ ] Support load (from help tickets)
- [ ] Feature adoption
- [ ] Concentration risk KPI
- [ ] Cohort retention M1/M3
- [ ] Light reliability strip

---

## 12. Out of scope (next docs)

| Next | Content |
|------|---------|
| **Employer dashboard** | Company admin: seats, jobs, team funnel, billing for *their* tenant — not platform MRR |
| **Recruiter / employee dashboard** | My interviews, follow-ups, tasks, personal pipeline |
| **Candidate dashboard** | Already separate product surface |

After this HQ spec is agreed, next step: same format for **Employer** dashboard (keep / move / add + graph types + logic).

---

## 13. Quick reference — tag summary

| Tag | Count (approx.) | Action |
|-----|-----------------|--------|
| `HQ_KEEP` | Most sales, tenant, plan, demo, health widgets | Stay |
| `HQ_AGG` | Jobs, funnel, candidates, live pulse | Summary only on HQ |
| `USER_MOVE` | Day-ops tiles, employee tables, Add User | Off HQ |
| `HQ_ADD` | MRR, churn, activation, WAU, TTFV, time-to-fill, NRR, support, features, concentration, cohorts, uptime | Build |

---

*Doc version: 1.0 — HQ management dashboard stats. Ready for setup / implementation planning.*
