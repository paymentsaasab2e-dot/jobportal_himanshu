import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mock Interviews",
  description: "Practice your interview skills with HR Yantra's AI interviewer.",
};

export default function InterviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
