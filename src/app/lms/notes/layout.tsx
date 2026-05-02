import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notes",
  description: "Manage your learning notes and study materials.",
};

export default function LmsNotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
