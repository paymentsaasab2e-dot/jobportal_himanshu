import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Track your job applications and career progress.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
