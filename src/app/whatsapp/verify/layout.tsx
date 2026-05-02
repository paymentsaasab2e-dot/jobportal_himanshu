import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify",
  description: "Verify your WhatsApp number to continue.",
};

export default function WhatsappVerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
