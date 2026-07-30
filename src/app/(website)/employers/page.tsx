import { Metadata } from "next";
import EmployerLandingPage from "./EmployersClient";
import { fetchEmployerPricingPlans } from "@/lib/employers/hqPackages";

export const metadata: Metadata = {
  title: "Employers — HRYantra CRM",
  description:
    "SAASA B2E employer platform: leads, jobs, AI matching, interviews, placements, billing, and HQ analytics in one unified CRM.",
};

export default async function Page() {
  const initialPlans = await fetchEmployerPricingPlans("en");
  return <EmployerLandingPage initialPlans={initialPlans} />;
}
