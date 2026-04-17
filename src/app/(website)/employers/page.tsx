import type { Metadata } from "next";

import { EmployerLandingPage } from "./components";

export const metadata: Metadata = {
  title: "SAASA B2E for Employers | AI-powered HRMS Ecosystem",
  description:
    "Discover the SAASA B2E employer ecosystem across recruitment, employee management, payroll, CRM, and analytics for modern companies.",
};

export default function EmployersPage() {
  return <EmployerLandingPage />;
}
