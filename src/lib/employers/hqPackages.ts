import type { PricingPlan } from "@/components/ui/pricing";
import { localizePath, type AppLocale } from "@/lib/i18n";

const EMPLOYERS_LOGIN_HREF =
  "https://employers.hryantra.com/login?redirect=%2Fleads";

export type HqPackage = {
  name: string;
  displayName?: string;
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
      price: "149",
      yearlyPrice: "119",
      period: "per month",
      features: [
        "Up to 25 active job postings",
        "AI CV screening & ATS scoring",
        "Candidate pipeline & interviews",
        "Basic analytics dashboard",
        "Email support (48h response)",
      ],
      description: "For small teams hiring their first roles on SAASA B2E.",
      buttonText: "Start Free Trial",
      href: EMPLOYERS_LOGIN_HREF,
      isPopular: false,
    },
    {
      name: "PROFESSIONAL",
      price: "399",
      yearlyPrice: "319",
      period: "per month",
      features: [
        "Unlimited job postings",
        "Full AI recruitment suite",
        "Employee management & onboarding",
        "Performance & payroll modules",
        "Multi-platform job publishing",
        "Priority support (24h response)",
        "Team collaboration & roles",
      ],
      description: "For growing companies running hiring and HR in one place.",
      buttonText: "Get Started",
      href: EMPLOYERS_LOGIN_HREF,
      isPopular: true,
    },
    {
      name: "ENTERPRISE",
      price: "999",
      yearlyPrice: "799",
      period: "per month",
      features: [
        "Everything in Professional",
        "Custom workflows & integrations",
        "Dedicated account manager",
        "SSO & advanced security",
        "SLA-backed uptime",
        "On-premise / private cloud options",
        "Custom contracts & training",
      ],
      description: "For large organizations with complex HR operations.",
      buttonText: "Contact Sales",
      href: contactHref,
      isPopular: false,
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

  return sorted.map((pkg) => {
    const key = String(pkg.displayName || pkg.name || "").toUpperCase();
    const isEnterprise = key.includes("ENTERPRISE");
    const isStarter = key.includes("STARTER");
    return {
      name: key || "PACKAGE",
      price: String(pkg.price || "0"),
      yearlyPrice: String(pkg.yearlyPrice || pkg.price || "0"),
      period: pkg.pricePeriod || "per month",
      features: Array.isArray(pkg.features) ? pkg.features : [],
      description: pkg.description || "",
      buttonText: isEnterprise
        ? "Contact Sales"
        : isStarter
          ? "Start Free Trial"
          : "Get Started",
      href: isEnterprise ? contactHref : loginHref,
      isPopular: Boolean(pkg.isPopular),
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
