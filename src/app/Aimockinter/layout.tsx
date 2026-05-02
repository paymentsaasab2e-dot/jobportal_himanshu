import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Mock Interview",
  description: "Experience realistic AI-powered mock interviews.",
};

export default function AiMockInterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
