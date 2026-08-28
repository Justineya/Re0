import { ADJACENT, COSTS, DISTRICT_META, districtName } from "./content";
import { npcsHere, npcLabel } from "./npcs";
import { DAYS_PER_MONTH } from "./time";
import type { CommandDef, GameState } from "./types";

export function hoursToMonthEnd(state: GameState): number {
  const { day, hourOfDay } = state.world;
  const left = (DAYS_PER_MONTH - day) * 24 + (24 - hourOfDay);
  return Math.max(1, Math.round(left * 10) / 10);
}

export function listCommands(state: GameState): CommandDef[] {
  if (state.screen !== "game") return [];
  const cmds: CommandDef[] = [];
  const d = state.world.districtId;

  if (state.combat) {
    cmds.push(
      { id: "c-sword", label: "短剑", hint: "耗 DUR / STA", group: "combat", action: { type: "COMBAT", choice: "sword" } },
      { id: "c-spell", label: "法术", hint: "耗 MP", group: "combat", action: { type: "COMBAT", choice: "spell" } },
      { id: "c-flee", label: "逃跑", hint: "朝安全区 · 耗 STA", group: "combat", action: { type: "COMBAT", choice: "flee" }, warn: true },
      { id: "c-bypass", label: "绕开", hint: "合法", group: "combat", action: { type: "COMBAT", choice: "bypass" } },
      { id: "c-help", label: "帮灰芽（不打）", hint: `护送 / ${COSTS.helpHuiya} Yrd`, group: "combat", action: { type: "COMBAT", choice: "help" } },
    );
    return cmds;
  }

  if (state.world.locationId === "loc_reedwind_wild" && d !== "oar_bay" && !state.flags.combat_resolved) {
    cmds.push(
      { id: "w-fight", label: "交战", hint: "短剑或法术", group: "combat", action: { type: "COMBAT", choice: "fight" }, warn: true },
      { id: "w-shoo", label: "驱赶", hint: "失败则交战", group: "combat", action: { type: "COMBAT", choice: "shoo" } },
      { id: "w-bypass", label: "绕开", hint: "合法", group: "combat", action: { type: "COMBAT", choice: "bypass" } },
      { id: "w-help", label: "帮灰芽（不战斗）", hint: "不打也能走", group: "combat", action: { type: "COMBAT", choice: "help" } },
    );
  }

  const neighbors = ADJACENT[d] ?? [];
  for (const id of neighbors) {
    const meta = DISTRICT_META[id];
    if (!meta) continue;
    cmds.push({
      id: `m-${id}`,
      label: `前往${districtName(id)}`,
      hint: meta.hint,
      group: "move",
      action: { type: "MOVE", districtId: id, locationId: meta.locationId },
    });
  }

  for (const npcId of npcsHere(state)) {
    cmds.push({
      id: `t-${npcId}`,
      label: `交谈 · ${npcLabel(npcId, Boolean(state.flags[`talk_${npcId}`]))}`,
      group: "talk",
      action: { type: "TALK", npcId },
    });
  }

  const outdoor = DISTRICT_META[d]?.outdoor;
  if (outdoor && state.world.weather !== "storm") {
    if (state.player.flying) {
      cmds.push(
        { id: "f-cruise", label: "巡航", hint: "耗 STA", group: "act", action: { type: "FLIGHT", mode: "cruise" } },
        { id: "f-hover", label: "悬停", hint: "更费", group: "act", action: { type: "FLIGHT", mode: "hover" }, warn: true },
        { id: "f-land", label: "降落", group: "act", action: { type: "FLIGHT", mode: "land" }, accent: true },
      );
    } else {
      cmds.push({
        id: "f-up",
        label: state.flags.first_flight ? "起飞巡航" : "第一次低空巡航",
        hint: "STA ≤20% 必须降落",
        group: "act",
        action: { type: "FLIGHT", mode: "cruise" },
        accent: !state.flags.first_flight,
      });
    }
  }

  if (d === "grass_inn" || d === "reed_market") {
    cmds.push(
      { id: "e-dry", label: `干粮`, hint: `${COSTS.foodDry} Yrd`, group: "act", action: { type: "EAT", item: "dry" } },
      { id: "e-soup", label: `热汤`, hint: `${COSTS.foodSoup} Yrd`, group: "act", action: { type: "EAT", item: "soup" } },
    );
  }
  if (d === "grass_inn") {
    cmds.push({
      id: "bed",
      label: "登记床位",
      hint: `${COSTS.bed} Yrd · 含粥`,
      group: "act",
      action: { type: "REGISTER_BED" },
    });
    cmds.push({
      id: "gear",
      label: "租渔具",
      hint: `${COSTS.gear} Yrd / 日`,
      group: "act",
      action: { type: "RENT_GEAR" },
    });
    cmds.push({
      id: "rest-inn",
      label: "在客栈歇息",
      hint: "回 STA · 耗时",
      group: "wait",
      action: { type: "WAIT", hours: 4, inn: true },
    });
  }
  if (d === "forge_clamp") {
    cmds.push(
      { id: "rep", label: "修理", hint: `${COSTS.repair} Yrd`, group: "act", action: { type: "REPAIR", apprentice: false } },
      {
        id: "rep-a",
        label: "学徒价修理",
        hint: `${COSTS.repairApprentice} Yrd · 要等`,
        group: "act",
        action: { type: "REPAIR", apprentice: true },
      },
    );
  }
  if (d === "reed_market" && npcsHere(state).includes("npc_mobei")) {
    cmds.push({
      id: "rumor",
      label: "买墨碑情报",
      hint: `${COSTS.rumor} Yrd · 传闻`,
      group: "act",
      action: { type: "BUY_RUMOR" },
      warn: true,
    });
  }
  if (d === "tamer_row") {
    cmds.push({
      id: "feed",
      label: "买一份饲料",
      hint: `${COSTS.feed} Yrd`,
      group: "act",
      action: { type: "BUY_FEED" },
    });
  }
  if (outdoor) {
    cmds.push({
      id: "tree",
      label: "眺望世界树",
      hint: "亲眼所见仅限远影",
      group: "act",
      action: { type: "LOOK_TREE" },
    });
  }
  if (d === "oar_bay") {
    cmds.push({
      id: "gear2",
      label: "租渔具",
      hint: `${COSTS.gear} Yrd`,
      group: "act",
      action: { type: "RENT_GEAR" },
    });
    for (const h of [1, 4, 8] as const) {
      cmds.push({
        id: `fish-${h}`,
        label: `钓鱼 ${h} 小时`,
        hint: "世界继续走",
        group: "act",
        action: { type: "FISH", hours: h },
        accent: h === 8,
      });
    }
  }

  cmds.push(
    { id: "w4", label: "等待至下一时段", hint: "4 小时", group: "wait", action: { type: "WAIT", hours: 4 } },
    { id: "w8", label: "等到暮/夜", hint: "8 小时", group: "wait", action: { type: "WAIT", hours: 8 } },
    {
      id: "wmonth",
      label: "等到月末",
      hint: "月报会来",
      group: "wait",
      action: { type: "WAIT", hours: hoursToMonthEnd(state) },
    },
  );

  if (!state.flags.tutorial_skipped && !state.flags.first_flight) {
    cmds.push({
      id: "skip-tut",
      label: "跳过教程对话",
      hint: "保留 HUD 警告",
      group: "meta",
      action: { type: "SKIP_TUTORIAL" },
    });
  }

  return cmds;
}
