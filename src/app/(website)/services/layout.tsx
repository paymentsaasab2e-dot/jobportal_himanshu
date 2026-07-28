import { Metadata } from "next";
import { ServicesProvider } from "./context/ServicesContext";

export const metadata: Metadata = {
  title: "Transforming HR into Value for Talent and Enterprise",
  description:
    "Where Visionary Entrepreneurs and Top Talent Connect, Grow, and Scale.",
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ServicesProvider>{children}</ServicesProvider>;
}
