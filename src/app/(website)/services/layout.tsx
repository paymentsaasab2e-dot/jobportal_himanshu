import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expert Services",
  description: "AI-powered resume optimization, interview prep, and career coaching.",
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
