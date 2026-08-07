# Employees Dashboard Stats Spec

Setup-ready spec for the **Employees / Candidates dashboard** (Phase 1 portal analytics): what to show for HQ management viewing candidate-side usage, what to demote, what to add, graph types, data fields, and simple functional logic.

**Audience:** Platform management watching the **job-seeker / employee (candidate) product** — signup, profile quality, applications, engagement, conversion.  
**Not for:** Tenant MRR/plans (see [`HQ_DASHBOARD_STATS_SPEC.md`](./HQ_DASHBOARD_STATS_SPEC.md)), employer company admin (next doc), or a single recruiter’s daily queue.

Related docs:

- [`HQ_DASHBOARD_STATS_SPEC.md`](./HQ_DASHBOARD_STATS_SPEC.md) — HQ platform / tenants / MRR
- [`HQ_BEHAVIOR_API.md`](./HQ_BEHAVIOR_API.md) — behaviour heartbeats / sessions (`/api/hq-behavior`)
- Screenshots reference: Employees dashboard — Live Phase 1 (snapshots, KPI row, funnels, sessions, geo)

---

## 1. Design rules

| Rule | Meaning |
|------|---------|
| **Candidate-side only** | Numbers describe seekers on the Phase 1 portal, not tenant billing. |
| **Aggregates for HQ** | Management sees totals, rates, trends, top-N. Named session tables are ops/privacy. |
| **Activation > headcount** | Prefer resume upload, profile complete, first apply over raw candidate count. |
| **Conversion labeled** | Every funnel stage shows count **and** % vs previous (or vs registration). |
| **Fix hollow metrics** | Do not promote Avg Match % or Avg Duration until data/logic is trustworthy. |
| **Trends matter** | 7d / 30d / MoM next to totals; Daily/Weekly/Monthly toggles where charts already have them. |

### Viewpoint split

| Lens | Question |
|------|----------|
| **HQ / Management (this board)** | Are candidates signing up, completing profiles, applying, and converting? Is the portal engaging them? |
| **User / ops** | Individual sessions, one person’s journey, recruiter interview queues |

---

## 2. Category legend

| Tag | Meaning | Action on Employees HQ dash |
|-----|---------|-----------------------------|
| `EMP_KEEP` | Core candidate-platform KPI for management | Keep / polish |
| `EMP_AGG` | Aggregate OK; drill-down is ops or employer | Keep summary only |
| `USER_MOVE` | Named users, day-ops, debug | Remove or demote to ops drawer |
| `EMP_ADD` | Missing but high value for management | Add (this spec) |

---

## 3. Current widgets — categorize

### 3.1 Header snapshots

| Widget | Tag | Graph / viz | Verdict |
|--------|-----|-------------|---------|
| Candidate Snapshot (candidates, apps, applied today) | `EMP_KEEP` | Horizontal capsule / KPI strip | Keep |
| Session Snapshot (logins 7d, online now, avg duration) | `EMP_AGG` | Capsule | Keep aggregates; fix duration logic before trusting |
| New Candidate Snapshot (7d / 24h) | `EMP_KEEP` | Capsule | Keep |
| Live Phase 1 badge + updated timestamp | `EMP_KEEP` | Meta | Keep |

### 3.2 Phase 1 live tracking

| Widget | Tag | Graph / viz | Verdict |
|--------|-----|-------------|---------|
| Online Now / Tracked Users | `EMP_AGG` | Status tiles | Ops strip — not hero exec KPI |
| Visits 7D / Job Clicks 7D / Applies 7D / Active Time 7D | `EMP_KEEP` | Status tiles | Keep; wire heartbeats; promote as conversion inputs |
| Page Mix (7d) | `EMP_KEEP` | **Doughnut / pie** | Keep when visits exist |
| Live Feed | `EMP_AGG` | Event list | Sample volume OK; demote named noise |

### 3.3 KPI cards

| Widget | Tag | Graph / viz | Verdict |
|--------|-----|-------------|---------|
| Total Candidates | `EMP_KEEP` | KPI + sparkline + % vs prior | Keep |
| New Candidates | `EMP_KEEP` | KPI + sparkline | Keep |
| Open Jobs | `EMP_AGG` | KPI + LIVE | Keep as marketplace supply |
| Applications | `EMP_KEEP` | KPI + sparkline | Keep |
| Active Applications | `EMP_KEEP` | KPI + LIVE | Keep; define “active” |
| Interview Requests | `EMP_AGG` | KPI + sparkline | Keep platform total |
| Avg Match Score | `EMP_AGG` | KPI | Keep card only when coverage > threshold; else show “insufficient data” |
| Profile Completeness | `EMP_KEEP` | KPI + sparkline | Keep as **platform average %** |

### 3.4 Trends & funnel

| Widget | Tag | Graph type | Verdict |
|--------|-----|------------|---------|
| Candidates Joined Over Time | `EMP_KEEP` | **Area / line** (Daily / Monthly) | Keep |
| Hiring Funnel | `EMP_KEEP` | **Horizontal funnel** | Keep; add stage conversion % |
| Applications Over Time | `EMP_KEEP` | **Area / line** (Daily / Weekly / Monthly) | Keep |

### 3.5 Demographics & AI

