import type { Metadata } from "next";
import { TryFreeLoginClient } from "./TryFreeLoginClient";

export const metadata: Metadata = {
  title: "Try it free",
  description:
    "Enter your email and mobile to try HR Yantra. Valid credentials open the workspace; otherwise request a demo.",
};

export default function TryFreePage() {
  return (
    <main className="min-h-[70vh] bg-[linear-gradient(135deg,#fde9d4,#fafbfb,#bddffb)] px-4 pt-28 pb-16 sm:px-6 sm:pt-36">
      <TryFreeLoginClient />
    </main>
  );
}
