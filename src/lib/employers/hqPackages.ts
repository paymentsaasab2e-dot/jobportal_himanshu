import type { PricingPlan } from "@/components/ui/pricing";
import { localizePath, type AppLocale } from "@/lib/i18n";

const EMPLOYERS_LOGIN_HREF =
  "https://employers.hryantra.com/login?redirect=%2Fdashboard";

function packageSlugFromName(name: string): string {
  const key = String(name || "").toUpperCase();
  if (key.includes("STARTER") || key.includes("BASIC")) return "starter";
  if (key.includes("PROFESSIONAL") || key.includes("PRO")) return "professional";
  if (key.includes("ENTERPRISE")) return "enterprise";
  return key.toLowerCase();
}

const PHASE2_FEATURE_LABELS: Record<string, string> = {
  hello: "Core employer workspace access",
  recruitment: "Full recruitment engine (jobs, candidates, pipeline)",
  leads: "Leads CRM with follow-ups & convert",
  clients: "Client accounts & contact directory",
  jobs: "Unlimited job postings & apply links",
  placements: "Placement tracking & revenue records",
  agreements: "Client agreements & document workflows",
  ai_screening: "AI CV screening & ATS scoring",
  analytics: "Dashboard, reports & HQ analytics",
  payroll: "Payroll-ready workforce records",
  performance: "Performance scorecards & reviews",
  onboarding: "Digital onboarding checklists",
  multi_publish: "Multi-channel job publishing",
  sso: "Single sign-on (SSO)",
  custom_workflows: "Custom workflows & automations",
  ai_matching: "4-pass AI candidate matching",
  interviews: "Interview scheduling & feedback",
  billing: "Billing & invoice lifecycle",
  rbac: "Role-based permissions (RBAC)",
  brain_ai: "HRYantra Brain AI assistant",
};

