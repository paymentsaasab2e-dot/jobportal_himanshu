import type { Metadata } from "next";
import "./globals.css";
import { Inter, Arimo } from "next/font/google";
import { ToastProvider } from "@/components/common/toast/ToastProvider";
import { AuthProvider } from "@/components/auth/AuthContext";
import { InactivityGuard } from "@/components/auth/InactivityGuard";
import { AuthGuard } from "@/components/auth/AuthGuard";
import GlobalHeader from "@/components/common/GlobalHeader";
import ApiHealthChecker from "@/components/common/ApiHealthChecker";
import GlobalFooter from "@/components/common/GlobalFooter";
import { NavigationLoader } from "@/components/common/NavigationLoader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const arimo = Arimo({
  subsets: ["latin"],
  variable: "--font-arimo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HRYANTRA B2E",
  description: "AI-powered career dashboard and learning platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${arimo.variable}`}>
      <body className="antialiased">
        <ApiHealthChecker />
        <ToastProvider>
          <AuthProvider>
            <InactivityGuard>
              <AuthGuard>
                <NavigationLoader />
                <GlobalHeader />
                <main className="min-h-screen">
                  {children}
                </main>
                <GlobalFooter />
              </AuthGuard>
            </InactivityGuard>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
