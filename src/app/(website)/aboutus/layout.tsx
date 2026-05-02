import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about HR Yantra's mission to transform career success with AI.",
};

export default function AboutUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
