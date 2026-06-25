import { fetchEmployerPricingPlans } from "@/lib/employers/hqPackages";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isSupportedLocale,
} from "@/lib/i18n";
import { Metadata } from "next";
import { cookies } from "next/headers";
import EmployerLandingPage from "./EmployersClient";

export const metadata: Metadata = {
  title: "Employers",
  description: "Your Entire Hiring & HR Operations — Powered by AI.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isSupportedLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const initialPricingPlans = await fetchEmployerPricingPlans(locale);

  return (
    <EmployerLandingPage initialPricingPlans={initialPricingPlans} />
  );
}
