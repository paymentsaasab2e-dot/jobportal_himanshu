import { Metadata } from "next";
import LandingPage from "./LandingPageClient";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Find the job that fits you perfectly with HR Yantra AI.",
};

export default function Page() {
  return <LandingPage />;
}
