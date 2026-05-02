import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Update your professional profile and resume for better job matching.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
