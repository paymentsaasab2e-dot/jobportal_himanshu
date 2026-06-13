export const MATCH_SCORE_FILTER_KEYS = ['80', '70', '60'] as const

const FIT_LABEL_MAP: Record<string, string> = {
  'weak fit': 'fitLabels.weakFit',
  reject: 'fitLabels.reject',
  'excellent match': 'fitLabels.excellentMatch',
  'strong match': 'fitLabels.strongMatch',
  'good match': 'fitLabels.goodMatch',
  'partial match': 'fitLabels.partialMatch',
  'excellent alignment': 'fitLabels.excellentAlignment',
  'gap identified': 'fitLabels.gapIdentified',
  'closest match': 'fitLabels.closestMatch',
  'best match': 'fitLabels.bestMatch',
}

type ExploreTranslator = (key: string, values?: Record<string, string | number>) => string

export function translateFitLabel(label: string | undefined | null, t: ExploreTranslator): string {
  const trimmed = String(label || '').trim()
  if (!trimmed) return ''
  const key = FIT_LABEL_MAP[trimmed.toLowerCase()]
  return key ? t(key) : trimmed
}

export function parseExploreMatchScore(match?: string, matchScore?: number): number {
  if (typeof matchScore === 'number' && Number.isFinite(matchScore)) {
    return Math.max(0, Math.min(100, Math.round(matchScore)))
  }
  const parsed = Number.parseInt((match || '').replace(/[^0-9]/g, ''), 10)
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0
}

export function formatExploreMatchLabel(
  t: ExploreTranslator,
  match?: string,
  matchScore?: number,
  personalized = false,
  cvBased = false,
): string {
  const score = parseExploreMatchScore(match, matchScore)
  if (!score && matchScore == null && !match) return t('notScoredYet')
  if (cvBased) return t('cvFitPercent', { score })
  if (personalized) return t('aiFitPercent', { score })
  return t('percentMatch', { score })
}

export function formatExploreTimeAgo(t: ExploreTranslator, date: Date | string): string {
  const now = new Date()
  const postedDate = typeof date === 'string' ? new Date(date) : date
  const diffInMs = now.getTime() - postedDate.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays <= 0) return t('timeJustNow')
  if (diffInDays === 1) return t('timeDayAgo')
  if (diffInDays < 7) return t('timeDaysAgo', { days: diffInDays })
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return weeks === 1 ? t('timeWeekAgo') : t('timeWeeksAgo', { weeks })
  }
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30)
    return months === 1 ? t('timeMonthAgo') : t('timeMonthsAgo', { months })
  }
  const years = Math.floor(diffInDays / 365)
  return years === 1 ? t('timeYearAgo') : t('timeYearsAgo', { years })
}

export function formatExploreEmploymentType(
  raw: string,
  tJobs: (key: string) => string,
): string {
  const normalized = raw.trim().replace(/-/g, '_').replace(/\s+/g, '_').toUpperCase()
  if (normalized === 'FULL_TIME' || normalized === 'FULLTIME') return tJobs('fullTime')
  if (normalized === 'PART_TIME' || normalized === 'PARTTIME') return tJobs('partTime')
  if (normalized === 'CONTRACT') return tJobs('contract')
  if (normalized === 'INTERNSHIP') return tJobs('internship')
  if (normalized === 'FREELANCE') return tJobs('contract')
  return raw.replace(/_/g, ' ')
}

export function createInitialMatchScoreState(): Record<string, boolean> {
  return Object.fromEntries(MATCH_SCORE_FILTER_KEYS.map((key) => [key, false]))
}
