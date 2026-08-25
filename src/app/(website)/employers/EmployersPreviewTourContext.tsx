"use client";

import React, { createContext, useContext } from "react";

export type EmployersPreviewPageId =
  | "dashboard"
  | "leads"
  | "clients"
  | "contacts"
  | "jobs"
  | "candidates"
  | "pipeline"
  | "matches"
  | "interviews"
  | "placements"
  | "inbox"
  | "reports"
  | "billing";

export type EmployersPreviewAccent = {
  primary: string;
  soft: string;
  strong: string;
  glow: string;
};

export type EmployersPreviewTourPage = {
  id: EmployersPreviewPageId;
  title: string;
  path: string;
  accent: EmployersPreviewAccent;
};

export const EMPLOYERS_PREVIEW_TOUR_PAGES: EmployersPreviewTourPage[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    path: "#/dashboard",
    accent: { primary: "#28A8E1", soft: "#E8F7FD", strong: "#08428c", glow: "rgba(40,168,225,0.22)" },
  },
  {
    id: "leads",
    title: "Leads",
    path: "#/leads",
    accent: { primary: "#FC9620", soft: "#FFF1DF", strong: "#E8770E", glow: "rgba(252,150,32,0.22)" },
  },
  {
    id: "clients",
    title: "Clients",
    path: "#/clients",
    accent: { primary: "#0F5A7A", soft: "#E6F3F8", strong: "#08428c", glow: "rgba(15,90,122,0.18)" },
  },
  {
    id: "contacts",
    title: "Contacts",
    path: "#/contacts",
    accent: { primary: "#28A8DF", soft: "#E8F7FD", strong: "#0B6FA3", glow: "rgba(40,168,223,0.2)" },
  },
  {
    id: "jobs",
    title: "Jobs",
    path: "#/jobs",
    accent: { primary: "#08428c", soft: "#E8F0F8", strong: "#062f66", glow: "rgba(8,66,140,0.2)" },
  },
  {
    id: "candidates",
    title: "Candidates",
    path: "#/candidates",
    accent: { primary: "#1FA2C5", soft: "#E7F7FB", strong: "#0F5A7A", glow: "rgba(31,162,197,0.2)" },
  },
  {
    id: "pipeline",
    title: "Pipeline",
    path: "#/pipeline",
    accent: { primary: "#E8770E", soft: "#FFF4E8", strong: "#C45F08", glow: "rgba(232,119,14,0.2)" },
  },
  {
    id: "matches",
    title: "AI Matches",
    path: "#/matches",
    accent: { primary: "#28A8E1", soft: "#EAF8FE", strong: "#1478AD", glow: "rgba(40,168,225,0.24)" },
  },
  {
    id: "interviews",
    title: "Interviews",
    path: "#/interviews",
    accent: { primary: "#0EA5A8", soft: "#E7F8F8", strong: "#0B7477", glow: "rgba(14,165,168,0.2)" },
  },
  {
    id: "placements",
    title: "Placements",
    path: "#/placements",
    accent: { primary: "#16A34A", soft: "#ECFDF3", strong: "#15803D", glow: "rgba(22,163,74,0.18)" },
  },
  {
    id: "inbox",
    title: "Inbox",
    path: "#/inbox",
    accent: { primary: "#6366F1", soft: "#EEF2FF", strong: "#4338CA", glow: "rgba(99,102,241,0.18)" },
  },
  {
    id: "reports",
    title: "Reports",
    path: "#/reports",
    accent: { primary: "#0284C7", soft: "#E0F2FE", strong: "#0369A1", glow: "rgba(2,132,199,0.2)" },
  },
  {
    id: "billing",
    title: "Billing",
    path: "#/billing",
    accent: { primary: "#FC9620", soft: "#FFF6EB", strong: "#D97706", glow: "rgba(252,150,32,0.2)" },
  },
];

type EmployersPreviewTourContextValue = {
  activePath: string;
  activePage: EmployersPreviewTourPage;
  pageIndex: number;
};

const EmployersPreviewTourContext = createContext<EmployersPreviewTourContextValue | null>(null);

export function EmployersPreviewTourProvider({
  activePath,
  children,
}: {
  activePath: string;
  children: React.ReactNode;
}) {
  const pageIndex = Math.max(
    0,
    EMPLOYERS_PREVIEW_TOUR_PAGES.findIndex((page) => page.path === activePath),
  );
  const activePage = EMPLOYERS_PREVIEW_TOUR_PAGES[pageIndex] || EMPLOYERS_PREVIEW_TOUR_PAGES[0];

  return (
    <EmployersPreviewTourContext.Provider value={{ activePath, activePage, pageIndex }}>
      {children}
    </EmployersPreviewTourContext.Provider>
  );
}

export function useEmployersPreviewTour() {
  return useContext(EmployersPreviewTourContext);
}
