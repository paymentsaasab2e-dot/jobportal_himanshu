import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trust & Safety",
  description: "Learn about HR Yantra's commitment to a safe and trustworthy experience.",
};

export default function TrustSafetyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
