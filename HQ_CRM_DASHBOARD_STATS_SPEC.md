# HQ CRM Dashboard Stats Spec

Setup-ready spec for the **HQ CRM dashboard** (leads & clients from the headquarters database): what to show for sales/management, what to demote, what to add, graph types, data fields, and simple functional logic.

**Audience:** HQ sales leadership / management — pipeline health, conversion, $ value, velocity, client growth.  
**Not for:** Platform tenant MRR/usage ([`HQ_DASHBOARD_STATS_SPEC.md`](./HQ_DASHBOARD_STATS_SPEC.md)), candidate portal ([`EMPLOYEES_DASHBOARD_STATS_SPEC.md`](./EMPLOYEES_DASHBOARD_STATS_SPEC.md)), or a single AE’s personal task queue.

Related docs:

- [`HQ_DASHBOARD_STATS_SPEC.md`](./HQ_DASHBOARD_STATS_SPEC.md) — HQ platform (tenants, MRR, product usage)
- [`EMPLOYEES_DASHBOARD_STATS_SPEC.md`](./EMPLOYEES_DASHBOARD_STATS_SPEC.md) — Phase 1 employee/candidate analytics
- Screenshots reference: HQ CRM overview — KPI row, Leads by Stage, Quick Links, Recent Leads / Clients

---

## 1. Design rules

| Rule | Meaning |
|------|---------|
| **HQ sales only** | Numbers come from HQ CRM leads/clients DB — not tenant ATS jobs or candidate portal. |
| **Pipeline + outcomes** | Management needs stage mix **and** win/loss, $, velocity — not only lead count. |
| **Team aggregates on dash** | Follow-ups / ownership = team totals on this board; “my queue” lives on AE home. |
| **$ and % labeled** | Pipeline Value broken by stage where possible; every funnel stage shows count + conversion %. |
| **Aging is first-class** | Stale / overdue leads matter as much as new volume. |
| **Trends matter** | 7d / 30d / MoM next to totals. |

### Viewpoint split

| Lens | Question |
|------|----------|
| **HQ / Management (this board)** | Is the sales pipeline healthy? Are leads converting to clients? What’s the $ and velocity? |
| **Sales ops / AE day view** | My follow-ups today, my named lead list, personal tasks |

### How this relates to the other dashboards

| Dash | Job |
|------|-----|
| HQ Platform | Tenants, MRR, product usage |
| Employees | Candidate portal funnel / engagement |
| **HQ CRM (this)** | HQ sales leads → clients → pipeline $ |

---

## 2. Category legend

| Tag | Meaning | Action on HQ CRM dash |
|-----|---------|------------------------|
| `CRM_KEEP` | Core sales/CRM KPI for management | Keep / polish |
| `CRM_AGG` | Aggregate OK; full detail on Leads/Clients pages | Keep summary only |
| `USER_MOVE` | Personal AE queue / day-ops | Remove or demote |
| `CRM_ADD` | Missing but high value for management | Add (this spec) |

---

## 3. Current widgets — categorize

### 3.1 Header

| Widget | Tag | Graph / viz | Verdict |
|--------|-----|-------------|---------|
| Title + subtitle (HQ CRM overview) | `CRM_KEEP` | Meta | Keep |
| Last updated timestamp | `CRM_KEEP` | Meta | Keep |
| Refresh button | `CRM_KEEP` | Action | Keep |

### 3.2 KPI row

| Widget | Tag | Graph / viz | Verdict |
|--------|-----|-------------|---------|
| HQ Leads | `CRM_KEEP` | KPI number | Keep; add 7d/30d delta + sparkline |
| Hot Leads | `CRM_KEEP` | KPI number | Keep; define “hot” rules |
| Follow-ups Today | `CRM_AGG` | KPI number | Keep as **team** total; not personal-only |
| Pipeline Value | `CRM_KEEP` | KPI number ($) | Keep; add currency + by-stage |
| Clients (active) | `CRM_KEEP` | KPI + subtitle | Keep; add new/churn trend when data exists |
| Team (active) | `CRM_AGG` | KPI + subtitle | Keep as coverage; add load metrics (`CRM_ADD`) |

### 3.3 Mid row

| Widget | Tag | Graph type | Verdict |
|--------|-----|------------|---------|
| Leads by Stage | `CRM_KEEP` | Vertical stage list (upgrade to **funnel / horizontal bar**) | Keep; add % and $ per stage |
| Quick Links (Leads / Clients) | `CRM_KEEP` | Nav cards | Keep |

