import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Find answers and support for HR Yantra.",
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
