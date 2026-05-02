import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quizzes",
  description: "Test your knowledge with AI-generated quizzes on HR Yantra.",
};

export default function LmsQuizzesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
