import { City, Country, State } from 'country-state-city';

export type CitySuggestion = {
  label: string;
  value: string;
  countryCode: string;
  stateCode: string;
  stateName: string;
  latitude?: string | null;
  longitude?: string | null;
};

const cityCache = new Map<string, CitySuggestion[]>();
let globalCityNameIndex: Map<string, CitySuggestion[]> | null = null;

function buildGlobalCityNameIndex(): Map<string, CitySuggestion[]> {
  const index = new Map<string, CitySuggestion[]>();
  const stateCache = new Map<string, Map<string, string>>();

  for (const city of City.getAllCities()) {
    let stateMap = stateCache.get(city.countryCode);
    if (!stateMap) {
      stateMap = new Map(
        (State.getStatesOfCountry(city.countryCode) || []).map((s) => [s.isoCode, s.name] as const),
      );
      stateCache.set(city.countryCode, stateMap);
    }

    const stateName = stateMap.get(city.stateCode) || city.stateCode;
    const countryName = getCountryNameByIso(city.countryCode);
    const label = countryName
      ? `${city.name}, ${stateName}, ${countryName}`
      : stateName
        ? `${city.name}, ${stateName}`
        : city.name;

    const suggestion: CitySuggestion = {
      label,
      value: city.name,
      countryCode: city.countryCode,
      stateCode: city.stateCode,
      stateName,
      latitude: city.latitude,
      longitude: city.longitude,
    };

    const key = city.name.toLowerCase();
    const bucket = index.get(key) || [];
    bucket.push(suggestion);
    index.set(key, bucket);
  }

  return index;
}

function getGlobalCityNameIndex(): Map<string, CitySuggestion[]> {
  if (!globalCityNameIndex) {
    globalCityNameIndex = buildGlobalCityNameIndex();
  }
  return globalCityNameIndex;
}

function pickBestGlobalMatch(
  matches: CitySuggestion[],
  preferredCountryIso?: string,
): CitySuggestion | null {
  if (matches.length === 0) return null;
  if (preferredCountryIso) {
    const inCountry = matches.find(
      (m) => m.countryCode.toUpperCase() === preferredCountryIso.toUpperCase(),
    );
    if (inCountry) return inCountry;
  }
  if (matches.length === 1) return matches[0];
  return null;
}

const COUNTRY_BY_NAME_LOWER = new Map(
  Country.getAllCountries().map((c) => [c.name.toLowerCase(), c] as const),
);

const COUNTRY_NAME_BY_ISO = new Map(
  Country.getAllCountries().map((c) => [c.isoCode, c.name] as const),
);

const COUNTRY_ALIASES: Record<string, string> = {
  'united states of america': 'United States',
  usa: 'United States',
  us: 'United States',
  'russian federation': 'Russia',
  czechia: 'Czech Republic',
  'türkiye': 'Turkey',
  turkiye: 'Turkey',
  'great britain': 'United Kingdom',
  uk: 'United Kingdom',
  england: 'United Kingdom',
  scotland: 'United Kingdom',
  wales: 'United Kingdom',
  bharat: 'India',
  'republic of india': 'India',
  "cote d'ivoire": "Cote D'Ivoire (Ivory Coast)",
  "côte d'ivoire": "Cote D'Ivoire (Ivory Coast)",
  'ivory coast': "Cote D'Ivoire (Ivory Coast)",
  burma: 'Myanmar',
};

function loadCitiesForCountry(countryIso: string): CitySuggestion[] {
  const code = countryIso.trim().toUpperCase();
  const cached = cityCache.get(code);
  if (cached) return cached;

  const stateNameByCode = new Map(
    (State.getStatesOfCountry(code) || []).map((s) => [s.isoCode, s.name] as const),
  );

  const cities = (City.getCitiesOfCountry(code) || []).map((city) => {
    const stateName = stateNameByCode.get(city.stateCode) || city.stateCode;
    const label = stateName ? `${city.name}, ${stateName}` : city.name;
    return {
      label,
      value: city.name,
      countryCode: city.countryCode,
      stateCode: city.stateCode,
      stateName,
      latitude: city.latitude,
      longitude: city.longitude,
    };
  });

  cities.sort((a, b) => a.label.localeCompare(b.label));
  cityCache.set(code, cities);
  return cities;
}

export function resolveCountryToSelectValue(raw: string | undefined): string {
  if (!raw?.trim()) return '';
  const lower = raw.trim().toLowerCase();
  const mapped = COUNTRY_ALIASES[lower] || raw.trim();
  const exact = COUNTRY_BY_NAME_LOWER.get(mapped.toLowerCase());
  if (exact) return exact.name;

  const mappedLower = mapped.toLowerCase();
  for (const [nameLower, country] of COUNTRY_BY_NAME_LOWER) {
    if (mappedLower.includes(nameLower) || nameLower.includes(mappedLower)) {
      return country.name;
    }
  }
  return '';
}

export function getCountryNameByIso(iso: string | undefined): string {
  if (!iso?.trim()) return '';
  return COUNTRY_NAME_BY_ISO.get(iso.trim().toUpperCase()) || '';
}