### 3.4 Bottom row

| Widget | Tag | Graph type | Verdict |
|--------|-----|------------|---------|
| Recent HQ Leads | `CRM_AGG` | **Table** (Name, Company, Stage) | Keep top-N; full inbox on Leads page |
| Recent HQ Clients | `CRM_AGG` | **Table** (Company, Contact, Status) | Keep; empty state OK until clients exist |

---

## 4. What to remove or demote

| Item | Move to | Why |
|------|---------|-----|
| Follow-ups Today if scoped only to “me” | AE personal home | Exec board needs team / overdue / SLA |
| Full lead inbox as dashboard body | Leads page | Dash = summary + alerts; list = working queue |
| Stage counts without conversion or $ | Enhance in place | Counts alone hide bottlenecks (e.g. 8 Qualified, 0 Converted) |
| Static Clients = 0 / Team = 0 with no trend | Add rates & history | Empty cards need growth story |

---

## 5. Target layout (HQ CRM)

### Row A — Pipeline health

1. HQ Leads (+ delta)  
2. Hot Leads  
3. Pipeline Value (total + weighted)  
4. Clients active (+ new this month)  
5. Win rate (period)  

### Row B — Funnel

1. Leads by Stage (count + % + $)  
2. Stage conversion rates  
3. Lead velocity (new 7d/30d)  

### Row C — Velocity & risk

1. Follow-ups due (team) + **Overdue**  
2. Stale / aging leads  
3. Avg / median days in stage  
4. Unassigned leads / owner coverage  

### Row D — Coverage & lists

1. Team active + leads per AE  
2. Lead source mix + source→convert  
3. Recent leads / recent clients tables  
4. Lost reasons (period)  

---

## 6. Current stats — full detail (purpose / data / graph / logic)

---

### 6.1 Header — Last updated + Refresh

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_KEEP` |
| **Purpose** | Trust: management knows how fresh CRM numbers are. |
| **Graph type** | Timestamp text + button (no chart). |
| **Data to show** | `lastUpdatedAt`, refresh action |
| **Simple logic** | Set `lastUpdatedAt` when snapshot/API returns. Refresh re-fetches CRM rollup. |
| **Functional** | Disable button while loading; show error toast on failure. |

---

### 6.2 HQ Leads (KPI)

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_KEEP` |
| **Purpose** | Total open (or all) opportunities in HQ CRM — top-of-funnel volume. |
| **Graph type** | KPI number + optional **sparkline** + % vs prior period. |
| **Data to show** | `totalLeads`, `changePct7d` or `changePct30d`, `sparklineSeries[]` |
| **Simple logic** | Count leads where `status ≠ deleted`. Prefer **open pipeline** = stage not in `{Converted, Lost}` for a second subtitle, or label clearly if total includes all. |
| **Functional** | Click-through → Leads list filtered to all / open. |

**Example display**

```
HQ LEADS     9
Open         9
vs 7d        +2
```

---

### 6.3 Hot Leads (KPI)

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_KEEP` |
| **Purpose** | Priority slice — leads that need immediate attention / high close probability. |
| **Graph type** | KPI number (optional sparkline). |
| **Data to show** | `hotLeads`, `hotDefinition` |
| **Simple logic (lock one definition)** | Lead is **hot** if any of: `priority = hot` **OR** `score >= threshold` **OR** stage in `{Demo, Qualified}` with `value >= X` **OR** activity in last 48h + high value. Document the rule in UI tooltip. |
| **Functional** | Click → Leads filtered `hot=true`. |

---

### 6.4 Follow-ups Today (KPI)

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_AGG` |
| **Purpose** | Team workload due today — next actions in CRM. |
| **Graph type** | KPI number. |
| **Data to show** | `followUpsDueToday`, scope label (`team`) |
| **Simple logic** | Count follow-up/tasks with `dueDate = today` and `status = open`, across **all HQ CRM owners** (not only current user). |
| **Functional** | Pair with Overdue (`CRM_ADD`). If product only stores personal tasks, roll up by team for this card. |

---