function humanizePackageFeature(raw: string): string {
  const key = String(raw || "").trim().toLowerCase();
  if (!key) return "";
  if (PHASE2_FEATURE_LABELS[key]) return PHASE2_FEATURE_LABELS[key];
  if (key.includes(" ")) return raw;
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function looksLikeFeatureSlug(features: string[]): boolean {
  if (features.length === 0) return false;
  return features.every((f) => /^[a-z0-9_]+$/i.test(String(f).trim()) && !String(f).includes(" "));
}

export type HqPackage = {
  name: string;
  displayName?: string;
  slug?: string;
  description?: string;
  price?: string;
  yearlyPrice?: string;
  pricePeriod?: string;
  features?: string[];
  isPopular?: boolean;
};

function getPhase2BaseUrls() {
  const fromEnv = process.env.NEXT_PUBLIC_PHASE2_API_URL?.replace(/\/$/, "");
  const urls: string[] = [];
  const local = "http://localhost:5001/api/v1";
  urls.push(local);
  if (fromEnv && !urls.includes(fromEnv)) {
    urls.push(fromEnv);
  }
  return urls;
}

export async function fetchPublicHqPackages(): Promise<HqPackage[]> {
  const bases = getPhase2BaseUrls();

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/hq/packages/public`, {
        cache: "no-store",
      });
      if (!res.ok) continue;
      const payload = await res.json();
      const rows = Array.isArray(payload?.data?.packages)
        ? payload.data.packages
        : [];
      if (rows.length > 0) return rows as HqPackage[];
    } catch {
      // Try next source.
    }
  }

  return [];
}

export function buildEmployerPlans(locale: AppLocale): PricingPlan[] {
  const contactHref = localizePath("/contact", locale);

  return [
    {
      name: "STARTER",
      price: "199",
      yearlyPrice: "159",
      period: "per month",
      features: [
        "Up to 10 team users & 2 roles",
        "Leads, jobs & candidates (core CRM)",
        "Pipeline stages & activity timeline",
        "Basic dashboard & notifications",
        "Public apply links (Phase 1 portal sync)",
        "Email support · 48h response",
      ],
      description: "For boutique agencies and small HR teams starting on HRYantra CRM.",
      buttonText: "Start free trial",
      href: EMPLOYERS_LOGIN_HREF,
      isPopular: false,
      packageSlug: "starter",
    },
    {
      name: "GROWTH",
      price: "499",
      yearlyPrice: "399",
      period: "per month",
      features: [
        "Everything in Starter",
        "AI job wizard & CV screening",
        "4-pass AI candidate matching",
        "Clients, contacts & lead follow-ups",
        "Interviews, placements & billing",
        "Reports, calendar & inbox",
        "Role-based permissions (RBAC)",
        "Priority support · 24h response",
      ],
      description: "For growing recruitment firms running full-cycle hiring on one platform.",
      buttonText: "Get started",
      href: EMPLOYERS_LOGIN_HREF,
      isPopular: true,
      packageSlug: "professional",
    },
    {
      name: "ENTERPRISE",
      price: "1299",
      yearlyPrice: "999",
      period: "per month",
      features: [
        "Everything in Growth",
        "HQ multi-tenant admin & analytics",
        "HRYantra Brain AI assistant",
        "Custom workflows & API / webhooks",
        "Pre-screen assessments at scale",
        "SSO, SLA & dedicated account manager",
        "Private cloud / on-premise options",
        "Custom onboarding & training",
      ],
      description: "For enterprise HR, staffing groups, and multi-brand employer organizations.",
      buttonText: "Talk to sales",
      href: contactHref,
      isPopular: false,
      packageSlug: "enterprise",
    },
  ];
}

export function mapHqPackagesToPricingPlans(
  locale: AppLocale,
  packages: HqPackage[]
): PricingPlan[] {
  const contactHref = localizePath("/contact", locale);
  const loginHref = EMPLOYERS_LOGIN_HREF;
  const rank = (name: string) => {
    const key = name.toUpperCase();
    if (key.includes("STARTER") || key.includes("BASIC")) return 1;
    if (key.includes("PROFESSIONAL") || key.includes("PRO")) return 2;
    if (key.includes("ENTERPRISE")) return 3;
    return 99;
  };
  const sorted = [...packages].sort(
    (a, b) =>
      rank(String(a.displayName || a.name || "")) -
      rank(String(b.displayName || b.name || ""))
  );

  const fallbacks = buildEmployerPlans(locale);
  const fallbackBySlug = new Map(
    fallbacks.map((plan) => [String(plan.packageSlug || ""), plan]),
  );

  return sorted.map((pkg) => {
    const key = String(pkg.displayName || pkg.name || "").toUpperCase();
    const packageSlug = String(pkg.slug || packageSlugFromName(key));
    const fallback = fallbackBySlug.get(packageSlug);
    const rawFeatures = Array.isArray(pkg.features)
      ? pkg.features.map(String).filter(Boolean)
      : [];
    const useFallbackFeatures =
      Boolean(fallback?.features?.length) &&
      (rawFeatures.length === 0 || looksLikeFeatureSlug(rawFeatures));
    const features = useFallbackFeatures
      ? fallback!.features
      : rawFeatures.length > 0
        ? rawFeatures.map(humanizePackageFeature)
        : fallback?.features ?? [];

    const displayName =
      packageSlug === "professional" && key.includes("PROFESSIONAL")
        ? "GROWTH"
        : key || "PACKAGE";

    return {
      name: displayName,
      price: String(pkg.price || fallback?.price || "0"),
      yearlyPrice: String(pkg.yearlyPrice || pkg.price || fallback?.yearlyPrice || "0"),
      period: pkg.pricePeriod || fallback?.period || "per month",
      features,
      description:
        String(pkg.description || "").trim() ||
        fallback?.description ||
        "",
      buttonText: fallback?.buttonText || "Get Started",
      href: packageSlug === "enterprise" ? contactHref : loginHref,
      isPopular:
        pkg.isPopular === undefined || pkg.isPopular === null
          ? Boolean(fallback?.isPopular)
          : Boolean(pkg.isPopular),
      packageSlug,
    };
  });
}

export async function fetchEmployerPricingPlans(
  locale: AppLocale
): Promise<PricingPlan[]> {
  const packages = await fetchPublicHqPackages();
  if (packages.length > 0) {
    const mapped = mapHqPackagesToPricingPlans(locale, packages);
    if (mapped.length > 0) return mapped;
  }
  return buildEmployerPlans(locale);
}