| Widget | Tag | Graph type | Verdict |
|--------|-----|------------|---------|
| Candidates by Source | `EMP_KEEP` | **Doughnut** | Keep; pair with source quality (`EMP_ADD`) |
| Top Skills | `EMP_KEEP` | **Horizontal bar** | Keep (talent supply) |
| Experience Distribution | `EMP_KEEP` | **Vertical bar** | Keep |
| Top Candidate Locations | `EMP_KEEP` | Map dots + ranked list | Keep; reduce “Unknown” via profile prompts |
| AI Analytics Overview | `EMP_KEEP` | 4× KPI + sparkline | Keep averages when sample size OK |

### 3.6 Process & jobs

| Widget | Tag | Graph type | Verdict |
|--------|-----|------------|---------|
| Interview Status | `EMP_AGG` | **Doughnut** | Keep platform mix |
| Top Performing Jobs | `EMP_AGG` | **Table** | Keep top-N portal jobs |
| Candidate Journey | `EMP_KEEP` | **Horizontal stage flow** + % | Keep; primary activation view |
| Recently Posted Jobs | `EMP_AGG` | Counters + list | Counts = keep; long title list = secondary |
| Job Status Mix | `EMP_AGG` | **Horizontal stacked / progress bar** | Keep |
| Application Rate / Offer Rate | `EMP_KEEP` | KPI + sparkline | Keep; document formulas |

### 3.7 Sessions & geo

| Widget | Tag | Graph type | Verdict |
|--------|-----|------------|---------|
| Session Overview KPIs | `EMP_KEEP` | KPI tiles | Keep aggregates |
| Sessions over time | `EMP_KEEP` | **Line chart** | Keep |
| Logins by Country | `EMP_KEEP` | **Doughnut** | Keep |
| By State / Region / City | `EMP_KEEP` | Ranked lists | Keep |
| Recent Sessions (named users) | `USER_MOVE` | Table | Ops drawer / support only — not management hero |

---

## 4. What to remove or demote

| Item | Move to | Why |
|------|---------|-----|
| Recent Sessions name-level table | Ops / support tool | PII; not needed for management story |
| Online Now / Tracked Users as primary hero | Live ops strip | Often empty / heartbeat-dependent |
| Uncapped Avg Duration (e.g. 22h–69h) as trusted KPI | Hide until idle timeout logic exists | Misleading session hygiene |
| Avg Match Score when mostly `—` | Show “n/a” + coverage % | Hollow metric hurts trust |
| Job-title spam as main middle content | Collapsed “sample postings” | Funnel/journey should dominate |
| Per-recruiter interview queues | Employer / recruiter dash | Wrong audience |

---

## 5. Target layout (Employees HQ view)

### Row A — Candidate growth

1. Total Candidates  
2. New Candidates (7d / 24h)  
3. Applications + Active Applications  
4. Application Rate  

### Row B — Conversion & outcomes

1. Candidate Journey (with drop-off)  
2. Hiring Funnel (with stage %)  
3. Candidates Joined Over Time  
4. Applications Over Time  
5. Offer Rate / Join Rate  

### Row C — Supply & quality

1. Open Jobs + Job Status Mix  
2. Candidates by Source (+ source quality)  
3. AI averages (ATS / resume / completeness) — with sample size  
4. Top Skills / Experience / Locations  

### Row D — Engagement (aggregates)

1. Logins 7d / Candidate DAU·WAU  
2. Visits → Clicks → Applies conversion  
3. **Premium services usage** (services / AI CV / interview prep / courses — most → least)  
4. **Popular features** + most/least  
5. **Entry points** (first meaningful open — e.g. landed on `/services` then logged in)  
6. **Community & chat** (Office Gossip, reference check, chat signals)  
7. **Top interests** + **trending topics** (affinity engine + role/company intent)  
8. Page Mix  
9. Geo (country / region)  
10. Session trend / recent sessions  

**Ops drawer (not main):** Live heartbeats debug, named Recent Sessions detail, raw Live Feed.

---

## 6. Current stats — full detail (purpose / data / graph / logic)

Each block is setup-ready.

---

### 6.1 Candidate Snapshot

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | Instant pulse: how large the candidate base is and application pressure today. |
| **Graph type** | Capsule / KPI strip (no chart required). |
| **Data to show** | `totalCandidates`, `totalApplications`, `appliedToday` |
| **Simple logic** | Count candidates with status ≠ deleted. Applications = all application rows (or window — label UI). `appliedToday` = applications with `createdAt` in local HQ timezone calendar day. |
| **Functional** | Refresh with dashboard snapshot cron or on page load from analytics API. |

---

