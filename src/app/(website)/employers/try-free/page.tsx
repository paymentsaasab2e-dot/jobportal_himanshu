import type { Metadata } from "next";
import { RequestDemoClient } from "../request-demo/RequestDemoClient";
import { TRIAL_DURATION_DAYS } from "@/lib/employers/constants";

export const metadata: Metadata = {
  title: "Try it free",
  description: `Start your ${TRIAL_DURATION_DAYS}-day free trial of the SAASA B2E employer platform.`,
};

export default function TryFreePage() {
  return <RequestDemoClient intent="trial" />;
}