### 6.5 Pipeline Value (KPI)

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_KEEP` |
| **Purpose** | Total projected $ of active leads — primary commercial signal. |
| **Graph type** | KPI ($) + optional sparkline; later **stacked bar** by stage. |
| **Data to show** | `pipelineValue`, `currency`, `openLeadsCount` |
| **Simple logic** | `sum(lead.estimatedValue)` for leads in open stages (exclude Lost; decide if Converted stays in pipeline or moves to Clients revenue). Default: **open stages only**. |
| **Functional** | Format with HQ currency (e.g. INR/USD). Show `—` if values missing; track `% leads with value`. |

---

### 6.6 Clients (KPI)

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_KEEP` |
| **Purpose** | Closed-won customer records in HQ CRM (post-convert). |
| **Graph type** | KPI + subtitle (`N active`). |
| **Data to show** | `clientsTotal`, `clientsActive` |
| **Simple logic** | Count client records; `active` = status `active` (not churned/paused). |
| **Functional** | Empty state: “No HQ clients yet” is fine; still reserve space for New this month (`CRM_ADD`). Click → Clients page. |

---

### 6.7 Team (KPI)

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_AGG` |
| **Purpose** | How many HQ CRM users / AEs can work the pipeline. |
| **Graph type** | KPI + subtitle (`N active`). |
| **Data to show** | `teamTotal`, `teamActive` |
| **Simple logic** | Users with HQ CRM role; `active` = logged in 7d or status active. |
| **Functional** | Complements owner coverage / leads per AE (`CRM_ADD`). |

---

### 6.8 Leads by Stage

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_KEEP` |
| **Purpose** | Sales funnel shape — where opportunities sit. |
| **Graph type** | Current: vertical list. **Target:** **horizontal bar / funnel** + count + % of open + optional $. |
| **Data to show** | `stages[{ key, label, count, pctOfOpen, valueSum }]` |
| **Simple logic** | Group leads by `stage`. Stages (current product): New, Demo, Contacted, Qualified, Converted, Lost. `pctOfOpen = count / openCount` for non-terminal; show Converted/Lost separately. |
| **Functional** | Row click → Leads filtered by stage. Footer link “Open leads →”. |

**Stage definitions (lock in product)**

| Stage | Meaning |
|-------|---------|
| New | Inbound / just created |
| Demo | Demo scheduled or done |
| Contacted | Outreach made |
| Qualified | Fit confirmed / sales-accepted |
| Converted | Won → should create/link Client |
| Lost | Closed-lost |

---

### 6.9 Quick Links — Leads / Clients

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_KEEP` |
| **Purpose** | Fast navigation into working lists from the overview. |
| **Graph type** | Nav cards (no chart). |
| **Data to show** | Optional badges: open lead count, active client count |
| **Simple logic** | Route to `/hq-crm/leads` and `/hq-crm/clients` (or existing paths). |
| **Functional** | Keep prominent; do not replace KPIs. |

---

### 6.10 Recent HQ Leads (table)

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_AGG` |
| **Purpose** | Latest opportunities at a glance for management sampling. |
| **Graph type** | **Table** — Name, Company, Stage (add Value, Owner, Updated as columns later). |
| **Data to show** | `recentLeads[{ id, name, company, stage, updatedAt }]` top 5–10 |
| **Simple logic** | Order by `updatedAt` or `createdAt` desc; limit N. |
| **Functional** | Row click → lead detail. Full list on Leads page. |

---

### 6.11 Recent HQ Clients (table)

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_AGG` |
| **Purpose** | Latest wins / client records. |
| **Graph type** | **Table** — Company, Contact, Status. |
| **Data to show** | `recentClients[{ id, company, contact, status }]` |
| **Simple logic** | Order by `createdAt` / `convertedAt` desc. Empty: “No HQ clients yet.” |
| **Functional** | When Converted fires, ensure client row is created so this fills. |

---

## 7. New metrics to add (`CRM_ADD`) — full detail

---

### 7.1 Stage conversion rates

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_ADD` |
| **Purpose** | Counts hide bottlenecks (e.g. 8 Qualified, 0 Converted). Rates show flow. |
| **Primary number** | Conversion % between consecutive stages (period) |
| **Graph type** | KPI chips under funnel **or** annotated funnel. |
| **Data to show** | `conversions[{ from, to, ratePct, fromCount, toCount }]`, window `30d`/`90d` |
| **Simple logic** | Cohort or flowing ratio: leads that entered stage A in window and reached stage B / entered A. v1 simpler: `count(B) / count(A)` on current snapshot — label “stock ratio” vs “true conversion”. Prefer true conversion when history exists. |
| **Functional** | Highlight lowest rate stage in red/amber. |

---

