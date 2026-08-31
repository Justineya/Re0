import type { GameState } from "./types";
import { pick, roll } from "./rng";
import { logEntry, monthNews } from "./narrative";

const NEWS_POOL = [
  { grade: "rumor" as const, text: "有人说云环第四层已经有人上去。日期对不上。" },
  { grade: "npc_told" as const, text: "驿站文书：攻略营地申请加急合金，未获批满额。" },
  { grade: "rumor" as const, text: "市集传言旧渠深处的门会自己响。卫队说是风。" },
  { grade: "eyewitness" as const, text: "你所在的津，饲料袋上的价签被改过一次。" },
];

function clampPrice(n: number): number {
  return Math.max(0.82, Math.min(1.45, Math.round(n * 100) / 100));
}

export function applyMonthTick(state: GameState, months: number): void {
  for (let i = 0; i < months; i += 1) {
    const prev = state.world.priceIndex;
    const r = roll(state.rng);
    state.rng = r.state;
    // Additive drift, slight upward bias so shops actually feel different.
    let delta = Math.round((0.018 + (r.n - 0.32) * 0.09) * 100) / 100;
    if (delta === 0) delta = r.n >= 0.5 ? 0.02 : -0.01;
    state.world.priceIndex = clampPrice(prev + delta);
    if (state.world.priceIndex >= 1.05) state.flags.market_tight = 1;
    else if (state.world.priceIndex < 0.98) state.flags.market_tight = 0;

    const w = roll(state.rng);
    state.rng = w.state;
    const weather = pick(state.rng, ["clear", "wind", "fog", "rain", "clear", "clear", "storm"]);
    state.rng = weather.state;
    state.world.weather = weather.item;
    if (state.world.weather === "storm" && state.player.flying) {
      state.player.flying = false;
      state.player.heightFt = 0;
      state.player.flightMode = "ground";
    }
    const news = monthNews(state, prev);
    for (const text of news) {
      state.log.push(logEntry(state, { kind: "news", text, grade: "npc_told", beat: "month" }));
    }
    const extra = NEWS_POOL[state.world.monthsPassed % NEWS_POOL.length];
    if (extra) {
      state.intel.push({
        id: `i${state.seq + 1}`,
        hour: state.world.totalHours,
        grade: extra.grade,
        source: "月报",
        text: extra.text,
      });
      state.log.push(
        logEntry(state, {
          kind: "news",
          grade: extra.grade,
          text: extra.text,
          beat: "month",
        }),
      );
    }
  }
}