### 6.2 Session Snapshot

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_AGG` |
| **Purpose** | Prove candidates are logging into the portal. |
| **Graph type** | Capsule. |
| **Data to show** | `logins7d`, `onlineNow`, `avgDurationMs` (or formatted) |
| **Simple logic** | `logins7d` = unique or total sessions started in last 7d (label which). `onlineNow` = sessions with heartbeat within last N minutes (e.g. 5). **Avg duration:** only closed sessions; cap at e.g. 4h or exclude idle>30m without heartbeat — never average open 47h sessions. |
| **Functional** | Prefer [`HQ_BEHAVIOR_API.md`](./HQ_BEHAVIOR_API.md) / session store. Until heartbeats flow, show “waiting for data” not fake zeros as health. |

---

### 6.3 New Candidate Snapshot

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | Acquisition velocity. |
| **Graph type** | Capsule. |
| **Data to show** | `newCandidates7d`, `newCandidates24h` |
| **Simple logic** | Candidates with `createdAt` in window. |
| **Functional** | Same timezone as other “today” metrics. |

---

### 6.4 Phase 1 Live Tracking tiles

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` (usage) / `EMP_AGG` (online/tracked) |
| **Purpose** | Product usage: attention → intent → apply. |
| **Graph type** | Status tile row. |
| **Data to show** | `onlineNow`, `trackedUsers`, `visits7d`, `jobClicks7d`, `applies7d`, `activeTime7d` |
| **Simple logic** | Sum behaviour events in 7d. `activeTime7d` = sum of capped session active ms. |
| **Functional** | Requires behaviour heartbeats on `/api/hq-behavior`. Until live, tiles may show 0 — pair with “Last heartbeat” timestamp. |

---

### 6.5 Page Mix (7d)

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | Where candidates spend attention (jobs, profile, applications, LMS, etc.). |
| **Graph type** | **Doughnut / pie** + legend **or** ranked bars. |
| **Data to show** | `pages[{ pathOrCategory, visits, pct }]` → `liveTracking.pageVisitsByCategory` |
| **Simple logic** | Group page views by category (map routes → `dashboard` / `jobs` / `profile` / `applications` / `premium` / `community` / …). `pct = visits / totalVisits`. |
| **Functional** | Empty state: “No page visits yet” until tracker ships. |

---

### 6.5a Premium services usage (`EMP_ADD`)

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_ADD` / `EMP_KEEP` |
| **Purpose** | Which paid / prep surfaces candidates use most (Services page, AI CV, interview prep, courses). |
| **Graph type** | Ranked horizontal bars (most → least). |
| **Data to show** | `liveTracking.premiumServicesUsage[]`, `premiumVisits7d` |
| **Simple logic** | Sum `rollup7d.pageVisitsByCategory` for `{ premium, courses, interview_prep, ai_cv, lms, events }`. Label via category map (`/services` + `/subscriptions` → premium). |
| **Functional** | Sourced from Phase 1 behaviour engine via `/api/hq-behavior` → Phase 2 `liveTracking`. |

---

### 6.5b Entry points / first open (`EMP_ADD`)

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_ADD` |
| **Purpose** | Capture intent before/at first session — e.g. user opens Services wanting a feature, then logs in. |
| **Graph type** | Ranked bars. |
| **Data to show** | `liveTracking.entryPoints[]` from `rollup7d.firstOpenBreakdown` |
| **Simple logic** | Per day, first meaningful path (not login/marketing) → category. Aggregate counts across tracked users. Premium-high entry = strong sales intent. |
| **Functional** | Behaviour tracker `firstOpenCategory` / `firstOpens[]`. |

---

### 6.5c Community behaviour — Office Gossip / chat / reference check (`EMP_ADD`)

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_ADD` |
| **Purpose** | Behavioural engagement beyond job apply (circles, chat, ref checks). |
| **Graph type** | Ranked bars. |
| **Data to show** | `liveTracking.communityBehavior[]`, `communityVisits7d` |
| **Simple logic** | Category `community` covers `/community` + `/reference-check`. Plus HQ triggers matching gossip/chat/reference keywords. |
| **Functional** | Same behaviour pipe; interest affinity also tags `watercooler` / workplace chat. |

---

### 6.5d Top interests & trending topics (`EMP_ADD`)

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_ADD` |
| **Purpose** | What candidates care about (interview prep, job search, frontend, workplace chat, …) and rising role/company intent. |
| **Graph type** | Ranked bars; optional kind chip (interest / role / company). |
| **Data to show** | `liveTracking.topInterests[{ name, value:userCount, avgScore, scoreSum }]`, `trendingTopics[]` |
| **Simple logic** | Aggregate `interests[]` from each behaviour latest payload (affinity engine). Blend with `rollup7d.topRoles` / `topCompanies` for trending. |
| **Functional** | Requires interest heartbeats posted with `/api/hq-behavior`. |

---

### 6.5e Popular features (`EMP_KEEP`)

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | Cross-product most-used features (triggers + page mix). |
| **Graph type** | Ranked bars + most/least highlight cards. |
| **Data to show** | `liveTracking.popularFeatures[]` (trigger titles) falling back to page mix / portal KPIs. |
| **Simple logic** | Count distinct trigger titles across users; else page categories; else KPI volumes. |

---

