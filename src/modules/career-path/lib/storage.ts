import type { CareerJourney } from '../types';

const STORAGE_KEY = 'lms:career-journey';

export function readCareerJourney(): CareerJourney | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CareerJourney;
  } catch {
    return null;
  }
}

export function saveCareerJourney(journey: CareerJourney) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journey));
}

export function clearCareerJourney() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