### 7.2 Win rate

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_ADD` |
| **Purpose** | Core sales effectiveness for management. |
| **Primary number** | Win rate % in period |
| **Graph type** | KPI + sparkline (monthly). |
| **Data to show** | `winRatePct`, `convertedCount`, `lostCount`, `window` |
| **Simple logic** | `converted / (converted + lost) * 100` for leads closed in window. Exclude still-open. |
| **Functional** | Default window 30d and 90d toggle. |

```
winRatePct = convertedInPeriod / (convertedInPeriod + lostInPeriod) * 100
```

---

### 7.3 Pipeline value by stage

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_ADD` |
| **Purpose** | Total Pipeline Value alone does not show where $ sits. |
| **Primary number** | $ per stage |
| **Graph type** | **Stacked horizontal bar** or table beside Leads by Stage. |
| **Data to show** | `valueByStage[{ stage, value, leadCount }]` |
| **Simple logic** | `sum(estimatedValue)` group by stage (open stages). |
| **Functional** | Same currency as Pipeline Value KPI. |

---

### 7.4 Lead velocity (new leads trend)

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_ADD` |
| **Purpose** | Is top-of-funnel growing or drying up? |
| **Primary number** | New leads 7d / 30d |
| **Graph type** | KPI + **area/line** (daily new leads 30–90d). |
| **Data to show** | `newLeads7d`, `newLeads30d`, `series[{ date, count }]`, `changePct` |
| **Simple logic** | Count leads with `createdAt` in window; daily buckets for series. |
| **Functional** | Alert if 14d new leads = 0 while pipeline open. |

---

### 7.5 Average / median days in stage

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_ADD` |
| **Purpose** | Detect stuck pipeline (Qualified aging with no Converted). |
| **Primary number** | Median days in current stage (per stage or overall open) |
| **Graph type** | **Horizontal bar** by stage (median days) or KPI table. |
| **Data to show** | `daysInStage[{ stage, medianDays, p90Days, count }]` |
| **Simple logic** | `now - stageEnteredAt` (or `updatedAt` if history missing — label weaker). Median per stage for open leads. |
| **Functional** | Needs `stageEnteredAt` on lead or stage-history table. |

---

### 7.6 Stale / aging leads

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_ADD` |
| **Purpose** | Risk: opportunities dying from neglect. |
| **Primary number** | Count of open leads with no activity in 7d / 14d |
| **Graph type** | Alert KPI + optional table of stale leads. |
| **Data to show** | `stale7d`, `stale14d`, `staleLeads[{ id, name, company, stage, lastActivityAt }]` |
| **Simple logic** | Open lead where `lastActivityAt < now - N days` (activity = note, call, stage change, email). |
| **Functional** | Banner on dash when `stale14d > 0`. Click → filtered stale list. |

---

### 7.7 Overdue follow-ups

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_ADD` |
| **Purpose** | Stronger than “Follow-ups today = 0” — shows broken SLA. |
| **Primary number** | Overdue open follow-ups (team) |
| **Graph type** | KPI (red if > 0) next to Follow-ups Today. |
| **Data to show** | `followUpsOverdue`, `followUpsDueToday` |
| **Simple logic** | `dueDate < today` AND `status = open`. |
| **Functional** | Team scope on CRM dash. |

---

### 7.8 Lead source mix + source → convert

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_ADD` |
| **Purpose** | Where HQ leads come from and which channels win (demo, landing, inbound, referral). |
| **Primary number** | Mix %; convert rate by source |
| **Graph type** | **Doughnut** (mix) + **table** (Source \| Leads \| Converted \| Win%). |
| **Data to show** | `bySource[{ source, count, pct }]`, `quality[{ source, leads, converted, winPct, pipelineValue }]` |
| **Simple logic** | Group by `lead.source`; win% = converted / (converted+lost) or converted/leads — label which. |
| **Functional** | Align source enums with landing/demo analytics on HQ Platform dash where possible. |

---

### 7.9 Weighted / expected pipeline

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_ADD` |
| **Purpose** | Raw Pipeline Value treats Demo and Qualified the same; weighted $ is more honest for forecasts. |
| **Primary number** | Weighted pipeline $ |
| **Graph type** | KPI beside Pipeline Value. |
| **Data to show** | `weightedPipelineValue`, `weightsByStage` |
| **Simple logic** | `sum(estimatedValue * stageProbability)`. Example weights: New 10%, Contacted 20%, Demo 40%, Qualified 60%, Hot flag +10% cap 90%. |
| **Functional** | Document weights in tooltip; tune with sales. |

