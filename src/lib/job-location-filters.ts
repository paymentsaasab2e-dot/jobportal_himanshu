import { City, Country } from 'country-state-city';

export type ParsedJobLocation = {
  city: string;
  country: string;
  raw: string;
};

export type CountryJobFacet = {
  name: string;
  jobCount: number;
};

const COUNTRY_NAMES_BY_LENGTH = Country.getAllCountries()
  .map((c) => c.name)
  .sort((a, b) => b.length - a.length);

const COUNTRY_NAME_BY_LOWER = new Map(
  Country.getAllCountries().map((c) => [c.name.toLowerCase(), c.name] as const),
);

const ISO_TO_COUNTRY_NAME = new Map(
  Country.getAllCountries().map((c) => [c.isoCode.toUpperCase(), c.name] as const),
);

let cityNameToCountry: Map<string, string> | null = null;

function getCountryNameByIso(iso: string): string {
  return ISO_TO_COUNTRY_NAME.get(iso.trim().toUpperCase()) || '';
}

function buildCityNameToCountryIndex(): Map<string, string> {
  const map = new Map<string, string>();
  for (const city of City.getAllCities()) {
    const key = city.name.trim().toLowerCase();
    if (!key || map.has(key)) continue;
    map.set(key, getCountryNameByIso(city.countryCode));
  }
  return map;
}

function inferCountryFromCityName(city: string): string {
  if (!city.trim()) return '';
  if (!cityNameToCountry) cityNameToCountry = buildCityNameToCountryIndex();
  return cityNameToCountry.get(city.trim().toLowerCase()) || '';
}

const COUNTRY_ALIASES: Record<string, string> = {
  usa: 'United States',
  us: 'United States',
  'united states of america': 'United States',
  uk: 'United Kingdom',
  uae: 'United Arab Emirates',
  bharat: 'India',
  'republic of india': 'India',
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countryNameMatchesSegment(countryName: string, segment: string): boolean {
  const seg = segment.trim();
  if (!seg) return false;
  const re = new RegExp(`^${escapeRegExp(countryName)}$`, 'i');
  return re.test(seg);
}

/** Resolve country from a single location segment (city/state/country part), not a full address string. */
function resolveCountryFromSegment(segment: string): string {
  const trimmed = segment.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  const alias = COUNTRY_ALIASES[lower];
  if (alias) return alias;

  const exact = COUNTRY_NAME_BY_LOWER.get(lower);
  if (exact) return exact;

  for (const name of COUNTRY_NAMES_BY_LENGTH) {
    if (countryNameMatchesSegment(name, trimmed)) return name;
  }

  return '';
}

export function parseJobLocation(
  locationRaw: string | null | undefined,
  cityRaw?: string | null,
  countryRaw?: string | null,
): ParsedJobLocation {
  const raw = (locationRaw || '').trim();
  const cityFromDb = (cityRaw || '').trim();
  const countryFromDb = (countryRaw || '').trim();

  if (/^remote$/i.test(raw) || /^remote$/i.test(cityFromDb)) {
    return { city: 'Remote', country: countryFromDb, raw: raw || 'Remote' };
  }

  let country = countryFromDb ? resolveCountryFromSegment(countryFromDb) || countryFromDb : '';
  let city = cityFromDb;

  if (raw) {
    const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
    if (!city && parts.length) city = parts[0];
    if (!country && parts.length > 1) {
      country = resolveCountryFromSegment(parts[parts.length - 1]);
    }
    if (!country && parts.length === 1) {
      country = inferCountryFromCityName(parts[0]);
    }
  }

  if (!city && raw) city = raw;

  if (!country && city) {
    country = inferCountryFromCityName(city);
  }

  return { city: city.trim(), country: country.trim(), raw };
}

function jobParsedCountry(job: { location: string; city?: string; country?: string }): string {
  return parseJobLocation(job.location, job.city, job.country).country;
}

export function jobMatchesCountry(
  job: { location: string; city?: string; country?: string },
  country: string,
): boolean {
  if (!country.trim()) return true;
  const target = country.trim().toLowerCase();
  const parsed = jobParsedCountry(job).toLowerCase();
  return parsed === target;
}

export function jobMatchesCity(
  job: { location: string; city?: string; country?: string },
  city: string,
): boolean {
  if (!city.trim()) return true;
  const target = city.trim().toLowerCase();
  const parsed = parseJobLocation(job.location, job.city, job.country);
  if (parsed.city.toLowerCase() === target) return true;
  return (job.location || '').toLowerCase().includes(target);
}

export type JobLocationFacets = {
  countries: CountryJobFacet[];
  citiesByCountry: Map<string, string[]>;
  allCities: string[];
  /** Jobs where country could not be determined from location data */
  jobsWithoutCountry: number;
  totalJobs: number;
};

export function buildJobLocationFacets(
  jobs: Array<{ location: string; city?: string; country?: string }>,
): JobLocationFacets {
  const countryCounts = new Map<string, number>();
  const citiesByCountry = new Map<string, Set<string>>();
  let jobsWithoutCountry = 0;

  for (const job of jobs) {
    const parsed = parseJobLocation(job.location, job.city, job.country);
    if (!parsed.country) {
      jobsWithoutCountry += 1;
      continue;
    }

    countryCounts.set(parsed.country, (countryCounts.get(parsed.country) || 0) + 1);

    if (parsed.city) {
      if (!citiesByCountry.has(parsed.country)) citiesByCountry.set(parsed.country, new Set());
      citiesByCountry.get(parsed.country)!.add(parsed.city);
    }
  }

  const countries: CountryJobFacet[] = Array.from(countryCounts.entries())
    .map(([name, jobCount]) => ({ name, jobCount }))
    .filter((c) => c.jobCount > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const citiesByCountrySorted = new Map<string, string[]>();
  for (const [country, cities] of citiesByCountry) {
    if (!countryCounts.has(country)) continue;
    citiesByCountrySorted.set(country, Array.from(cities).sort((a, b) => a.localeCompare(b)));
  }

  const allCities = Array.from(
    new Set(Array.from(citiesByCountrySorted.values()).flatMap((list) => list)),
  ).sort((a, b) => a.localeCompare(b));

  return {
    countries,
    citiesByCountry: citiesByCountrySorted,
    allCities,
    jobsWithoutCountry,
    totalJobs: jobs.length,
  };
}

export function getCountryJobCount(facets: JobLocationFacets, countryName: string): number {
  return facets.countries.find((c) => c.name === countryName)?.jobCount ?? 0;
}

export function countJobsForLocationFacet(
  jobs: Array<{ location: string; city?: string; country?: string }>,
  country?: string,
  city?: string,
): number {
  return jobs.filter((job) => {
    if (country && !jobMatchesCountry(job, country)) return false;
    if (city && !jobMatchesCity(job, city)) return false;
    return true;
  }).length;
}

/** True when search text looks like a country name but no jobs exist for it. */
export function countrySearchHasNoJobs(
  query: string,
  facets: JobLocationFacets,
): boolean {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return false;

  const matchingFacet = facets.countries.filter((c) => c.name.toLowerCase().includes(q));
  if (matchingFacet.length > 0) return false;

  const knownCountry = Country.getAllCountries().find(
    (c) =>
      c.name.toLowerCase() === q ||
      c.name.toLowerCase().includes(q) ||
      Object.entries(COUNTRY_ALIASES).some(
        ([alias, name]) => alias.includes(q) && facets.countries.every((f) => f.name !== name),
      ),
  );

  if (!knownCountry) return false;

  return !facets.countries.some(
    (f) => f.name.toLowerCase() === knownCountry.name.toLowerCase(),
  );
}
