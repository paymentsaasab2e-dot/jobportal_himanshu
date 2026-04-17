import type { Metadata } from "next";
import "./globals.css";
import { Inter, Arimo } from "next/font/google";
import { ToastProvider } from "@/components/common/toast/ToastProvider";
import GlobalHeader from "@/components/common/GlobalHeader";
import ApiHealthChecker from "@/components/common/ApiHealthChecker";
import Footer from "@/components/common/Footer";

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
  title: "SAASA B2E",
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
          <GlobalHeader />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