### 6.6 Live Feed

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_AGG` |
| **Purpose** | Optional sample of live events for confidence the pipe works. |
| **Graph type** | Chronological list. |
| **Data to show** | `events[{ at, type, summary }]` — avoid full PII on HQ main view |
| **Simple logic** | Last N events from behaviour stream. |
| **Functional** | Cap at 20; types only on main dash (`apply`, `job_click`, `login`). Full detail → ops. |

---

### 6.7 Total Candidates (KPI)

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | Size of the talent / seeker base. |
| **Graph type** | KPI number + **sparkline** + % vs prior period. |
| **Data to show** | `total`, `changePct`, `sparklineSeries[]` |
| **Simple logic** | Current count vs count at start of prior equal window (e.g. previous 7d end). Sparkline = daily new or daily total for 14–30 points. |
| **Functional** | Avoid celebrating import spikes without activation context (see §7). |

---

### 6.8 New Candidates (KPI)

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | Inflow this period. |
| **Graph type** | KPI + sparkline + % vs prior. |
| **Data to show** | `newInPeriod`, `changePct`, `sparklineSeries[]` |
| **Simple logic** | Count `createdAt` in selected period (default 7d or 30d — match UI). |
| **Functional** | Period control shared with other KPIs if possible. |

---

### 6.9 Open Jobs (KPI)

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_AGG` |
| **Purpose** | Marketplace supply facing candidates. |
| **Graph type** | KPI + LIVE badge + sparkline optional. |
| **Data to show** | `openJobs` |
| **Simple logic** | Jobs with status `OPEN` (platform-wide or Phase 1–visible). |
| **Functional** | Complements candidate demand; pair with Job Status Mix. |

---

### 6.10 Applications / Active Applications

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | Core engagement outcome on the employee portal. |
| **Graph type** | Two KPI cards + sparklines. |
| **Data to show** | `applicationsTotalOrPeriod`, `activeApplications`, `changePct` |
| **Simple logic** | **Active** = status in `{submitted, under_review, interviewing}` (lock enum in product). Exclude withdrawn/rejected/hired from “active”. |
| **Functional** | Label card “Active = in-pipeline statuses”. |

---

### 6.11 Interview Requests (KPI)

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_AGG` |
| **Purpose** | Downstream demand for candidates (platform total). |
| **Graph type** | KPI + sparkline. |
| **Data to show** | `interviewRequests`, `changePct` |
| **Simple logic** | Count interview request records created in period (or all-time — label). |
| **Functional** | Not a recruiter “today” queue on this board. |

---

### 6.12 Avg Match Score

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_AGG` |
| **Purpose** | Quality of job–candidate matching when AI scores exist. |
| **Graph type** | KPI + sparkline. |
| **Data to show** | `avgMatchPct`, `coveragePct`, `sampleSize` |
| **Simple logic** | Average `matchScore` where not null. `coveragePct = scoredApplications / applications`. If `coveragePct < 20%` (configurable), display `—` + “low coverage”. |
| **Functional** | Do not invent zeros. |

---

### 6.13 Profile Completeness (KPI)

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | How ready the candidate base is to apply successfully. |
| **Graph type** | KPI + sparkline. |
| **Data to show** | `avgCompletenessPct` |
| **Simple logic** | Mean of each candidate’s `profileCompleteness` (0–100). Optionally weight only candidates active in 90d. |
| **Functional** | Align with Candidate Journey “Profile Complete” stage threshold (e.g. ≥80% = complete). |

---

### 6.14 Candidates Joined Over Time

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | Outcome trend — candidates who reached joined/hired. |
| **Graph type** | **Area / line chart**. Controls: Daily / Monthly. |
| **Data to show** | `series[{ bucket, count }]` |
| **Simple logic** | Bucket by `joinedAt` (or hire date). Daily = calendar day; Monthly = calendar month. |
| **Functional** | Empty months = 0. Y-axis auto-scale. |

---

### 6.15 Hiring Funnel

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | End-to-end recruitment throughput visible to candidates’ side of the marketplace. |
| **Graph type** | **Horizontal funnel** (stepped bars). |
| **Data to show** | Stages: Jobs Published, Applications, AI Shortlisted, Interview Requests, Selected, Joined — each with `count` and `pctOfPrevious` |
| **Simple logic** | Counts from respective tables. `pctOfPrevious = stage_n / stage_{n-1} * 100` (guard ÷0). Optionally also `% of Jobs` for early stages. |
| **Functional** | Window: all-time vs 30d — **must be labeled**. Prefer 30d for management. |

**Stage definitions (lock in product)**

| Stage | Definition |
|-------|------------|
| Jobs Published | Jobs with status open or published in window |
| Applications | Applications created in window |
| AI Shortlisted | Applications with AI shortlist flag / status |
| Interview Requests | Interview invitations created |
| Selected | Offer / selected status |
| Joined | Joined / hired status |

---

### 6.16 Applications Over Time

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | Demand / apply activity trend. |
| **Graph type** | **Area / line**. Controls: Daily / Weekly / Monthly. |
| **Data to show** | `series[{ bucket, count }]` |
| **Simple logic** | Bucket applications by `createdAt`. |
| **Functional** | Same date util as Joined chart. |

---

### 6.17 Candidates by Source

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | Where candidates come from (channel mix). |
| **Graph type** | **Doughnut**. |
| **Data to show** | `sources[{ name, count, pct }]` |
| **Simple logic** | Group by `candidate.source` (default `Job Portal` if missing). |
| **Functional** | Pair with Source Quality (§7.2). |

---

### 6.18 Top Skills

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | Talent supply shape — what skills the base has. |
| **Graph type** | **Horizontal bar** (top 8–12). |
| **Data to show** | `skills[{ name, count }]` |
| **Simple logic** | Aggregate skill tags from profiles; sort desc; take top N. |
| **Functional** | Normalize aliases (e.g. “JS” / “JavaScript”) if possible. |

