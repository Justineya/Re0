import type { GameState } from "./types";
import { pick, roll } from "./rng";
import { logEntry, monthNews } from "./narrative";

const NEWS_POOL = [
  { grade: "rumor" as const, text: "有人说云环第四层已经有人上去。日期对不上。" },
  { grade: "npc_told" as const, text: "驿站文书：攻略营地申请加急合金，未获批满额。" },
  { grade: "rumor" as const, text: "市集传言旧渠深处的门会自己响。卫队说是风。" },
  { grade: "eyewitness" as const, text: "你所在的津，饲料袋上的价签被改过一次。" },
];

export function applyMonthTick(state: GameState, months: number): void {
  for (let i = 0; i < months; i += 1) {
    const r = roll(state.rng);
    state.rng = r.state;
    const delta = 0.96 + r.n * 0.08;
    state.world.priceIndex = Math.round(state.world.priceIndex * delta * 100) / 100;
    const w = roll(state.rng);
    state.rng = w.state;
    const weather = pick(state.rng, ["clear", "wind", "fog", "rain", "clear", "clear"]);
    state.rng = weather.state;
    state.world.weather = weather.item;
    if (state.world.weather === "storm" && state.player.flying) {
      state.player.flying = false;
      state.player.heightFt = 0;
      state.player.flightMode = "ground";
    }
    const news = monthNews(state);
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
