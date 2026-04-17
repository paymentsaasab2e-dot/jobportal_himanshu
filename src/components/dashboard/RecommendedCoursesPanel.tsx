import Image from "next/image";
import { ArrowUpRight, BadgeCheck, Clock3, Star } from "lucide-react";

import DashboardPanel from "./DashboardPanel";
import type { DashboardCourse } from "./dashboard-types";

interface RecommendedCoursesPanelProps {
  courses: DashboardCourse[];
  loading: boolean;
  onBrowseAll: () => void;
  onOpenCourse: (courseId: string) => void;
}

const THUMBNAIL_THEMES = [
  {
    start: "#28A8E1",
    end: "#28A8DF",
    accent: "#FC9620",
    overlay: "rgba(255,255,255,0.18)",
  },
  {
    start: "#28A8DF",
    end: "#28A8E1",
    accent: "#FC9620",
    overlay: "rgba(255,255,255,0.16)",
  },
  {
    start: "#FC9620",
    end: "#28A8E1",
    accent: "#28A8DF",
    overlay: "rgba(255,255,255,0.18)",
  },
] as const;

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function splitTitleForThumbnail(title: string) {
  const words = title.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= 18) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
    currentLine = word;

    if (lines.length === 1) {
      break;
    }
  }

  if (currentLine && lines.length < 2) {
    lines.push(currentLine);
  }

  const consumedWords = lines.join(" ").split(/\s+/).filter(Boolean).length;
  if (consumedWords < words.length && lines[1]) {
    lines[1] = `${lines[1].slice(0, 15)}...`;
  }

  return [lines[0] || title, lines[1] || ""] as const;
}

function getThumbnailBadge(title: string) {
  const normalized = title.toLowerCase();

  if (normalized.includes("resume")) return "Resume Lab";
  if (
    normalized.includes("javascript") ||
    normalized.includes("typescript") ||
    normalized.includes("skill") ||
    normalized.includes("sprint")
  ) {
    return "Skill Sprint";
  }
  if (
    normalized.includes("communicate") ||
    normalized.includes("interview") ||
    normalized.includes("confidence")
  ) {
    return "Interview Edge";
  }

  return "Course Pick";
}

