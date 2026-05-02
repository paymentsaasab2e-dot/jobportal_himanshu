import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career Path",
  description: "Visualize and plan your career trajectory with AI insights.",
};

export default function LmsCareerPathLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
