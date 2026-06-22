export type CandmainStat = {
  id: string
  label: string
  value: string
  status: string
  statusLabel: string
  trend: string
}

export type CandmainActivityItem = {
  id: number
  type: string
  typeLabel: string
  message: string
  time: string
  status: string
}

export type CandmainHiringStage = {
  id: string
  step: number
  title: string
  subtitle: string
  duration: string
  passRate: string
  companies: string[]
  color: string
  bg: string
  border: string
  liveCount: number
}

export type CandmainCaseStudy = {
  id: string
  tag: string
  title: string
  challenge: string
  research: string
  strategy: string
  results: { metric: string; value: string; detail: string }[]
  color: string
  bgColor: string
}

export type CandmainExperience = {
  id: string
  company: string
  role: string
  period: string
  description: string
  highlights: string[]
  color: string
}

export type CandmainComparison = {
  others: string
  candidate: string
  detail: string
}

export type CandmainImpactTab = {
  id: string
  label: string
  insight: string
  plain: string
}

export type CandmainLandingContent = {
  dateLocale: string
  commandCenter: {
    tag: string
    title: string
    titleAccent: string
    subtitle: string
    liveFeed: string
    ticker: string[]
    stats: CandmainStat[]
  }
  activity: {
    tag: string
    title: string
    titleAccent: string
    subtitle: string
    stats: { label: string; value: string }[]
    streamTitle: string
    latestUpdate: string
    feed: CandmainActivityItem[]
  }
  hiring: {
    tag: string
    title: string
    titleAccent: string
    subtitle: string
    funnelTitle: string
    funnelUpdated: string
    liveData: string
    stageLabel: string
    liveSuffix: string
    passPrefix: string
    totalPool: string
    refreshNote: string
    stages: CandmainHiringStage[]
    banner: { label: string; value: string }[]
  }
  impact: {
    tag: string
    title: string
    titleAccent: string
    subtitle: string
    metrics: { label: string; detail: string }[]
    chartTitle: string
    chartUpdated: string
    graphMeaning: string
    latest: string
    change: string
    liveReading: string
    tabs: CandmainImpactTab[]
    format: {
      openings: string
      views: string
    }
  }
  caseStudies: {
    tag: string
    title: string
    titleAccent: string
    subtitle: string
    problem: string
    checks: string
    helps: string
    showLess: string
    outcome: string
    studies: CandmainCaseStudy[]
  }
  skills: {
    tag: string
    title: string
    titleAccent: string
    subtitle: string
    footer: string
    nodes: Record<string, string>
  }
  experience: {
    tag: string
    title: string
    titleAccent: string
    subtitle: string
    stagesCount: string
    stagesHint: string
    steps: CandmainExperience[]
  }
  whyHire: {
    tag: string
    title: string
    titleAccent: string
    subtitle: string
    othersHeader: string
    portalHeader: string
    comparisons: CandmainComparison[]
    insight: string
    insightBold: string
  }
  cta: {
    badge: string
    tagline: string
    accent: string
    subtitle: string
    roles: string[]
    exploreJobs: string
    whatsappLogin: string
  }
}
