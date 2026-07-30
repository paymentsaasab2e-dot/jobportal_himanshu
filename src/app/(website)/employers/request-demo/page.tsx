import type { Metadata } from "next";
import { RequestDemoClient } from "./RequestDemoClient";

export const metadata: Metadata = {
  title: "Request a Demo",
  description:
    "Book a tailored SAASA B2E employer demo — pick a date and time, then tell us what you want to see.",
};

export default function RequestDemoPage() {
  return <RequestDemoClient />;
}
