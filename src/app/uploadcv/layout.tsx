import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload CV",
  description: "Upload your resume to start your AI-powered job search.",
};

export default function UploadCvLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