function createCourseThumbnailDataUri(course: DashboardCourse, index: number) {
  const theme = THUMBNAIL_THEMES[index % THUMBNAIL_THEMES.length];
  const [lineOne, lineTwo] = splitTitleForThumbnail(course.title);
  const badge = escapeSvgText(getThumbnailBadge(course.title));
  const provider = escapeSvgText(course.provider.slice(0, 24));
  const titleLineOne = escapeSvgText(lineOne);
  const titleLineTwo = escapeSvgText(lineTwo);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" fill="none">
      <defs>
        <linearGradient id="bg" x1="72" y1="36" x2="728" y2="414" gradientUnits="userSpaceOnUse">
          <stop stop-color="${theme.start}" />
          <stop offset="1" stop-color="${theme.end}" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" rx="34" fill="url(#bg)" />
      <circle cx="656" cy="84" r="136" fill="${theme.accent}" opacity="0.22" />
      <circle cx="118" cy="346" r="118" fill="white" opacity="0.08" />
      <rect x="48" y="48" width="172" height="38" rx="19" fill="white" fill-opacity="0.14" />
      <text x="72" y="73" fill="white" fill-opacity="0.95" font-size="18" font-weight="700" font-family="Inter, Plus Jakarta Sans, Arial, sans-serif" letter-spacing="1.2">
        ${badge}
      </text>
      <rect x="48" y="126" width="314" height="194" rx="26" fill="${theme.overlay}" stroke="rgba(255,255,255,0.22)" />
      <rect x="78" y="154" width="142" height="14" rx="7" fill="white" fill-opacity="0.86" />
      <rect x="78" y="184" width="198" height="10" rx="5" fill="white" fill-opacity="0.30" />
      <rect x="78" y="207" width="166" height="10" rx="5" fill="white" fill-opacity="0.24" />
      <rect x="78" y="240" width="82" height="56" rx="18" fill="white" fill-opacity="0.14" />
      <rect x="178" y="240" width="82" height="56" rx="18" fill="white" fill-opacity="0.10" />
      <circle cx="528" cy="158" r="58" fill="white" fill-opacity="0.12" />
      <circle cx="548" cy="148" r="20" fill="white" fill-opacity="0.92" />
      <path d="M514 158c12-14 28-21 47-21 25 0 38 10 52 27" stroke="white" stroke-opacity="0.62" stroke-width="8" stroke-linecap="round" />
      <text x="430" y="276" fill="white" font-size="34" font-weight="800" font-family="Inter, Plus Jakarta Sans, Arial, sans-serif">
        <tspan x="430" dy="0">${titleLineOne}</tspan>
        ${titleLineTwo ? `<tspan x="430" dy="42">${titleLineTwo}</tspan>` : ""}
      </text>
      <text x="430" y="356" fill="white" fill-opacity="0.9" font-size="18" font-weight="600" font-family="Inter, Plus Jakarta Sans, Arial, sans-serif">
        ${provider}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getThumbnailSrc(course: DashboardCourse, index: number) {
  if (course.imageUrl?.trim()) return course.imageUrl;
  return createCourseThumbnailDataUri(course, index);
}

function CourseThumbnail({
  course,
  index,
}: {
  course: DashboardCourse;
  index: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-[16px] border border-white/80 bg-white/80 shadow-[0_10px_26px_rgba(15,23,42,0.06)]">
      <div className="relative aspect-[16/9] w-full">
        <Image
          src={getThumbnailSrc(course, index)}
          alt={`${course.title} thumbnail`}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/24 to-transparent" />

      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/88 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700 shadow-sm backdrop-blur-sm">
        <BadgeCheck className="h-3 w-3" strokeWidth={2.1} />
        {course.level}
      </span>
    </div>
  );
}

export default function RecommendedCoursesPanel({
  courses,
  loading,
  onBrowseAll,
  onOpenCourse,
}: RecommendedCoursesPanelProps) {
  return (
    <DashboardPanel className="p-3.5 sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Recommended courses
            </h2>
            <p className="mt-1 text-[13px] font-medium text-slate-500">
              Sharpen the exact skills that help your strongest matches convert.
            </p>
          </div>
          <button
            type="button"
            onClick={onBrowseAll}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 transition-all duration-200 hover:border-[rgba(40,168,225,0.24)] hover:bg-[var(--brand-primary-soft)]"
          >
            Browse library
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.1} />
          </button>
        </div>

        <div className="grid gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`course-skeleton-${index}`}
                  className="animate-pulse rounded-[20px] bg-slate-100/80 p-4"
                >
                  <div className="aspect-[16/9] rounded-[16px] bg-slate-200" />
                  <div className="mt-3 h-4 w-3/4 rounded-full bg-slate-200" />
                  <div className="mt-2 h-3 w-1/2 rounded-full bg-slate-200" />
                  <div className="mt-2 h-6 w-2/3 rounded-full bg-slate-200" />
                  <div className="mt-4 h-8 rounded-xl bg-slate-200" />
                </div>
              ))
            : courses.map((course, index) => (
                <div
                  key={course.id}
                  className="group flex flex-col rounded-[20px] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,255,0.84))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] transition-all duration-200 hover:bg-white"
                >
                  <CourseThumbnail course={course} index={index} />

                  <div className="mt-3 flex flex-1 flex-col gap-3">
                    <div>
                      <p className="text-sm font-semibold leading-6 text-slate-950">
                        {course.title}
                      </p>
                      <p className="mt-1 text-[12px] font-medium text-slate-500">
                        {course.provider}
                      </p>
                    </div>

                    <span className="inline-flex max-w-max rounded-full bg-[var(--brand-accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-accent)]">
                      {course.reasonLabel}
                    </span>

                    <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm">
                        <Clock3 className="h-3 w-3" strokeWidth={2.1} />
                        {course.duration}
                      </span>
                      {course.rating ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm">
                          <Star
                            className="h-3 w-3 text-[var(--brand-accent)]"
                            strokeWidth={2.1}
                          />
                          {course.rating.toFixed(1)}
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenCourse(course.id)}
                      className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#28A8E1] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.2)] transition-all duration-200 hover:bg-[#28A8DF]"
                    >
                      Open course
                      <ArrowUpRight
                        className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        strokeWidth={2.1}
                      />
                    </button>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </DashboardPanel>
  );
}
