"use client";

import {
  FloatingIconsHero,
  type FloatingIconsHeroProps,
} from "@/components/ui/floating-icons-hero-section";
import { EMPLOYERS_DEMO_PATH } from "@/lib/employers/constants";
import { AppLocale, localizePath } from "@/lib/i18n";
import { useLocale } from "next-intl";
import {
  Ai3DIcon,
  Analytics3DIcon,
  Automation3DIcon,
  Compliance3DIcon,
  Facebook3DIcon,
  GlobalOps3DIcon,
  Instagram3DIcon,
  Learning3DIcon,
  LinkedIn3DIcon,
  PaymentGateway3DIcon,
  Payroll3DIcon,
  Recruitment3DIcon,
  Scheduling3DIcon,
  WhatsApp3DIcon,
  Workforce3DIcon,
  X3DIcon,
} from "./employersBrand3dIcons";

const employerFloatingIcons: FloatingIconsHeroProps["icons"] = [
  { id: 1, icon: LinkedIn3DIcon, className: "top-[8%] left-[8%]" },
  { id: 2, icon: Facebook3DIcon, className: "top-[18%] right-[7%]" },
  { id: 3, icon: X3DIcon, className: "top-[6%] right-[28%]" },
  { id: 4, icon: WhatsApp3DIcon, className: "top-[42%] left-[4%]" },
  { id: 5, icon: PaymentGateway3DIcon, className: "bottom-[12%] left-[12%]" },
  { id: 6, icon: Payroll3DIcon, className: "bottom-[8%] right-[10%]" },
  { id: 7, icon: Ai3DIcon, className: "top-[52%] right-[4%]" },
  { id: 8, icon: Recruitment3DIcon, className: "top-[5%] left-[32%]" },
  { id: 9, icon: Workforce3DIcon, className: "top-[72%] right-[24%]" },
  { id: 10, icon: Learning3DIcon, className: "top-[8%] right-[48%]" },
  { id: 11, icon: Analytics3DIcon, className: "top-[38%] left-[14%]" },
  { id: 12, icon: Scheduling3DIcon, className: "bottom-[22%] left-[28%]" },
  { id: 13, icon: GlobalOps3DIcon, className: "top-[88%] left-[62%]" },
  { id: 14, icon: Compliance3DIcon, className: "top-[58%] left-[6%]" },
  { id: 15, icon: Instagram3DIcon, className: "bottom-[6%] right-[38%]" },
  { id: 16, icon: Automation3DIcon, className: "top-[28%] right-[6%]" },
];

export function EmployersFloatingHeroSection() {
  const locale = useLocale() as AppLocale;
  const demoHref = localizePath(EMPLOYERS_DEMO_PATH, locale);

  return (
    <div className="border-t border-slate-200 bg-linear-to-b from-slate-50 via-white to-slate-50">
      <FloatingIconsHero
        variant="light"
        size="compact"
        iconPresentation="brand3d"
        className="bg-transparent"
        title="One platform for your entire workforce"
        subtitle="Connect recruitment, people operations, payroll, CRM, analytics, and learning in a single employer ecosystem — with AI built into every step."
        ctaText="Request Demo"
        ctaHref={demoHref}
        icons={employerFloatingIcons}
      />
    </div>
  );
}