---

### 6.19 Experience Distribution

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | Seniority mix of the candidate base. |
| **Graph type** | **Vertical bar**. |
| **Data to show** | Buckets `0-2`, `2-5`, `5-10`, `10+` with counts |
| **Simple logic** | Map `yearsExperience` into buckets; unknown → exclude or “Unknown” bar. |
| **Functional** | Fixed bucket order on X-axis (don’t sort by count only). |

---

### 6.20 Top Candidate Locations

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | Geo supply for marketplace / CEMAC & India ops. |
| **Graph type** | Simple map + ranked list. |
| **Data to show** | `locations[{ label, count }]` |
| **Simple logic** | Group by city/region; top 10 + Unknown. |
| **Functional** | Drive profile location completion to reduce Unknown. |

---

### 6.21 AI Analytics Overview

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | Product quality signals from scoring engines. |
| **Graph type** | 4× mini KPI + sparkline. |
| **Data to show** | `avgAtsScore`, `avgMatchPct`, `avgResumeScore`, `avgProfileCompleteness`, each with `sampleSize` |
| **Simple logic** | Mean of non-null scores in window (30d active candidates recommended). |
| **Functional** | Hide or dash series when `sampleSize < minN`. |

---

### 6.22 Interview Status

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_AGG` |
| **Purpose** | Mix of interview states platform-wide. |
| **Graph type** | **Doughnut**. |
| **Data to show** | `statuses[{ status, count, pct }]` e.g. Scheduled / Completed / Cancelled / No-show |
| **Simple logic** | Group interview records by status. |
| **Functional** | 100% Scheduled with n=1 is fine — show `n` in subtitle. |

---

### 6.23 Top Performing Jobs

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_AGG` |
| **Purpose** | Which postings attract applications (and later joins). |
| **Graph type** | **Table**. |
| **Data to show** | Columns: Job Title, Applications, Avg Match %, Selected, Joined |
| **Simple logic** | Rank by applications desc (top 5–10). Aggregates per `jobId`. |
| **Functional** | Portal-wide; not one employer’s ATS. |

---

### 6.24 Candidate Journey

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | **Primary activation funnel** for the employee portal — where seekers drop off. |
| **Graph type** | **Horizontal process flow** with counts and %. |
| **Data to show** | Registration, Resume Upload, Profile Complete, Application, Interview — `count` + `pctOfRegistration` (or of previous) |
| **Simple logic** | See table below. |
| **Functional** | This is the management “are candidates getting value?” chart. |

| Stage | Definition |
|-------|------------|
| Registration | All candidates (or signups in window) |
| Resume Upload | Has ≥1 resume/CV on file |
| Profile Complete | `profileCompleteness >= threshold` (e.g. 80) |
| Application | Has ≥1 application |
| Interview | Has ≥1 interview request / stage |

```
pct = stageCount / registrationCount * 100
dropOff = previousCount - stageCount
```

---

### 6.25 Recently Posted Jobs

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_AGG` |
| **Purpose** | Freshness of inventory for seekers. |
| **Graph type** | Counters (Today / Week / Month) + optional list. |
| **Data to show** | `postedToday`, `posted7d`, `posted30d`, `recentJobs[{ title, location, postedAt }]` |
| **Simple logic** | Count jobs by `publishedAt` windows; list last 5–8. |
| **Functional** | On HQ Employees board, emphasize counters; collapse long lists. |

---

### 6.26 Job Status Mix

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_AGG` |
| **Purpose** | Open vs closed/draft supply health. |
| **Graph type** | **Horizontal progress / stacked bar**. |
| **Data to show** | `statuses[{ status, count, pct }]` |
| **Simple logic** | Group jobs by status. |
| **Functional** | Subtitle total jobs. |

---

### 6.27 Application Rate

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | How many candidates convert to at least one apply (or apps/candidates ratio — lock one). |
| **Graph type** | KPI + sparkline. |
| **Data to show** | `applicationRatePct`, `formulaLabel` |
| **Simple logic (recommended)** | `candidatesWith≥1App / totalCandidates * 100` **or** period: `appsInPeriod / newCandidatesInPeriod` — pick one and label. Current UI style (~42.9%) ≈ `applications / candidates` — document if that’s intentional. |
| **Functional** | Prefer “% candidates who applied” for management clarity. |

---

### 6.28 Offer Rate

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | Downstream success of applications. |
| **Graph type** | KPI + sparkline. |
| **Data to show** | `offerRatePct` |
| **Simple logic** | `selectedOrOffered / applications * 100` in window (e.g. 7d or 30d). |
| **Functional** | Pair with Join Rate (`EMP_ADD`). |

---

### 6.29 Session Overview (expanded)

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | Engagement depth over time. |
| **Graph type** | KPI tiles + **line chart** (sessions per day). |
| **Data to show** | `loginsToday`, `logins7d`, `onlineNow`, `avgDuration`, `series[{ date, sessions }]` |
| **Simple logic** | Daily bucket of session starts. Duration rules as §6.2. |
| **Functional** | Candidate users only (exclude HQ staff if flagged). |

---

