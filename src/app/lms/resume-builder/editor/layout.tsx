import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Resume Builder",
  description: "Create a professional resume with real-time AI assistance.",
};

export default function LmsResumeBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
