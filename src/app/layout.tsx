import type { Metadata } from "next";
import "./globals.css";
/* Self-hosted fonts — no request to fonts.googleapis.com (works offline / blocked networks) */
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/arimo/400.css";
import "@fontsource/arimo/700.css";
import { ToastProvider } from "@/components/common/toast/ToastProvider";
import { AuthProvider } from "@/components/auth/AuthContext";
import { InactivityGuard } from "@/components/auth/InactivityGuard";
import { AuthGuard } from "@/components/auth/AuthGuard";
import GlobalHeader from "@/components/common/GlobalHeader";
import ApiHealthChecker from "@/components/common/ApiHealthChecker";
import GlobalFooter from "@/components/common/GlobalFooter";
import { NavigationLoader } from "@/components/common/NavigationLoader";
import { IntlProvider } from "@/components/i18n/IntlProvider";

export const metadata: Metadata = {
  title: {
    default: "HR Yantra",
    template: "%s | HR Yantra",
  },
  description: "AI-powered career dashboard and learning platform",
  icons: {
    icon: "/fs.png",
    shortcut: "/fs.png",
    apple: "/fs.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <IntlProvider>
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
        </IntlProvider>
      </body>
    </html>
  );
}
