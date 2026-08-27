import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Hryantra",
  description:
    "How Hryantra accesses, uses, stores, shares, retains, and deletes personal information and Google user data for Gmail and Calendar integrations.",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
