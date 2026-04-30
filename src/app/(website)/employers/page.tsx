import { Metadata } from "next";
import EmployerLandingPage from "./EmployersClient";

export const metadata: Metadata = {
  title: "Employers",
  description: "Your Entire Hiring & HR Operations — Powered by AI.",
};

export default function Page() {
  return <EmployerLandingPage />;
}
