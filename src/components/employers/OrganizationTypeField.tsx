"use client";

import { Building2, Users } from "lucide-react";
import { Label } from "@/components/ui/label";

export type OrganizationType = "agency" | "standalone";

type Props = {
  value: OrganizationType | "";
  onChange: (value: OrganizationType) => void;
  id?: string;
};

const OPTIONS: {
  value: OrganizationType;
  label: string;
  description: string;
  icon: typeof Building2;
}[] = [
  {
    value: "agency",
    label: "Agency",
    description: "Recruit for clients — multi-client pipeline, assignments, and agency workflows.",
    icon: Users,
  },
  {
    value: "standalone",
    label: "Standalone",
    description: "Hire for your own company — internal HR and direct employer recruitment.",
    icon: Building2,
  },
];

export function OrganizationTypeField({ value, onChange, id = "organizationType" }: Props) {
  return (
    <div className="space-y-2.5 sm:col-span-2">
      <Label htmlFor={id} className="text-sm font-semibold text-slate-800">
        Workspace type <span className="text-orange-500">*</span>
      </Label>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-labelledby={id}>
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={`group rounded-2xl border p-4 text-left transition duration-200 ${
                selected
                  ? "border-[#28A8DF] bg-gradient-to-br from-sky-50 to-white shadow-[0_10px_28px_-18px_rgba(40,168,223,0.85)] ring-2 ring-[#28A8DF]/25"
                  : "border-slate-200/90 bg-white hover:border-sky-200 hover:bg-sky-50/40"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                    selected
                      ? "bg-[#28A8DF] text-white"
                      : "bg-slate-100 text-slate-500 group-hover:bg-sky-100 group-hover:text-[#28A8DF]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span
                  className={`text-sm font-bold ${selected ? "text-slate-900" : "text-slate-800"}`}
                >
                  {option.label}
                </span>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-500">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
