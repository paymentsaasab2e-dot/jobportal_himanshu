import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CV Score",
  description: "Check your resume's ATS match score and get improvement tips.",
};

export default function CvScoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