function scoreCityName(name: string, query: string): number | null {
  const n = name.toLowerCase();
  const q = query.toLowerCase();
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.includes(q)) return 2;
  return null;
}

function scoreCitySuggestion(suggestion: CitySuggestion, query: string): number | null {
  const nameScore = scoreCityName(suggestion.value, query);
  if (nameScore !== null) return nameScore;

  const label = suggestion.label.toLowerCase();
  const q = query.toLowerCase();
  if (label === q) return 3;
  if (label.startsWith(q)) return 4;
  if (label.includes(q)) return 5;
  return null;
}

export function searchCitiesForCountry(
  countryIso: string,
  query: string,
  limit = 20,
): CitySuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];

  const ranked: { suggestion: CitySuggestion; score: number }[] = [];
  for (const city of loadCitiesForCountry(countryIso)) {
    const score = scoreCitySuggestion(city, q);
    if (score === null) continue;
    ranked.push({ suggestion: city, score });
  }

  ranked.sort(
    (a, b) => a.score - b.score || a.suggestion.label.localeCompare(b.suggestion.label),
  );
  return ranked.slice(0, limit).map((r) => r.suggestion);
}

function findAutoSelectInMatches(
  matches: CitySuggestion[],
  query: string,
): CitySuggestion | null {
  const q = query.trim().toLowerCase();
  if (!q || matches.length === 0) return null;

  const exactName = matches.find((m) => m.value.toLowerCase() === q);
  if (exactName) return exactName;

  const exactLabel = matches.find((m) => m.label.toLowerCase() === q);
  if (exactLabel) return exactLabel;

  if (matches.length === 1) return matches[0];

  const prefixName = matches.filter((m) => m.value.toLowerCase().startsWith(q));
  if (prefixName.length === 1) return prefixName[0];

  return null;
}

/** Global lookup by city name (e.g. Karachi → Pakistan). */
export function findCityByNameGlobal(
  cityName: string,
  preferredCountryIso?: string,
): CitySuggestion | null {
  const key = cityName.trim().toLowerCase();
  if (!key) return null;
  const matches = getGlobalCityNameIndex().get(key);
  return pickBestGlobalMatch(matches || [], preferredCountryIso);
}

export function searchCitiesGlobal(query: string, limit = 20): CitySuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];

  const ranked: { suggestion: CitySuggestion; score: number }[] = [];
  const seen = new Set<string>();

  for (const [, suggestions] of getGlobalCityNameIndex()) {
    for (const suggestion of suggestions) {
      const score = scoreCitySuggestion(suggestion, q);
      if (score === null) continue;
      const id = `${suggestion.countryCode}:${suggestion.stateCode}:${suggestion.value}`;
      if (seen.has(id)) continue;
      seen.add(id);
      ranked.push({ suggestion, score });
    }
  }

  ranked.sort(
    (a, b) => a.score - b.score || a.suggestion.label.localeCompare(b.suggestion.label),
  );
  return ranked.slice(0, limit).map((r) => r.suggestion);
}

/** City-name search in selected country + worldwide; sorted by best name match. */
export function searchCitySuggestions(
  query: string,
  countryIso?: string,
  limit = 20,
): CitySuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];

  const seen = new Set<string>();
  const ranked: { suggestion: CitySuggestion; score: number }[] = [];

  const add = (list: CitySuggestion[]) => {
    for (const suggestion of list) {
      const score = scoreCityName(suggestion.value, q);
      if (score === null) continue;
      const id = `${suggestion.countryCode}:${suggestion.stateCode}:${suggestion.value}`;
      if (seen.has(id)) continue;
      seen.add(id);
      ranked.push({ suggestion, score });
    }
  };

  if (countryIso) add(searchCitiesForCountry(countryIso, q, limit));
  add(searchCitiesGlobal(q, limit));

  const iso = countryIso?.toUpperCase();
  ranked.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    if (iso) {
      const aIn = a.suggestion.countryCode === iso ? -1 : 0;
      const bIn = b.suggestion.countryCode === iso ? -1 : 0;
      if (aIn !== bIn) return aIn - bIn;
    }
    return a.suggestion.label.localeCompare(b.suggestion.label);
  });

  return ranked.slice(0, limit).map((r) => r.suggestion);
}

/** Pick a city to auto-apply; searches selected country first, then worldwide. */
export function findAutoSelectCityMatch(
  query: string,
  countryIso?: string,
): CitySuggestion | null {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return null;

  if (countryIso) {
    const local = findAutoSelectInMatches(searchCitiesForCountry(countryIso, query, 100), query);
    if (local) return local;
  }

  const globalExact = findCityByNameGlobal(query, countryIso);
  if (globalExact) return globalExact;

  if (!countryIso) {
    return findAutoSelectInMatches(searchCitiesGlobal(query, 100), query);
  }

  return null;
}

export function formatCitySuggestionLabel(suggestion: CitySuggestion): string {
  return suggestion.label;
}

export function clearCityCacheForCountry(countryIso?: string): void {
  if (!countryIso?.trim()) {
    cityCache.clear();
    return;
  }
  cityCache.delete(countryIso.trim().toUpperCase());
}
