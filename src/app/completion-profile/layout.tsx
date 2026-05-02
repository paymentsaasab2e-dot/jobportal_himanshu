import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile Completion",
  description: "Complete your profile to unlock full platform features.",
};

export default function CompletionProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
