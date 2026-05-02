import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CV Editor",
  description: "Build and edit your professional resume with AI guidance.",
};

export default function CvEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
