import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses",
  description: "Upskill with AI-recommended courses on HR Yantra.",
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
