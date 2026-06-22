'use client'

import { useMemo } from 'react'
import { useLocale } from 'next-intl'
import { candmainLandingEn } from './content.en'
import { candmainLandingFr } from './content.fr'
import type { CandmainLandingContent } from './types'

export function getCandmainLandingContent(locale: string): CandmainLandingContent {
  return locale === 'fr' ? candmainLandingFr : candmainLandingEn
}

export function useCandmainLandingContent(): CandmainLandingContent {
  const locale = useLocale()
  return useMemo(() => getCandmainLandingContent(locale), [locale])
}

export type {
  CandmainLandingContent,
  CandmainStat,
  CandmainActivityItem,
  CandmainHiringStage,
  CandmainCaseStudy,
  CandmainExperience,
  CandmainComparison,
  CandmainImpactTab,
} from './types'
