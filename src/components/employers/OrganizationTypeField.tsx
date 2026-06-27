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
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor={id} className="text-sm font-semibold text-slate-900">
        Workspace type <span className="text-red-500">*</span>
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
              className={`rounded-xl border p-4 text-left transition ${
                selected
                  ? "border-violet-500 bg-violet-50/80 ring-2 ring-violet-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${selected ? "text-violet-600" : "text-slate-400"}`} />
                <span className={`text-sm font-bold ${selected ? "text-violet-900" : "text-slate-900"}`}>
                  {option.label}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