```
weightedValue = Σ (lead.value * probability[lead.stage])
```

---

### 7.10 Client growth (new / churned / trend)

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_ADD` |
| **Purpose** | Clients card is empty or static — management needs growth story. |
| **Primary number** | New clients this month; active trend |
| **Graph type** | KPI chips + **line** (monthly active clients). |
| **Data to show** | `newClients30d`, `churnedClients30d`, `clientsActive`, `series[{ month, active }]` |
| **Simple logic** | New = `convertedAt` or `client.createdAt` in window; churned = status → churned in window. |
| **Functional** | Link Converted stage → client create so metrics populate. |

---

### 7.11 Revenue from converted (CRM ↔ commercial)

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_ADD` |
| **Purpose** | Connect CRM wins to money (deal value / first invoice / linked tenant MRR). |
| **Primary number** | Won revenue in period |
| **Graph type** | KPI + optional monthly bar. |
| **Data to show** | `wonRevenuePeriod`, `avgDealSize`, `currency` |
| **Simple logic** | Sum `dealValue` on Converted leads in window; or sum first invoice; or linked tenant first MRR — **pick one** and label. |
| **Functional** | Optional bridge to HQ Platform MRR for same customer. |

---

### 7.12 Owner coverage / leads per AE

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_ADD` |
| **Purpose** | Load balancing and unassigned risk. |
| **Primary number** | Unassigned open leads; avg open leads per active AE |
| **Graph type** | KPI + **horizontal bar** (leads by owner). |
| **Data to show** | `unassignedCount`, `leadsPerOwner[{ ownerId, name, openLeads, hotLeads }]`, `avgLeadsPerAe` |
| **Simple logic** | Group open leads by `ownerId`; null owner = unassigned. |
| **Functional** | Alert if unassigned > 0. |

---

### 7.13 Lost reasons

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_ADD` |
| **Purpose** | Why deals die — product, price, competitor, no response. |
| **Primary number** | Top lost reason in period |
| **Graph type** | **Horizontal bar** or doughnut. |
| **Data to show** | `lostReasons[{ reason, count, pct }]` |
| **Simple logic** | Group Lost leads by `lostReason` in window. |
| **Functional** | Require reason on stage → Lost. |

---

### 7.14 Activity volume (optional)

| Field | Detail |
|-------|--------|
| **Tag** | `CRM_ADD` |
| **Purpose** | Is the team working the book? Calls/notes/emails 7d. |
| **Graph type** | KPI strip or small bar. |
| **Data to show** | `activities7d`, `byType[{ type, count }]` |
| **Simple logic** | Count CRM activity events in 7d. |
| **Functional** | P2 — after core funnel/aging. |

---

## 8. Graph type cheat sheet (HQ CRM)

| Metric | Recommended graph |
|--------|-------------------|
| Single KPI + trend | Number + sparkline |
| Leads by Stage | Horizontal bar / funnel (+ count, %, $) |
| Pipeline $ by stage | Stacked bar |
| New leads over time | Area / line |
| Win rate over time | Line / sparkline |
| Days in stage | Horizontal bar by stage |
| Source mix | Doughnut |
| Source quality | Table |
| Leads by owner | Horizontal bar |
| Lost reasons | Horizontal bar or doughnut |
| Recent leads / clients | Table |
| Quick links | Nav cards |
| Stale / overdue | Alert KPI + optional table |

Avoid: personal-only task lists as the main CRM management story; stage counts without rates.

---

## 9. Suggested snapshot shape (functional)

Illustrative rollup for the HQ CRM UI.

