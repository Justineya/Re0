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
    g = applyAction(g, { type: "WAIT", hours });
    expect(g.world.monthsPassed).toBeGreaterThanOrEqual(1);
    expect(g.log.some((e) => e.kind === "news")).toBe(true);
    const again = parseSave(serialize(g));
    expect(again.player.name).toBe("芦哨");
    expect(again.world.monthsPassed).toBe(g.world.monthsPassed);
    expect(again.world.districtId).toBe(g.world.districtId);
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
});
