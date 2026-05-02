import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Jobs",
  description: "Browse and apply for the best jobs matched to your profile.",
};

export default function ExploreJobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
