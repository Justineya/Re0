import { ADJACENT, COSTS, DISTRICT_META, districtName, locById, pricedYrd } from "./content";
import { filterCommandsByGuide } from "./guide";
import { npcsHere, npcLabel } from "./npcs";
import { DAYS_PER_MONTH } from "./time";
import type { CommandDef, GameState } from "./types";

export function hoursToMonthEnd(state: GameState): number {
  const { day, hourOfDay } = state.world;
  const left = (DAYS_PER_MONTH - day) * 24 + (24 - hourOfDay);
  return Math.max(1, Math.round(left * 10) / 10);
}

function yrdHint(state: GameState, base: number): string {
  const n = pricedYrd(state.world.priceIndex, base);
  if (n === base) return `${base} Yrd`;
  return `${n} Yrd（物价 ${state.world.priceIndex.toFixed(2)}）`;
}

export function listCommands(state: GameState): CommandDef[] {
  if (state.screen !== "game") return [];
  const cmds: CommandDef[] = [];
  const d = state.world.districtId;
  const savedHuiya = state.causal.includes("save_huiya");

  if (state.combat) {
    cmds.push(
      { id: "c-sword", label: "短剑", hint: "耗 DUR / STA", group: "combat", action: { type: "COMBAT", choice: "sword" } },
      { id: "c-spell", label: "法术", hint: "耗 MP", group: "combat", action: { type: "COMBAT", choice: "spell" } },
      { id: "c-flee", label: "逃跑", hint: "朝安全区 · 耗 STA", group: "combat", action: { type: "COMBAT", choice: "flee" }, warn: true },
      { id: "c-bypass", label: "绕开", hint: "合法", group: "combat", action: { type: "COMBAT", choice: "bypass" } },
    );
    if (!savedHuiya) {
      cmds.push({
        id: "c-help",
        label: "帮灰芽（不打）",
        hint: `护送 / ${yrdHint(state, COSTS.helpHuiya)}`,
        group: "combat",
        action: { type: "COMBAT", choice: "help" },
      });
    }
    return cmds;
  }

  if (state.world.locationId === "loc_reedwind_wild" && d !== "oar_bay" && !state.flags.combat_resolved) {
    cmds.push(
      { id: "w-fight", label: "交战", hint: "短剑或法术", group: "combat", action: { type: "COMBAT", choice: "fight" }, warn: true },
      { id: "w-shoo", label: "驱赶", hint: "失败则交战", group: "combat", action: { type: "COMBAT", choice: "shoo" } },
      { id: "w-bypass", label: "绕开", hint: "合法", group: "combat", action: { type: "COMBAT", choice: "bypass" } },
    );
    if (!savedHuiya) {
      cmds.push({
        id: "w-help",
        label: "帮灰芽（不战斗）",
        hint: "不打也能走 · 约 0.8 时",
        group: "combat",
        action: { type: "COMBAT", choice: "help" },
      });
    }
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
    const pendingDebunk = Boolean(state.flags.bought_mobei_rumor) && !state.flags.rumor_debunked;
    cmds.push({
      id: `t-${npcId}`,
      label: `交谈 · ${npcLabel(npcId, Boolean(state.flags[`talk_${npcId}`]))}`,
      hint:
        npcId === "npc_taixu" && pendingDebunk
          ? "可求证墨碑传闻 · 约 0.25 时"
          : npcId === "npc_huiya" && savedHuiya
            ? "后勤名册 · 不是英雄"
            : undefined,
      group: "talk",
      action: { type: "TALK", npcId },
      accent: npcId === "npc_taixu" && pendingDebunk,
    });
  }

  const outdoor = DISTRICT_META[d]?.outdoor;
  const loc = locById(state.world.locationId);
  const canFly = Boolean(outdoor) && loc?.flightAllowed !== false && state.world.weather !== "storm";
  if (canFly) {
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
      { id: "e-dry", label: `干粮`, hint: `${yrdHint(state, COSTS.foodDry)} · 约 0.5 时`, group: "act", action: { type: "EAT", item: "dry" } },
      { id: "e-soup", label: `热汤`, hint: `${yrdHint(state, COSTS.foodSoup)} · 约 0.5 时`, group: "act", action: { type: "EAT", item: "soup" } },
    );
  }
  if (d === "grass_inn") {
    cmds.push({
      id: "bed",
      label: "登记床位",
      hint: `${yrdHint(state, COSTS.bed)} · 含粥`,
      group: "act",
      action: { type: "REGISTER_BED" },
    });
    cmds.push({
      id: "gear",
      label: "租渔具",
      hint: `${yrdHint(state, COSTS.gear)} / 日`,
      group: "act",
      action: { type: "RENT_GEAR" },
    });
    cmds.push({
      id: "rest-inn",
      label: "在客栈歇息",
      hint: "回 STA · 4 时",
      group: "wait",
      action: { type: "WAIT", hours: 4, inn: true },
    });
  }
  if (d === "forge_clamp") {
    cmds.push(
      { id: "rep", label: "修理", hint: `${yrdHint(state, COSTS.repair)} · 约 0.8 时`, group: "act", action: { type: "REPAIR", apprentice: false } },
      {
        id: "rep-a",
        label: "学徒价修理",
        hint: `${yrdHint(state, COSTS.repairApprentice)} · 约 3 时`,
        group: "act",
        action: { type: "REPAIR", apprentice: true },
      },
    );
  }
  if (d === "reed_market" && npcsHere(state).includes("npc_mobei")) {
    cmds.push({
      id: "rumor",
      label: "买墨碑情报",
      hint: `${yrdHint(state, COSTS.rumor)} · 传闻`,
      group: "act",
      action: { type: "BUY_RUMOR" },
      warn: true,
    });
  }
  if (d === "tamer_row") {
    cmds.push({
      id: "feed",
      label: "买一份饲料",
      hint: `${yrdHint(state, COSTS.feed)}`,
      group: "act",
      action: { type: "BUY_FEED" },
    });
  }
  if (outdoor) {
    const pending = Boolean(state.flags.bought_mobei_rumor) && !state.flags.rumor_debunked;
    cmds.push({
      id: "tree",
      label: pending ? "眺望世界树（对质传闻）" : "眺望世界树",
      hint: pending ? "亲眼所见 vs 传闻 · 约 0.15 时" : "亲眼所见仅限远影",
      group: "act",
      action: { type: "LOOK_TREE" },
      accent: pending,
    });
  }
  if (d === "oar_bay") {
    cmds.push({
      id: "gear2",
      label: "租渔具",
      hint: `${yrdHint(state, COSTS.gear)}`,
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
  if (d === "canal_mouth") {
    const runs = state.flags.canalRuns ?? 0;
    cmds.push({
      id: "canal-scour",
      label: runs ? "再搜刮一层" : "搜刮旧渠一层",
      hint: `约 2 时 · 耗 STA/DUR/HP · 材料衰减×${runs}`,
      group: "act",
      action: { type: "CANAL_SCOUR" },
      warn: true,
      accent: !runs,
    });
    cmds.push({
      id: "canal-door",
      label: "查看深层错误门",
      hint: "上锁 · 约 0.4 时 · 无钥匙",
      group: "act",
      action: { type: "CANAL_DOOR" },
    });
  }

  cmds.push(
    { id: "w4", label: "等待至下一时段", hint: "4 小时", group: "wait", action: { type: "WAIT", hours: 4 } },
    { id: "w8", label: "等到暮/夜", hint: "8 小时", group: "wait", action: { type: "WAIT", hours: 8 } },
    {
      id: "wmonth",
      label: "等到月末",
      hint: "月报 · 物价会动",
      group: "wait",
      action: { type: "WAIT", hours: hoursToMonthEnd(state) },
    },
  );

  if (!state.flags.tutorial_skipped && !state.flags.tutorial_graduated) {
    cmds.push({
      id: "skip-tut",
      label: "跳过入门引导",
      hint: "之后指令全部开放",
      group: "meta",
      action: { type: "SKIP_TUTORIAL" },
    });
  }

  return filterCommandsByGuide(state, cmds);
}
