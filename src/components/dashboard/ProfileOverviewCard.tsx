import Image from "next/image";
import { useMemo, useRef } from "react";
import {
  Camera,
  ChevronRight,
  Mail,
  MessageCircleMore,
  Sparkles,
  Trophy,
} from "lucide-react";

import DashboardPanel from "./DashboardPanel";
import type { DashboardData } from "./dashboard-types";

interface ProfileOverviewCardProps {
  profile: DashboardData["profile"] | null;
  topSkills: DashboardData["topSkills"];
  completionPercentage: number;
  missingSections: string[];
  apiBaseUrl: string;
  isUploadingPhoto: boolean;
  onUploadPhoto: (file: File) => void;
  onOpenProfile: () => void;
  onCompleteProfile: () => void;
}

function resolveProfileImage(
  photoUrl: string | null | undefined,
  apiBaseUrl: string
) {
  if (!photoUrl || !photoUrl.trim()) return null;
  if (
    photoUrl.startsWith("data:") ||
    photoUrl.startsWith("http://") ||
    photoUrl.startsWith("https://")
  ) {
    return photoUrl;
  }

  const baseUrl = apiBaseUrl.replace("/api", "");
  const cleanPath = photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`;
  return `${baseUrl}${cleanPath}`;
}

function getProfileInitials(fullName?: string | null) {
  const parts =
    fullName
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2) || [];

  if (parts.length === 0) return "UP";

  const initials = parts
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "UP";
}

export default function ProfileOverviewCard({
  profile,
  topSkills,
  completionPercentage,
  missingSections,
  apiBaseUrl,
  isUploadingPhoto,
  onUploadPhoto,
  onOpenProfile,
  onCompleteProfile,
}: ProfileOverviewCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileImage = useMemo(
    () => resolveProfileImage(profile?.profilePhotoUrl, apiBaseUrl),
    [apiBaseUrl, profile?.profilePhotoUrl]
  );
  const profileInitials = useMemo(
    () => getProfileInitials(profile?.fullName),
    [profile?.fullName]
  );

  const visibleMissingSections = missingSections.slice(0, 3);
  const completionLabel =
    completionPercentage >= 100
      ? "Profile signal is strong"
      : `${Math.max(1, missingSections.length)} key section${
          missingSections.length === 1 ? "" : "s"
        } left`;

  return (
    <DashboardPanel className="p-3.5 sm:p-4">
      <div className="flex flex-col gap-3.5">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-visible rounded-[24px] bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.9),transparent_34%),linear-gradient(145deg,rgba(40,168,225,0.14),rgba(40,168,223,0.2))] shadow-[0_18px_34px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.88)]"
            aria-label="Update profile photo"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUploadPhoto(file);
              }}
              className="hidden"
            />

            {profileImage ? (
              <span className="relative h-full w-full overflow-hidden rounded-[24px] ring-1 ring-white/75">
                <Image
                  src={profileImage}
                  alt="Profile"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </span>
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-[24px] border border-white/70 bg-white/55 text-[22px] font-semibold uppercase tracking-[-0.04em] text-slate-600 ring-1 ring-white/80">
                {profileInitials}
              </span>
            )}

            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-[16px] border-[3px] border-white bg-[#28A8E1] text-white shadow-[0_10px_20px_rgba(40,168,225,0.24)] transition-transform duration-200 group-hover:scale-105">
              <Camera className="h-3 w-3" strokeWidth={2.05} />
            </span>

            {isUploadingPhoto ? (
              <span className="absolute inset-0 grid place-items-center bg-slate-950/35">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-b-transparent" />
              </span>
            ) : null}
          </button>

          <div className="min-w-0 space-y-1.5">
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-950">
                {profile?.fullName || "Candidate"}
              </p>
              
            </div>

            <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
              {profile?.email ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                  <Mail className="h-3 w-3" strokeWidth={2.1} />
                  {profile.email}
                </span>
              ) : null}
              {profile?.whatsappNumber ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                  <MessageCircleMore className="h-3 w-3" strokeWidth={2.1} />
                  {profile.whatsappNumber.startsWith("+")
                    ? profile.whatsappNumber
                    : `${profile.countryCode || ""}${profile.whatsappNumber}`}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-[18px] bg-[linear-gradient(135deg,rgba(40,168,225,0.1),rgba(40,168,223,0.05))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.74)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary)]">
                Profile health
              </p>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="text-lg font-semibold tracking-tight text-slate-950">
                  {completionPercentage}%
                </p>
                <p className="text-[11px] font-medium text-slate-500">{completionLabel}</p>
              </div>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/84 text-[var(--brand-accent)] shadow-[0_8px_18px_rgba(252,150,32,0.14)]">
              <Trophy className="h-4 w-4" strokeWidth={2.2} />
            </span>
          </div>

          <div className="mt-3 h-1.5 rounded-full bg-white/72">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-primary),var(--brand-secondary))] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
            />
          </div>

          {completionPercentage < 100 ? (
            <button
              type="button"
              onClick={onCompleteProfile}
              className="group mt-2.5 flex w-full items-start justify-between rounded-[15px] border border-white/70 bg-white/72 px-2.5 py-2.5 text-left shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-[rgba(252,150,32,0.26)] hover:bg-white"
            >
              <span className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-accent)]">
                  <Sparkles className="h-3 w-3" strokeWidth={2.1} />
                  Quick win
                </span>
                {visibleMissingSections.length > 0 ? (
                  <span className="mt-2 flex flex-col gap-1">
                    {visibleMissingSections.map((section, index) => (
                      <span key={section} className="flex items-center gap-1.5 text-[12px] font-medium leading-5 text-slate-600">
                        <span className="h-1 w-1 rounded-full bg-[var(--brand-accent)]" />
                        {index === 0 ? "Start with" : "Then add"} {section}
                        {index === 0 && visibleMissingSections.length > 1 && (
                          <span className="text-[10px] text-slate-400">(priority)</span>
                        )}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="mt-1 block text-[12px] font-medium leading-5 text-slate-600">
                    Add the last details to improve recruiter confidence.
                  </span>
                )}
              </span>
              <ChevronRight className="ml-3 mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--brand-primary)]" />
            </button>
          ) : null}
        </div>

        <div className="rounded-[18px] bg-slate-50/82 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Key sections left
            </p>
            <span className="text-[11px] font-semibold text-slate-400">
              {completionPercentage >= 100 ? "Ready" : completionLabel}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {visibleMissingSections.length > 0 ? (
              visibleMissingSections.map((section) => (
                <span
                  key={section}
                  className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm"
                >
                  {section}
                </span>
              ))
            ) : (
              <span className="text-[12px] font-medium text-slate-500">
                Everything critical is in place.
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Top skills</p>
            <button
              type="button"
              onClick={onOpenProfile}
              className="text-[12px] font-semibold text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-primary-strong)]"
            >
              Open profile
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(topSkills.length > 0
              ? topSkills.slice(0, 6)
              : [{ name: "Add your top skills", proficiency: "" }]).map((skill) => (
              <span
                key={skill.name}
                className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}
