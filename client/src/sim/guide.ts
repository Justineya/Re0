import type { CommandDef, GameState } from "./types";

export type GuideStep = {
  id: string;
  step: number;
  total: number;
  title: string;
  body: string;
  /** Command ids that should glow; empty = none */
  accentIds: string[];
  /** If set, only these command ids are shown (plus meta skip). */
  allowIds: string[] | null;
};

const TOTAL = 3;

/** Active guided lesson. Null once graduated or skipped. */
export function currentGuide(state: GameState): GuideStep | null {
  if (state.screen !== "game") return null;
  if (state.flags.tutorial_skipped || state.flags.tutorial_graduated) return null;

  if (!state.flags.first_flight) {
    return {
      id: "g_flight",
      step: 1,
      total: TOTAL,
      title: "第一步：学会飞（也学会落地）",
      body: "你现在在弗莉莉亚·试飞场。这不是聊天：请点下方黄色按钮「第一次低空巡航」。STA（精力）会下降；掉到大约两成会强制警告——翅膀不是无限的。",
      accentIds: ["f-up"],
      allowIds: ["f-up", "f-land", "f-cruise", "f-hover", "t-npc_quefeng", "tree", "skip-tut"],
    };
  }

  if (!state.flags.paid_food && !state.flags.paid_repair && !state.flags.registered_bed) {
    const atInn = state.world.districtId === "grass_inn";
    return {
      id: "g_economy",
      step: 2,
      total: TOTAL,
      title: "第二步：花钱活着",
      body: atInn
        ? "到了草尾客栈。点「热汤」或「登记床位」——Yrd 会减少，STA/饱食会回来。游戏里没有免费午餐。"
        : "飞完了。下一步去草尾客栈：在下方「移动」里点「前往草尾客栈」，然后吃饭或开房。先认清钱和体力，再谈冒险。",
      accentIds: atInn ? ["e-soup", "bed"] : ["m-grass_inn"],
      allowIds: atInn
        ? ["e-dry", "e-soup", "bed", "rest-inn", "t-npc_luhua", "m-wing_yard", "m-reed_market", "m-forge_clamp", "skip-tut"]
        : [
            "m-grass_inn",
            "m-reed_market",
            "m-forge_clamp",
            "m-amber_gate_north",
            "t-npc_quefeng",
            "f-up",
            "f-cruise",
            "f-land",
            "skip-tut",
          ],
    };
  }

  if (!state.flags.bought_mobei_rumor) {
    const atMarket = state.world.districtId === "reed_market";
    return {
      id: "g_rumor",
      step: 3,
      total: TOTAL,
      title: "第三步：听一句假新闻",
      body: atMarket
        ? "点「买墨碑情报」（入门时即使他不在摊也能买到这一课）。日志会标【传闻】——不是亲眼所见。若按钮没有，可先「等待」到白天。"
        : "钱和体力你已经摸过了。点「前往弗莉莉亚市集」，再买墨碑的假新闻。学会分辨传闻。",
      accentIds: atMarket ? ["rumor"] : ["m-reed_market"],
      allowIds: atMarket
        ? [
            "rumor",
            "t-npc_mobei",
            "t-npc_ling_xiaoman",
            "t-npc_taixu",
            "e-dry",
            "e-soup",
            "tree",
            "m-grass_inn",
            "m-wing_yard",
            "m-amber_gate_north",
            "w4",
            "w8",
            "skip-tut",
          ]
        : [
            "m-reed_market",
            "m-grass_inn",
            "m-wing_yard",
            "m-forge_clamp",
            "m-amber_gate_north",
            "t-npc_luhua",
            "e-soup",
            "e-dry",
            "bed",
            "w4",
            "w8",
            "skip-tut",
          ],
    };
  }

  return null;
}

export function guideJustFinished(state: GameState): boolean {
  return Boolean(
    state.flags.first_flight &&
      (state.flags.paid_food || state.flags.paid_repair || state.flags.registered_bed) &&
      state.flags.bought_mobei_rumor &&
      !state.flags.tutorial_graduated &&
      !state.flags.tutorial_skipped,
  );
}

export function filterCommandsByGuide(state: GameState, cmds: CommandDef[]): CommandDef[] {
  const g = currentGuide(state);
  if (!g || !g.allowIds) return cmds;
  const allow = new Set(g.allowIds);
  return cmds
    .filter((c) => allow.has(c.id))
    .map((c) => (g.accentIds.includes(c.id) ? { ...c, accent: true } : { ...c, accent: false }));
}

export function freePlayBlurb(): string {
  return "入门三步完成。没有主线逼你攻略世界树。南苔门可下旧渠（禁飞、材料会衰减）；墨碑的假新闻可以用远影或苔须对质；等到月末物价会动。";
}

export function softObjectives(state: GameState): { title: string; body: string } | null {
  if (state.screen !== "game") return null;
  if (!state.flags.tutorial_graduated && !state.flags.tutorial_skipped) return null;
  const lines: string[] = [];
  if (state.flags.bought_mobei_rumor && !state.flags.rumor_debunked) {
    lines.push("· 对质墨碑：室外点「眺望世界树」，或等到苔须在场再交谈。对照【传闻】和【亲眼所见】/【NPC告知】。");
  }
  if (!state.flags.canalRuns) {
    lines.push("· 旧渠一层：南苔门 → 南林缘（或直接从南苔门）→ 旧渠入口。禁飞、危险度 2、可随时离开。重复搜刮会衰减。");
  }
  if ((state.world.monthsPassed ?? 0) === 0) {
    lines.push("· 等到月末：价格指数会变，饲料和修理跟涨。若帮过灰芽，月报会写后勤名册。");
  }
  if (lines.length === 0) {
    return { title: "没有主线逼你", body: freePlayBlurb() };
  }
  return { title: "软目标（可忽略）", body: lines.join("\n") };
}