### 6.30 Logins by Country / Region / City

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_KEEP` |
| **Purpose** | Geo engagement of the employee portal. |
| **Graph type** | Country **doughnut**; region/city **ranked lists**. |
| **Data to show** | `byCountry[]`, `byRegion[]`, `byCity[]` |
| **Simple logic** | From session geo IP or profile location — **label source**. Prefer session geo for “logins”, profile for “candidates”. |
| **Functional** | Don’t mix login-geo and profile-geo without labeling. |

---

### 6.31 Recent Sessions (named)

| Field | Detail |
|-------|--------|
| **Tag** | `USER_MOVE` |
| **Purpose** | Support / fraud / debug — not management storytelling. |
| **Graph type** | Table (User, Login, Logout, Duration, Device, Location). |
| **Data to show** | Per-session rows with names |
| **Simple logic** | Last N sessions ordered by login desc. |
| **Functional** | Place behind permissioned “Ops” view; redact on default HQ Employees dash. |

---

## 7. New metrics to add (`EMP_ADD`) — full detail

---

### 7.1 Visit → Job click → Apply conversion

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_ADD` |
| **Purpose** | Turns live tracking tiles into a **management funnel**: traffic → intent → action. |
| **Primary number** | Click rate = clicks/visits; Apply rate = applies/clicks (or applies/visits) |
| **Graph type** | Mini **funnel** or 3 KPI chips with %. |
| **Data to show** | `visits7d`, `jobClicks7d`, `applies7d`, `clickThroughPct`, `applyFromClickPct`, `applyFromVisitPct` |
| **Simple logic** | `clickThroughPct = jobClicks7d / visits7d * 100`; `applyFromClickPct = applies7d / jobClicks7d * 100`. Guard ÷0. |
| **Functional** | Same 7d window as live tracking; extend to 30d toggle later. |

---

### 7.2 Source quality (not just mix)

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_ADD` |
| **Purpose** | Doughnut shows 100% one source — management needs which source produces **applies / joins**. |
| **Primary number** | Joins per source; apply rate per source |
| **Graph type** | **Grouped horizontal bar** or table: Source \| Candidates \| Apps \| Apply% \| Joins. |
| **Data to show** | `rows[{ source, candidates, applications, applyRatePct, joins }]` |
| **Simple logic** | Group candidates by source; count apps/joins for those users. |
| **Functional** | Sits under Candidates by Source. |

---

### 7.3 Returning vs new candidates

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_ADD` |
| **Purpose** | Retention of seekers — not only signups. |
| **Primary number** | % of 7d logins that are returning users |
| **Graph type** | KPI + **stacked bar** over time (new vs returning sessions). |
| **Data to show** | `newUsers7d`, `returningUsers7d`, `returningPct` |
| **Simple logic** | Returning = logged in during window **and** had a prior session before window start. |
| **Functional** | Uses session history. |

---

### 7.4 Candidate activation rate

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_ADD` |
| **Purpose** | % of new signups who reach a meaningful milestone quickly. |
| **Primary number** | Activation % within 7d / 14d |
| **Secondary** | Median days to resume upload; to profile complete |
| **Graph type** | KPI + small **funnel** (Signed up → Resume → Profile complete). |
| **Data to show** | `newInCohort`, `activatedCount`, `activationRatePct`, `definition` |
| **Simple logic (recommended)** | Activated if within 14d of signup: resume uploaded **OR** profileCompleteness ≥ 80. Prefer stricter: **resume + profile complete**. |
| **Functional** | Cohort = signups in last 30d. |

```
activated = resumeUploadedAt within createdAt+14d
         OR profileCompleteness >= 80 within createdAt+14d
activationRate = activated / cohortSize
```

---

### 7.5 Journey drop-off (explicit)

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_ADD` |
| **Purpose** | Make losses obvious between Registration → Interview. |
| **Primary number** | Largest drop stage name + % lost |
| **Graph type** | Annotation on Candidate Journey **or** waterfall. |
| **Data to show** | `drops[{ from, to, lostCount, lostPct }]` |
| **Simple logic** | `lostPct = (count_i - count_{i+1}) / count_i * 100`. |
| **Functional** | Alert if drop Registration→Resume > 50%. |

---

### 7.6 Time-to-first-apply

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_ADD` |
| **Purpose** | How fast new candidates take the core action. |
| **Primary number** | Median days signup → first application |
| **Secondary** | P90; % with zero applies after 14d |
| **Graph type** | KPI + optional histogram. |
| **Data to show** | `medianDays`, `p90Days`, `neverAppliedPct14d`, `sampleSize` |
| **Simple logic** | `days = date(firstApp.createdAt) - date(candidate.createdAt)` for those who applied; median of sample in last 90d. |
| **Functional** | Nightly rollup. |

---

### 7.7 Stage conversion rates (explicit)

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_ADD` |
| **Purpose** | Hiring Funnel shows counts; management needs labeled rates. |
| **Primary number** | Apply→Interview %, Interview→Offer %, Offer→Join % |
| **Graph type** | KPI grid (3–4 rates) + sparklines. |
| **Data to show** | `applyToInterviewPct`, `interviewToOfferPct`, `offerToJoinPct`, `joinRatePct` |
| **Simple logic** | Ratios of stage counts in same window. |
| **Functional** | Complements Offer Rate card. |

---

