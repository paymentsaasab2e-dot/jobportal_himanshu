import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interview Prep",
  description: "Prepare for your next interview with structured learning paths.",
};

export default function LmsInterviewPrepLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
