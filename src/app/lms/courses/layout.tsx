import { Metadata } from "next";

export const metadata: Metadata = {
  title: "LMS",
  description: "Access your courses and learning materials on HR Yantra.",
};

export default function LmsCoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
