import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Applications",
  description: "Manage and track the status of your job applications.",
};

export default function ApplicationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
