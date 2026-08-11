import { Metadata } from "next";
import EmployerLandingPage from "./EmployersClient";

export const metadata: Metadata = {
  title: "HRYantra for Employers | AI-Powered Recruitment & Business Platform",
  description:
    "Manage leads, clients, candidates, jobs, interviews, placements and recruitment operations with HRYantra's intelligent employer platform.",
};

export default function Page() {
  return <EmployerLandingPage />;
}