### 7.8 Candidate DAU / WAU / stickiness

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_ADD` |
| **Purpose** | People activity on the employee portal (parallel to recruiter WAU on HQ dash). |
| **Primary number** | WAU (unique candidates with session in 7d) |
| **Secondary** | DAU; DAU/WAU stickiness |
| **Graph type** | KPI + **line** (30–90d). |
| **Data to show** | `dau`, `wau`, `mau`, `stickinessDauWau` |
| **Simple logic** | Unique candidate `userId` with ≥1 session in window. |
| **Functional** | From behaviour/session store; exclude internal staff. |

---

### 7.9 Match coverage

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_ADD` |
| **Purpose** | Explains empty Avg Match % — scoring adoption. |
| **Primary number** | % of applications with a non-null match score |
| **Graph type** | KPI chip under Avg Match Score. |
| **Data to show** | `coveragePct`, `scoredCount`, `unscoredCount` |
| **Simple logic** | `scored / totalAppsInWindow * 100`. |
| **Functional** | Gate the Match KPI display. |

---

### 7.10 Marketplace balance alert

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_ADD` |
| **Purpose** | Too many open jobs + few applies (or reverse) = unhealthy marketplace. |
| **Primary number** | Apps per open job (7d); candidates per open job |
| **Graph type** | Alert banner + 2 KPIs. |
| **Data to show** | `appsPerOpenJob7d`, `candidatesPerOpenJob`, `status` (`balanced` \| `oversupply_jobs` \| `undersupply_jobs`) |
| **Simple logic** | Thresholds configurable (e.g. apps/job 7d &lt; 0.2 → oversupply jobs). |
| **Functional** | Complements Open Jobs + Applications cards. |

---

### 7.11 Incomplete / low-quality profile rate

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_ADD` |
| **Purpose** | Quality of the base — spam or empty profiles inflate “Total Candidates”. |
| **Primary number** | % profiles with completeness &lt; 40% (or no resume) |
| **Graph type** | KPI + optional stacked bar (complete / partial / empty). |
| **Data to show** | `lowQualityPct`, `noResumePct`, `completePct` |
| **Simple logic** | Bucket by completeness thresholds. |
| **Functional** | Pairs with Profile Completeness average. |

---

