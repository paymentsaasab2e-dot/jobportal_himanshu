import type { AppLocale } from "@/lib/i18n";

/** Display-time phrases aligned with backend contentTranslation.service.js */
const EXACT_PHRASES_FR = new Map<string, string>([
  ["Frontend Engineer", "Ingénieur frontend"],
  ["Frontend developer", "Développeur frontend"],
  ["Backend Engineer", "Ingénieur backend"],
  ["Software Engineer", "Ingénieur logiciel"],
  ["Full Stack Developer", "Développeur full stack"],
  ["Data Scientist", "Scientifique des données"],
  ["Product Manager", "Chef de produit"],
  ["Project Manager", "Chef de projet"],
  ["HR Manager", "Responsable RH"],
  ["Data Structures", "Structures de données"],
  ["System Design", "Conception système"],
  ["Machine Learning", "Apprentissage automatique"],
  ["Artificial Intelligence", "Intelligence artificielle"],
  ["Cloud Computing", "Informatique en nuage"],
  ["DevOps", "DevOps"],
  ["India", "Inde"],
  ["Spain", "Espagne"],
  ["France", "France"],
  ["United Kingdom", "Royaume-Uni"],
  ["UK", "Royaume-Uni"],
  ["USA", "États-Unis"],
  ["United States", "États-Unis"],
  ["Germany", "Allemagne"],
  ["Maharashtra", "Maharashtra"],
  ["Aragon", "Aragon"],
  ["SummitSphere Media", "SummitSphere Médias"],
  ["OrbitEdge Commerce", "OrbitEdge Commerce"],
  ["Unknown Role", "Poste inconnu"],
  ["Unknown Company", "Entreprise inconnue"],
  ["Unknown Skill", "Compétence inconnue"],
  ["Untitled role", "Poste sans titre"],
]);

const COUNTRY_REGION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bIndia\b/gi, "Inde"],
  [/\bSpain\b/gi, "Espagne"],
  [/\bFrance\b/gi, "France"],
  [/\bUnited Kingdom\b/gi, "Royaume-Uni"],
  [/\bUK\b/gi, "Royaume-Uni"],
  [/\bUnited States\b/gi, "États-Unis"],
  [/\bUSA\b/gi, "États-Unis"],
  [/\bGermany\b/gi, "Allemagne"],
  [/\bItaly\b/gi, "Italie"],
  [/\bCanada\b/gi, "Canada"],
];

export function localizeDisplayText(
  value: string | null | undefined,
  locale: AppLocale
): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || locale !== "fr") return trimmed;

  const exact = EXACT_PHRASES_FR.get(trimmed);
  if (exact) return exact;

  const lowerKey = [...EXACT_PHRASES_FR.keys()].find(
    (key) => key.toLowerCase() === trimmed.toLowerCase()
  );
  if (lowerKey) return EXACT_PHRASES_FR.get(lowerKey) ?? trimmed;

  return trimmed;
}

export function localizeLocationText(
  value: string | null | undefined,
  locale: AppLocale
): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || locale !== "fr") return trimmed;

  const exact = localizeDisplayText(trimmed, locale);
  if (exact !== trimmed) return exact;

  let localized = trimmed;
  for (const [pattern, replacement] of COUNTRY_REGION_REPLACEMENTS) {
    localized = localized.replace(pattern, replacement);
  }

  return localized;
}

export function localizeSkillName(
  name: string | null | undefined,
  locale: AppLocale
): string {
  return localizeDisplayText(name, locale);
}

export function getSalaryNumberLocale(locale: AppLocale): string {
  return locale === "fr" ? "fr-FR" : "en-US";
}
