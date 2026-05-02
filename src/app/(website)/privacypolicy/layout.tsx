import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Your privacy matters to us. Read how HR Yantra protects your data.",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
