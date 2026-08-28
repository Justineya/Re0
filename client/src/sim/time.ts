import type { GameState, TimeOfDay } from "./types";
import { MONTHS } from "./content";

export const DAYS_PER_MONTH = 28;

export function todFromHour(hourOfDay: number): TimeOfDay {
  if (hourOfDay >= 5 && hourOfDay < 11) return "dawn";
  if (hourOfDay >= 11 && hourOfDay < 16) return "noon";
  if (hourOfDay >= 16 && hourOfDay < 20) return "dusk";
  return "night";
}

export const TOD_ZH: Record<TimeOfDay, string> = {
  dawn: "晨",
  noon: "午",
  dusk: "暮",
  night: "夜",
};

export function calendarLabel(world: GameState["world"]): string {
  const month = MONTHS[world.monthIndex % MONTHS.length];
  return `岚历 ${world.year}年·${month} ${world.day}日　${TOD_ZH[todFromHour(world.hourOfDay)]}`;
}

export function clockLabel(world: GameState["world"]): string {
  const h = Math.floor(world.hourOfDay);
  const m = Math.round((world.hourOfDay - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type TimeAdvance = {
  crossedMonth: boolean;
  months: number;
};

export function applyHours(state: GameState, hours: number): TimeAdvance {
  if (hours <= 0) return { crossedMonth: false, months: 0 };
  const w = state.world;
  let remaining = hours;
  let months = 0;
  w.totalHours += hours;
  w.hourOfDay += remaining;
  while (w.hourOfDay >= 24) {
    w.hourOfDay -= 24;
    w.day += 1;
    if (w.day > DAYS_PER_MONTH) {
      w.day = 1;
      w.monthIndex += 1;
      months += 1;
      if (w.monthIndex >= MONTHS.length) {
        w.monthIndex = 0;
        w.year += 1;
      }
    }
  }
  if (months > 0) {
    w.monthsPassed += months;
  }
  return { crossedMonth: months > 0, months };
}
