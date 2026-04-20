'use client';

import { ToastProvider } from "@/components/common/toast/ToastProvider";
import ApiHealthChecker from "@/components/common/ApiHealthChecker";

export default function NoHeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ApiHealthChecker />
      <ToastProvider>
        <main className="min-h-screen">
          {children}
        </main>
      </ToastProvider>
    </>
  );
}