```ts
type HqCrmDashboardSnapshot = {
  capturedAt: string;
  currency: string;

  kpis: {
    totalLeads: number;
    openLeads: number;
    totalLeadsChangePct7d: number | null;
    hotLeads: number;
    followUpsDueToday: number;
    followUpsOverdue: number;
    pipelineValue: number;
    weightedPipelineValue: number | null;
    clientsTotal: number;
    clientsActive: number;
    newClients30d: number;
    teamTotal: number;
    teamActive: number;
    winRatePct30d: number | null;
    wonRevenue30d: number | null;
    newLeads7d: number;
    newLeads30d: number;
    stale14d: number;
    unassignedOpenLeads: number;
  };

  stages: {
    key: string;
    label: string;
    count: number;
    pctOfOpen: number | null;
    valueSum: number;
    medianDaysInStage: number | null;
  }[];

  conversions: {
    from: string;
    to: string;
    ratePct: number | null;
  }[];

  valueByStage: { stage: string; value: number; leadCount: number }[];

  velocity: {
    series: { date: string; newLeads: number }[];
  };

  sources: {
    mix: { source: string; count: number; pct: number }[];
    quality: {
      source: string;
      leads: number;
      converted: number;
      winPct: number | null;
      pipelineValue: number;
    }[];
  };

  owners: {
    ownerId: string | null;
    name: string;
    openLeads: number;
    hotLeads: number;
  }[];

  lostReasons: { reason: string; count: number; pct: number }[];

  recentLeads: {
    id: string;
    name: string;
    company: string;
    stage: string;
    value?: number | null;
    ownerName?: string | null;
    updatedAt: string;
  }[];

  recentClients: {
    id: string;
    company: string;
    contact: string;
    status: string;
    createdAt: string;
  }[];

  staleLeads: {
    id: string;
    name: string;
    company: string;
    stage: string;
    lastActivityAt: string;
  }[];

  weightsByStage: { stage: string; probability: number }[];
};
```

---

## 10. Hot lead & pipeline rules (recommended defaults)

Document in UI tooltips; tune with sales.

### Hot lead (v1)

```
hot = lead.priority === 'hot'
   OR lead.score >= 80
   OR (lead.stage IN ('Demo','Qualified') AND lead.estimatedValue >= hotValueThreshold)
```

### Pipeline inclusion

```
inPipeline = stage NOT IN ('Lost') AND stage NOT IN ('Converted')  // open only
pipelineValue = sum(estimatedValue) for inPipeline
```

### Stage probabilities (weighted pipeline v1)

| Stage | Probability |
|-------|-------------|
| New | 0.10 |
| Contacted | 0.20 |
| Demo | 0.40 |
| Qualified | 0.60 |
| Converted | 1.00 (usually out of open pipeline) |
| Lost | 0 |

---

## 11. Implementation priority

| Priority | Items | Why |
|----------|-------|-----|
| **P0** | Keep current KPIs + stage list; team-scope follow-ups; label open vs all leads; $ currency; stage click filters | Solid overview |
| **P1** | Stage conversion %; Pipeline $ by stage; Win rate; Overdue follow-ups; Stale leads; Lead velocity | Highest management value |
| **P2** | Days in stage; Source mix/quality; Weighted pipeline; Owner coverage; Client growth | Forecast & capacity |
| **P3** | Won revenue bridge; Lost reasons; Activity volume | Maturity |

---

## 12. Keep / Move / Add — checklist

### Keep on HQ CRM

- [ ] HQ Leads / Hot Leads / Pipeline Value
- [ ] Follow-ups Today (**team** total)
- [ ] Clients + Team KPIs
- [ ] Leads by Stage (+ link Open leads)
- [ ] Quick Links → Leads / Clients
- [ ] Recent HQ Leads / Recent HQ Clients tables
- [ ] Last updated + Refresh

### Move / demote

- [ ] Personal-only follow-up queue as hero KPI
- [ ] Full lead inbox as dashboard body
- [ ] Stage counts without % / $ (enhance, don’t delete)

### Add for management

- [ ] Stage conversion rates
- [ ] Win rate (30d/90d)
- [ ] Pipeline value by stage
- [ ] Lead velocity (new 7d/30d + chart)
- [ ] Median days in stage
- [ ] Stale / aging leads
- [ ] Overdue follow-ups
- [ ] Lead source mix + source→convert
- [ ] Weighted / expected pipeline
- [ ] Client growth (new / churned / trend)
- [ ] Won revenue in period
- [ ] Owner coverage / leads per AE / unassigned
- [ ] Lost reasons
- [ ] Activity volume (optional)

---

## 13. Out of scope

| Next / other | Content |
|--------------|---------|
| **AE personal home** | My follow-ups, my leads, my targets |
| **HQ Platform dash** | Tenants, MRR, product usage |
| **Employees dash** | Candidate portal analytics |
| **Employer dash** | Company admin (still next if needed) |

---

## 14. Quick reference — tag summary

| Tag | Action |
|-----|--------|
| `CRM_KEEP` | Stay on HQ CRM management board |
| `CRM_AGG` | Summary / nav / top-N tables |
| `USER_MOVE` | Personal AE ops — off main canvas |
| `CRM_ADD` | Build for sales management value |

---

*Doc version: 1.0 — HQ CRM (leads & clients) dashboard stats. Ready for setup / implementation planning.*
