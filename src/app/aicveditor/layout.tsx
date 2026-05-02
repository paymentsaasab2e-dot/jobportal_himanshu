import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI CV Editor",
  description: "Leverage AI to create a high-scoring professional resume.",
};

export default function AiCvEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
