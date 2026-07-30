/** Demo booking helpers — weekdays only, shared slot occupancy via localStorage. */

export const DEMO_TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:30 AM",
  "02:00 PM",
  "03:30 PM",
  "05:00 PM",
] as const;

export type DemoTimeSlot = (typeof DEMO_TIME_SLOTS)[number];

const BOOKED_SLOTS_KEY = "saasa:employer-demo-booked-slots";

export type BookedSlotsMap = Record<string, string[]>;

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isPastDate(date: Date, today = startOfDay(new Date())): boolean {
  return startOfDay(date) < today;
}

/** Weekdays from today through ~8 weeks ahead are bookable. */
export function isDateAvailable(date: Date, today = startOfDay(new Date())): boolean {
  if (isWeekend(date) || isPastDate(date, today)) return false;
  const max = new Date(today);
  max.setDate(max.getDate() + 56);
  return startOfDay(date) <= max;
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatLongDate(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function readBookedSlots(): BookedSlotsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BOOKED_SLOTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as BookedSlotsMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function markSlotBooked(isoDate: string, time: string) {
  if (typeof window === "undefined") return;
  const map = readBookedSlots();
  const existing = new Set(map[isoDate] || []);
  existing.add(time);
  map[isoDate] = Array.from(existing);
  window.localStorage.setItem(BOOKED_SLOTS_KEY, JSON.stringify(map));
}

export function getAvailableSlotsForDate(isoDate: string, booked: BookedSlotsMap): DemoTimeSlot[] {
  const taken = new Set(booked[isoDate] || []);
  return DEMO_TIME_SLOTS.filter((slot) => !taken.has(slot));
}

export function buildCalendarCells(month: Date): Array<Date | null> {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startPad = first.getDay(); // Sunday = 0
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, monthIndex, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function composeDemoOutcome(parts: {
  outcome: string;
  preferredDate: string;
  preferredTime: string;
}): string {
  const lines: string[] = [];
  if (parts.preferredDate && parts.preferredTime) {
    lines.push(
      `[demo-slot:${parts.preferredDate}|${parts.preferredTime}]`,
      `Preferred demo: ${formatLongDate(parts.preferredDate)} at ${parts.preferredTime}`,
    );
  }
  if (parts.outcome.trim()) lines.push(`Outcome: ${parts.outcome.trim()}`);
  return lines.join("\n");
}
