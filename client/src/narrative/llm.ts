import type { GameState, LogEntry } from "../sim/types";

/**
 * Optional LLM narrative hook. Default OFF.
 * Future: model returns { prose, patch }; validator rejects illegal items,
 * negative resources, unreachable locations, and rumor upgraded to eyewitness.
 */
export type LlmPatch = {
  prose: string;
  patch?: Record<string, never>;
};

export async function narrateWithLlm(
  state: GameState,
  events: LogEntry[],
  enabled: boolean,
): Promise<string | null> {
  void state;
  void events;
  if (!enabled) return null;
  return null;
}

export function validatePatch(state: GameState, patch: unknown): boolean {
  void state;
  void patch;
  return false;
}
