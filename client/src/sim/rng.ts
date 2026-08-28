/** Deterministic mulberry32; state is the current seed integer. */
export function nextRng(state: number): { value: number; state: number } {
  let a = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: a };
}

export function roll(state: number): { n: number; state: number } {
  const r = nextRng(state);
  return { n: r.value, state: r.state };
}

export function pick<T>(state: number, list: T[]): { item: T; state: number } {
  const r = nextRng(state);
  const item = list[Math.floor(r.value * list.length)] ?? list[0];
  return { item, state: r.state };
}
