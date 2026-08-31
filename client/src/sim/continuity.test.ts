import { describe, expect, it } from "vitest";
import { applyAction } from "./apply";
import { createNewGame } from "./create";
import { parseSave, serialize } from "../save/persist";
import { hoursToMonthEnd, listCommands } from "./commands";

const payload = {
  name: "芦哨",
  race: "cait_sith",
  origin: "tamer_apprentice",
  era: "era_new_alo",
  ageLook: "青年",
  gender: "不公开",
  birthplace: "freelia",
  irl: "夜班",
  affinity: "balanced",
  traits: "谨慎, 嘴快, 不肯当先锋",
  goal: "先活过这个月",
  simStyle: "daily",
};

describe("ALO MVP continuity", () => {
  it("creates a Freelia cait sith and lands at the wing yard", () => {
    const g = applyAction(createNewGame(payload, 1), { type: "FINISH_LOGIN" });
    expect(g.world.districtId).toBe("wing_yard");
    expect(g.player.race).toBe("cait_sith");
    expect(g.player.yrd).toBe(72);
    expect(g.log.some((e) => e.grade === "eyewitness")).toBe(true);
  });

  it("first flight warns at ~20% STA", () => {
    let g = applyAction(createNewGame(payload, 2), { type: "FINISH_LOGIN" });
    const before = g.player.sta;
    g = applyAction(g, { type: "FLIGHT", mode: "cruise" });
    expect(g.flags.sta_warned).toBeTruthy();
    expect(g.player.sta).toBeLessThanOrEqual(20);
    expect(g.player.sta).toBeGreaterThan(0);
    expect(g.log.some((e) => String(e.text).includes("20%"))).toBe(true);
    expect(before).toBe(100);
  });

  it("inn then flight spends Yrd and still respects remaining STA", () => {
    let g = applyAction(createNewGame(payload, 3), { type: "FINISH_LOGIN" });
    g = applyAction(g, { type: "MOVE", districtId: "grass_inn" });
    const y0 = g.player.yrd;
    g = applyAction(g, { type: "EAT", item: "soup" });
    g = applyAction(g, { type: "REGISTER_BED" });
    expect(g.player.yrd).toBeLessThan(y0);
    expect(g.flags.paid_food).toBeTruthy();
    g = applyAction(g, { type: "MOVE", districtId: "wing_yard" });
    g = applyAction(g, { type: "FLIGHT", mode: "cruise" });
    expect(g.flags.sta_warned).toBeTruthy();
    const staAfterEatFlight = g.player.sta;
    g = applyAction(g, { type: "FLIGHT", mode: "cruise" });
    expect(g.player.sta).toBeLessThan(staAfterEatFlight);
  });

  it("Mobei intel is rumor, never eyewitness", () => {
    let g = applyAction(createNewGame(payload, 4), { type: "FINISH_LOGIN" });
    g = applyAction(g, { type: "MOVE", districtId: "reed_market" });
    g = applyAction(g, { type: "BUY_RUMOR" });
    const rum = g.intel.find((i) => i.source === "墨碑");
    expect(rum?.grade).toBe("rumor");
    expect(g.log.filter((e) => e.speakerId === "npc_mobei").every((e) => e.grade !== "eyewitness")).toBe(
      true,
    );
  });

  it("fishing advances time and emits the unpause line once", () => {
    let g = applyAction(createNewGame(payload, 5), { type: "FINISH_LOGIN" });
    g = applyAction(g, { type: "MOVE", districtId: "grass_inn" });
    g = applyAction(g, { type: "RENT_GEAR" });
    g = applyAction(g, { type: "MOVE", districtId: "oar_bay" });
    const t0 = g.world.totalHours;
    g = applyAction(g, { type: "FISH", hours: 4 });
    expect(g.world.totalHours).toBeGreaterThanOrEqual(t0 + 4);
    expect(g.log.some((e) => e.text.includes("没有暂停"))).toBe(true);
    const n = g.log.filter((e) => e.text.includes("没有暂停")).length;
    g = applyAction(g, { type: "FISH", hours: 1 });
    expect(g.log.filter((e) => e.text.includes("没有暂停")).length).toBe(n);
  });

  it("wild fight is skippable and help writes save_huiya", () => {
    let g = applyAction(createNewGame(payload, 6), { type: "FINISH_LOGIN" });
    g = applyAction(g, { type: "MOVE", districtId: "amber_gate_north" });
    g = applyAction(g, { type: "MOVE", districtId: "wild_plain" });
    expect(g.combat).toBeTruthy();
    g = applyAction(g, { type: "COMBAT", choice: "help" });
    expect(g.combat).toBeNull();
    expect(g.causal).toContain("save_huiya");
    expect(g.flags.combat_resolved).toBeTruthy();
  });

  it("month wait emits news and save roundtrips", () => {
    let g = applyAction(createNewGame(payload, 7), { type: "FINISH_LOGIN" });
    const hours = hoursToMonthEnd(g);
    const price0 = g.world.priceIndex;
    g = applyAction(g, { type: "WAIT", hours });
    expect(g.world.monthsPassed).toBeGreaterThanOrEqual(1);
    expect(g.log.some((e) => e.kind === "news")).toBe(true);
    expect(g.world.priceIndex).not.toBe(price0);
    expect(g.log.some((e) => e.kind === "news" && e.text.includes("→"))).toBe(true);
    const again = parseSave(serialize(g));
    expect(again.player.name).toBe("芦哨");
    expect(again.world.monthsPassed).toBe(g.world.monthsPassed);
    expect(again.world.districtId).toBe(g.world.districtId);
    expect(again.world.priceIndex).toBe(g.world.priceIndex);
  });

  it("does not hand out mythic loot on a rat", () => {
    let g = applyAction(createNewGame(payload, 8), { type: "FINISH_LOGIN" });
    g = applyAction(g, { type: "MOVE", districtId: "amber_gate_north" });
    g = applyAction(g, { type: "MOVE", districtId: "wild_plain" });
    g = applyAction(g, { type: "COMBAT", choice: "fight" });
    for (let i = 0; i < 6; i += 1) g = applyAction(g, { type: "COMBAT", choice: "sword" });
    expect(g.intel.some((i) => i.grade === "rumor")).toBe(false);
    expect(g.player.yrd).toBeLessThan(100);
    expect(Object.keys(g).join()).not.toMatch(/legendary|mythic/);
  });

  it("guided onboarding narrows commands then graduates", () => {
    let g = applyAction(createNewGame(payload, 9), { type: "FINISH_LOGIN" });
    let ids = listCommands(g).map((c) => c.id);
    expect(ids).toContain("f-up");
    expect(ids).not.toContain("wmonth");
    g = applyAction(g, { type: "FLIGHT", mode: "cruise" });
    ids = listCommands(g).map((c) => c.id);
    expect(ids).toContain("m-grass_inn");
    g = applyAction(g, { type: "MOVE", districtId: "grass_inn" });
    g = applyAction(g, { type: "EAT", item: "soup" });
    // Keep morning/noon so 墨碑在市集
    g = {
      ...g,
      world: { ...g.world, hourOfDay: 11, day: g.world.day },
    };
    g = applyAction(g, { type: "MOVE", districtId: "reed_market" });
    g = applyAction(g, { type: "BUY_RUMOR" });
    expect(g.flags.tutorial_graduated).toBeTruthy();
    ids = listCommands(g).map((c) => c.id);
    expect(ids).toContain("wmonth");
  });

  it("old canal is persistent with decaying loot and a locked error door", () => {
    let g = applyAction(createNewGame(payload, 11), { type: "FINISH_LOGIN" });
    g = applyAction(g, { type: "SKIP_TUTORIAL" });
    g = applyAction(g, { type: "MOVE", districtId: "reed_market" });
    g = applyAction(g, { type: "MOVE", districtId: "south_moss_gate" });
    g = applyAction(g, { type: "MOVE", districtId: "canal_mouth" });
    expect(g.world.locationId).toBe("loc_old_canal");
    expect(g.world.danger).toBe(2);
    g = applyAction(g, { type: "FLIGHT", mode: "cruise" });
    expect(g.log.some((e) => e.text.includes("不能飞"))).toBe(true);
    const y0 = g.player.yrd;
    const sta0 = g.player.sta;
    const dur0 = g.player.dur;
    g = applyAction(g, { type: "CANAL_SCOUR" });
    const loot1 = g.player.yrd - y0;
    expect(loot1).toBeGreaterThan(0);
    expect(g.flags.canalRuns).toBe(1);
    expect(g.player.sta).toBeLessThan(sta0);
    expect(g.player.dur).toBeLessThan(dur0);
    expect(g.player.hp).toBeLessThan(100);
    g = applyAction(g, { type: "CANAL_SCOUR" });
    const loot2 = g.player.yrd - y0 - loot1;
    expect(loot2).toBeLessThan(loot1);
    expect(g.flags.canal_loot_decay).toBeTruthy();
    expect(g.log.some((e) => e.text.includes("衰减"))).toBe(true);
    g = applyAction(g, { type: "CANAL_DOOR" });
    expect(g.flags.saw_error_door).toBeTruthy();
    expect(g.log.some((e) => e.text.includes("错误门") && e.text.includes("锁"))).toBe(true);
    expect(g.log.join("")).not.toMatch(/命运之子|神话钥匙已/);
    g = applyAction(g, { type: "MOVE", districtId: "moss_edge" });
    expect(g.world.districtId).toBe("moss_edge");
  });

  it("looking at the tree after Mobei rumor debunks it with grade contrast", () => {
    let g = applyAction(createNewGame(payload, 12), { type: "FINISH_LOGIN" });
    g = applyAction(g, { type: "MOVE", districtId: "reed_market" });
    g = applyAction(g, { type: "BUY_RUMOR" });
    expect(g.intel.find((i) => i.source === "墨碑")?.grade).toBe("rumor");
    g = applyAction(g, { type: "LOOK_TREE" });
    expect(g.flags.rumor_debunked).toBeTruthy();
    expect(g.log.some((e) => e.text.includes("【对照】") && e.grade === "eyewitness")).toBe(true);
    expect(g.intel.some((i) => i.grade === "eyewitness" && i.text.includes("传闻被拆穿"))).toBe(true);
  });

  it("asking Taixu after the rumor also sets rumor_debunked", () => {
    let g = applyAction(createNewGame(payload, 13), { type: "FINISH_LOGIN" });
    g = applyAction(g, { type: "SKIP_TUTORIAL" });
    g = applyAction(g, { type: "MOVE", districtId: "reed_market" });
    g = applyAction(g, { type: "BUY_RUMOR" });
    g = {
      ...g,
      world: { ...g.world, hourOfDay: 17 },
    };
    g = applyAction(g, { type: "TALK", npcId: "npc_taixu" });
    expect(g.flags.rumor_debunked).toBeTruthy();
    expect(g.log.some((e) => e.text.includes("对照") && e.grade === "npc_told")).toBe(true);
  });

  it("month news after save_huiya mentions logistics and prices actually move shop cost", () => {
    let g = applyAction(createNewGame(payload, 14), { type: "FINISH_LOGIN" });
    g = applyAction(g, { type: "SKIP_TUTORIAL" });
    g = applyAction(g, { type: "MOVE", districtId: "amber_gate_north" });
    g = applyAction(g, { type: "MOVE", districtId: "wild_plain" });
    g = applyAction(g, { type: "COMBAT", choice: "help" });
    expect(g.causal).toContain("save_huiya");
    const price0 = g.world.priceIndex;
    g = applyAction(g, { type: "WAIT", hours: hoursToMonthEnd(g) });
    expect(g.world.priceIndex).not.toBe(price0);
    expect(g.log.some((e) => e.kind === "news" && e.text.includes("后勤名册"))).toBe(true);
    expect(g.log.some((e) => e.kind === "news" && e.text.includes("→"))).toBe(true);
    g = applyAction(g, { type: "MOVE", districtId: "amber_gate_north" });
    g = applyAction(g, { type: "MOVE", districtId: "reed_market" });
    const y0 = g.player.yrd;
    g = applyAction(g, { type: "EAT", item: "soup" });
    const spent = y0 - g.player.yrd;
    expect(spent).toBeGreaterThanOrEqual(1);
    expect(spent).toBe(Math.max(1, Math.round(6 * g.world.priceIndex)));
  });
});
