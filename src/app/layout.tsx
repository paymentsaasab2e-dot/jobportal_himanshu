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
import { PortalNavigationWarmup } from "@/components/common/PortalNavigationWarmup";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { IntlProvider } from "@/components/i18n/IntlProvider";
import { TokensProvider } from "@/components/tokens/TokensContext";
import { FloatingAlertsHost } from "@/components/common/FloatingAlertsHost";
import { HryantraChatFab } from "@/components/common/HryantraChatFab";
import { HryantraChatSyncHost } from "@/components/common/HryantraChatSyncHost";
import { SuggestionsEngineHost } from "@/components/common/SuggestionsEngineHost";
import { UserActivityTrackerHost } from "@/components/common/UserActivityTrackerHost";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className="antialiased">
        <IntlProvider>
          <ApiHealthChecker />
          <ToastProvider>
            <AuthProvider>
              <InactivityGuard>
                <QueryProvider>
                <TokensProvider>
                <AuthGuard>
                  <NavigationLoader />
                  <PortalNavigationWarmup />
                  <GlobalHeader />
                  <main className="min-h-[calc(100dvh-var(--app-header-height,96px))]">
                    {children}
                  </main>
                  <GlobalFooter />
                  <FloatingAlertsHost />
                  <HryantraChatSyncHost />
                  <HryantraChatFab />
                  <SuggestionsEngineHost />
                  <UserActivityTrackerHost />
                </AuthGuard>
                </TokensProvider>
                </QueryProvider>
              </InactivityGuard>
            </AuthProvider>
          </ToastProvider>
        </IntlProvider>
      </body>
    </html>
  );
}
