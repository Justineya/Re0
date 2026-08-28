import { SAVE_SCHEMA, type GameState } from "../sim/types";

export const STORAGE_KEY = "alo.mvp.save.v1";

export function serialize(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

export function parseSave(raw: string): GameState {
  const data = JSON.parse(raw) as GameState;
  if (!data || data.schema !== SAVE_SCHEMA) {
    throw new Error("存档版本不匹配。");
  }
  if (!data.player || !data.world) throw new Error("存档损坏。");
  return data;
}

export function saveToLocal(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, serialize(state));
}

export function loadFromLocal(): GameState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return parseSave(raw);
  } catch {
    return null;
  }
}

export function hasLocalSave(): boolean {
  return Boolean(localStorage.getItem(STORAGE_KEY));
}

export function downloadSave(state: GameState): void {
  const blob = new Blob([serialize(state)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `alo-save-${state.player.name || "slot"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readSaveFile(file: File): Promise<GameState> {
  const text = await file.text();
  return parseSave(text);
}
