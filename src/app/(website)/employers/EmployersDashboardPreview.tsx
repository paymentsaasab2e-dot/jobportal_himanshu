"use client";

import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLandingMetrics } from "./sections/cinematic/useLandingMetrics";
import {
  DEMO_LANDING_METRICS,
  buildDemoDashboard,
  type EmployerLandingMetrics,
} from "@/lib/employers/landingMetrics";
import {
  EMPLOYERS_PREVIEW_TOUR_PAGES,
  EmployersPreviewTourProvider,
} from "./EmployersPreviewTourContext";
import { EmployersPreviewPageContent } from "./EmployersPreviewPageContent";

const TOUR_INTERVAL_MS = 4800;
const PREVIEW_CONTENT_HEIGHT = "560px";

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-xl border border-[#28A8E1]/15 bg-[#E8F7FD]/70"
        />
      ))}
      <div className="h-64 animate-pulse rounded-xl border border-[#28A8E1]/15 bg-[#E8F7FD]/70 sm:col-span-2 lg:col-span-3" />
      <div className="h-64 animate-pulse rounded-xl border border-[#28A8E1]/15 bg-[#E8F7FD]/70" />
    </div>
  );
}

function resolveMetrics(data: EmployerLandingMetrics): EmployerLandingMetrics {
  if (data.mode === "live" && data.dashboard) return data;
  if (data.dashboard) {
    return {
      ...data,
      dashboard: data.dashboard,
    };
  }
  return {
    ...DEMO_LANDING_METRICS,
    ...data,
    dashboard: buildDemoDashboard(),
    capturedAt: data.capturedAt || new Date().toISOString(),
  };
}

function EmployersDashboardContent({ pageIndex }: { pageIndex: number }) {
  const { data, loading } = useLandingMetrics();
  const metrics = resolveMetrics(data);
  const isLive = metrics.mode === "live";
  const page = EMPLOYERS_PREVIEW_TOUR_PAGES[pageIndex] || EMPLOYERS_PREVIEW_TOUR_PAGES[0];

  if (loading && metrics.mode === "loading") {
    return <DashboardSkeleton />;
  }

  return (
    <div className="relative h-full min-h-0">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={page.id}
          className="h-full"
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(3px)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <EmployersPreviewPageContent pageId={page.id} metrics={metrics} isLive={isLive} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function preventDemoNavigation(event: MouseEvent<HTMLElement>) {
  const anchor = (event.target as HTMLElement).closest("a");
  if (anchor) {
    event.preventDefault();
  }
}

export function EmployersDashboardPreview() {
  const [pageIndex, setPageIndex] = useState(0);
  const activePage = EMPLOYERS_PREVIEW_TOUR_PAGES[pageIndex] || EMPLOYERS_PREVIEW_TOUR_PAGES[0];
  const activePath = activePage.path;
  const accent = activePage.accent;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPageIndex((prev) => (prev + 1) % EMPLOYERS_PREVIEW_TOUR_PAGES.length);
    }, TOUR_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  const previewStyle = {
    "--preview-accent": accent.primary,
    "--preview-accent-soft": accent.soft,
    "--preview-accent-strong": accent.strong,
    "--preview-accent-glow": accent.glow,
    "--primary": accent.strong,
    "--secondary": accent.soft,
    "--secondary-foreground": accent.strong,
    "--accent": accent.soft,
    "--accent-foreground": accent.strong,
    "--ring": accent.primary,
    "--sidebar": accent.soft,
    "--sidebar-primary": accent.primary,
    "--sidebar-accent": accent.soft,
    "--sidebar-accent-foreground": accent.strong,
    "--sidebar-border": accent.glow,
    "--sidebar-ring": accent.primary,
  } as CSSProperties;

  return (
    <TooltipProvider delay={300}>
      <EmployersPreviewTourProvider activePath={activePath}>
        <div
          aria-label="HRYantra Phase 2 employer CRM dashboard preview"
          className="employers-dashboard-preview relative z-20 mx-auto w-full max-w-[min(100%,1280px)] px-3 sm:px-5"
          onClickCapture={preventDemoNavigation}
          role="region"
          style={previewStyle}
        >
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <p className="text-xs font-medium text-[#0F5A7A] transition-colors duration-500">
              Auto-touring Phase 2 modules · live aggregates when connected
            </p>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {EMPLOYERS_PREVIEW_TOUR_PAGES.map((page, index) => (
                <span
                  key={page.id}
                  className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                    index === pageIndex ? "w-5" : "w-1.5 opacity-40"
                  }`}
                  style={{ backgroundColor: page.accent.primary }}
                />
              ))}
            </div>
          </div>
          <div
            className="employers-dashboard-preview__frame overflow-hidden rounded-xl border bg-white shadow-[0_24px_60px_rgba(8,66,140,0.12),0_8px_24px_var(--preview-accent-glow)] ring-1 transition-[border-color,box-shadow] duration-500"
            style={{
              borderColor: "color-mix(in srgb, var(--preview-accent) 28%, white)",
            }}
          >
            <AppShell preview className="h-full min-h-0">
              <EmployersDashboardContent pageIndex={pageIndex} />
            </AppShell>
          </div>
        </div>
      </EmployersPreviewTourProvider>
    </TooltipProvider>
  );
}