### 7.12 Join rate

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_ADD` |
| **Purpose** | Final outcome next to Offer Rate. |
| **Primary number** | Joined / applications (or joined / selected) |
| **Graph type** | KPI + sparkline. |
| **Data to show** | `joinRatePct`, `joinedCount`, `window` |
| **Simple logic** | `joined / applications * 100` in 30d (label). |
| **Functional** | Same window family as Offer Rate. |

---

### 7.13 Notification / alert engagement (optional)

| Field | Detail |
|-------|--------|
| **Tag** | `EMP_ADD` |
| **Purpose** | If behaviour alerts / job alerts exist — are candidates acting on them? |
| **Primary number** | Open rate / click rate of alerts 7d |
| **Graph type** | KPI or small bar. |
| **Data to show** | `alertsSent`, `alertsOpened`, `alertsClicked`, `openPct`, `clickPct` |
| **Simple logic** | Event counts from notification + behaviour pipeline. |
| **Functional** | Wire when alert product is live; else skip P0. |

---

## 8. Graph type cheat sheet (Employees)

| Metric | Recommended graph |
|--------|-------------------|
| Snapshot / KPI | Capsule or number + sparkline |
| Joined / Applications over time | Area / line (+ Daily/Weekly/Monthly) |
| Hiring Funnel | Horizontal funnel |
| Candidate Journey | Horizontal stage flow + % |
| Source mix | Doughnut |
| Source quality | Table or grouped bar |
| Top skills | Horizontal bar |
| Experience | Vertical bar (fixed buckets) |
| Locations | Map + ranked list |
| Interview / job status mix | Doughnut or progress bar |
| Top jobs | Table |
| Sessions over time | Line |
| Logins by country | Doughnut |
| Visit→Click→Apply | Mini funnel / 3 chips |
| DAU/WAU | Line + KPI |
| Marketplace balance | Alert + KPIs |

Avoid: named session tables on the main management canvas; gauges for every rate.

---

## 9. Suggested snapshot shape (functional)

Illustrative rollup for the Employees HQ UI.

```ts
type EmployeesDashboardSnapshot = {
  capturedAt: string;
  timezone: string;

  snapshots: {
    totalCandidates: number;
    totalApplications: number;
    appliedToday: number;
    newCandidates7d: number;
    newCandidates24h: number;
    logins7d: number;
    onlineNow: number;
    avgDurationMs: number | null; // null if unreliable
  };

  kpis: {
    totalCandidates: number;
    totalCandidatesChangePct: number | null;
    newCandidates: number;
    newCandidatesChangePct: number | null;
    openJobs: number;
    applications: number;
    applicationsChangePct: number | null;
    activeApplications: number;
    interviewRequests: number;
    interviewRequestsChangePct: number | null;
    avgMatchPct: number | null;
    matchCoveragePct: number | null;
    avgProfileCompletenessPct: number | null;
    applicationRatePct: number | null;
    offerRatePct: number | null;
    joinRatePct: number | null;
  };

  liveTracking: {
    visits7d: number;
    jobClicks7d: number;
    applies7d: number;
    activeTime7dMs: number | null;
    clickThroughPct: number | null;
    applyFromClickPct: number | null;
    pageMix: { category: string; visits: number; pct: number }[];
  };

  funnel: {
    window: '30d' | 'all';
    stages: { key: string; label: string; count: number; pctOfPrevious: number | null }[];
  };

  journey: {
    stages: { key: string; label: string; count: number; pctOfRegistration: number }[];
    largestDrop: { from: string; to: string; lostPct: number } | null;
  };

  series: {
    joined: { bucket: string; count: number }[];
    applications: { bucket: string; count: number }[];
    sessions: { date: string; count: number }[];
    joinedGranularity: 'daily' | 'monthly';
    applicationsGranularity: 'daily' | 'weekly' | 'monthly';
  };

  supply: {
    jobStatusMix: { status: string; count: number; pct: number }[];
    postedToday: number;
    posted7d: number;
    posted30d: number;
    topJobs: {
      jobId: string;
      title: string;
      applications: number;
      avgMatchPct: number | null;
      selected: number;
      joined: number;
    }[];
    appsPerOpenJob7d: number | null;
  };

  talent: {
    bySource: { name: string; count: number; pct: number }[];
    sourceQuality: {
      source: string;
      candidates: number;
      applications: number;
      applyRatePct: number;
      joins: number;
    }[];
    topSkills: { name: string; count: number }[];
    experience: { bucket: string; count: number }[];
    locations: { label: string; count: number }[];
  };

  ai: {
    avgAtsScore: number | null;
    avgMatchPct: number | null;
    avgResumeScore: number | null;
    avgProfileCompleteness: number | null;
    sampleSize: number;
  };

  engagement: {
    dau: number;
    wau: number;
    returningPct7d: number | null;
    activationRate14d: number | null;
    medianDaysToFirstApply: number | null;
    byCountry: { name: string; count: number; pct: number }[];
    byRegion: { name: string; count: number }[];
    byCity: { name: string; count: number }[];
  };

  interviewStatus: { status: string; count: number; pct: number }[];

  activation: {
    lowQualityProfilePct: number | null;
    noResumePct: number | null;
  };
};
```

---

## 10. Implementation priority

| Priority | Items | Why |
|----------|-------|-----|
| **P0** | Keep `EMP_KEEP`; demote named Recent Sessions; label funnel/journey %; fix duration + match empty states | Trustworthy management view |
| **P1** | Visit→Click→Apply; Journey drop-off; Activation rate; Application/Offer/Join rates clarified; Match coverage | Highest candidate-product value |
| **P2** | Returning vs new; Time-to-first-apply; Candidate DAU/WAU; Source quality; Marketplace balance | Retention & marketplace |
| **P3** | Incomplete profile rate; Notification engagement; richer AI coverage | Quality / maturity |

---

## 11. Keep / Move / Add — checklist

### Keep on Employees (HQ view)

- [ ] Candidate / New Candidate / Session snapshots (aggregates)
- [ ] KPI row: Total / New / Apps / Active Apps / Profile Completeness
- [ ] Open Jobs + Job Status Mix (supply)
- [ ] Hiring Funnel + Candidate Journey
- [ ] Joined Over Time + Applications Over Time
- [ ] Source / Skills / Experience / Locations
- [ ] AI averages (with sample size)
- [ ] Application Rate / Offer Rate
- [ ] Session trend + geo aggregates
- [ ] Page Mix + usage tiles (when heartbeats live)
- [ ] Top Performing Jobs (top-N)
- [ ] Interview Status (platform mix)

### Move / demote

- [ ] Named Recent Sessions table → ops drawer
- [ ] Online/Tracked as hero → live ops strip
- [ ] Untrusted Avg Duration / empty Match as “success” KPIs
- [ ] Long recently-posted title lists as primary content

### Add for management

- [ ] Visit → Job click → Apply conversion
- [ ] Source quality table
- [ ] Returning vs new candidates
- [ ] Candidate activation rate (14d)
- [ ] Journey drop-off callout
- [ ] Time-to-first-apply
- [ ] Apply→Interview / Interview→Offer / Offer→Join rates
- [ ] Candidate DAU / WAU
- [ ] Match coverage
- [ ] Marketplace balance (apps per open job)
- [ ] Low-quality / no-resume rate
- [ ] Join rate KPI
- [ ] Notification engagement (when available)

---

## 12. Out of scope (next docs)

| Next | Content |
|------|---------|
| **Employer dashboard** | Company admin: seats, team funnel, their jobs, billing for *their* tenant |
| **Recruiter home** | My interviews, follow-ups, tasks |
| **HQ platform dash** | Already: [`HQ_DASHBOARD_STATS_SPEC.md`](./HQ_DASHBOARD_STATS_SPEC.md) |

---

## 13. Quick reference — tag summary

| Tag | Action |
|-----|--------|
| `EMP_KEEP` | Stay on Employees management board |
| `EMP_AGG` | Summary only; detail elsewhere |
| `USER_MOVE` | Ops / PII — off main canvas |
| `EMP_ADD` | Build for management value |

---

*Doc version: 1.0 — Employees / Phase 1 portal (candidate) dashboard stats. Ready for setup / implementation planning.*
