import type { Metadata } from "next";
import { RequestDemoClient } from "./RequestDemoClient";

export const metadata: Metadata = {
  title: "Request a Demo",
  description:
    "Tell us what you need — we'll tailor a SAASA B2E employer demo around your hiring and HR priorities.",
};

export default function RequestDemoPage() {
  return <RequestDemoClient />;
}
