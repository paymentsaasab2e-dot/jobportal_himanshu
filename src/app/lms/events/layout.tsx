import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events",
  description: "Stay updated with the latest webinars and career events.",
};

export default function LmsEventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
