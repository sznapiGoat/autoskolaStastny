import { addMinutes, format, parse } from "date-fns";

export const LESSON_DURATION = 45;
export const BUFFER_TIME = 15;
export const SLOT_INTERVAL = LESSON_DURATION + BUFFER_TIME; // 60 minutes total

export function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  let current = parse(startTime, "HH:mm", new Date());
  const end = parse(endTime, "HH:mm", new Date());

  while (current < end) {
    const slotEnd = addMinutes(current, LESSON_DURATION);
    if (slotEnd <= end) {
      slots.push(format(current, "HH:mm"));
    }
    current = addMinutes(current, SLOT_INTERVAL);
  }

  return slots;
}

export function getSlotEndTime(startTime: string): string {
  const start = parse(startTime, "HH:mm", new Date());
  const end = addMinutes(start, LESSON_DURATION);
  return format(end, "HH:mm");
}

export function formatCzechDate(date: Date | string): string {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export function formatCzechTime(time: string): string {
  return time;
}

export const DAY_NAMES_CZ = [
  "Neděle",
  "Pondělí",
  "Úterý",
  "Středa",
  "Čtvrtek",
  "Pátek",
  "Sobota",
];

export const DAY_NAMES_SHORT_CZ = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
