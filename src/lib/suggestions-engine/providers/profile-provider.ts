/**
 * @deprecated Profile nudges are handled by engagement-provider (rotating, recurring).
 * Kept as no-op provider for backward compat if registered elsewhere.
 */
import type { SuggestionProvider } from '../types';

export const profileSuggestionProvider: SuggestionProvider = {
  id: 'profile',
  run() {
    return [];
  },
};
