import { SAVE_SCHEMA, type CreatePayload, type GameState } from "./types";
import { onboarding, raceById } from "./content";

function clampName(name: string): string {
  return name.trim().slice(0, 16);
}

export function createNewGame(payload: CreatePayload, seed = 482716): GameState {
  const hud = onboarding.hudExample;
  const race = raceById(payload.race) ?? raceById("cait_sith");
  let yrd = hud.lan;
  if (payload.origin === "merchant") yrd = 120;
  if (payload.origin === "casual") yrd = 100;
  if (payload.origin === "tamer_apprentice") yrd = 72;
  if (payload.origin === "craft_apprentice") yrd = 64;
  if (payload.origin === "raid_hopeful") yrd = 68;
  if (payload.origin === "mercenary") yrd = 90;

  const portraitId =
    payload.race === "sylph" ? "tpl_sylph_novice" : "tpl_cait_sith_novice";

  return {
    schema: SAVE_SCHEMA,
    seed,
    rng: seed,
    seq: 1,
    screen: "login",
    player: {
      name: clampName(payload.name) || "未命名",
      race: race?.id ?? "cait_sith",
      origin: payload.origin,
      era: payload.era,
      ageLook: payload.ageLook,
      gender: payload.gender,
      birthplace: payload.birthplace,
      irl: payload.irl,
      affinity: payload.affinity,
      traits: payload.traits,
      goal: payload.goal,
      simStyle: payload.simStyle,
      portraitId,
      hp: hud.hp,
      hpMax: 100,
      mp: hud.mp,
      mpMax: 80,
      sta: hud.sta,
      staMax: 100,
      sat: 78,
      satMax: 100,
      yrd,
      dur: 100,
      flightSkill: 0,
      flightCount: 0,
      heightFt: 0,
      flying: false,
      flightMode: "ground",
    },
    world: {
      year: 7,
      monthIndex: 0,
      day: 1,
      hourOfDay: 6.2,
      totalHours: 6.2,
      weather: "clear",
      locationId: onboarding.startLocation,
      districtId: onboarding.startDistrict,
      danger: hud.danger,
      priceIndex: 1,
      raidStatus: "cloud_ring_3_stalled",
      monthsPassed: 0,
    },
    flags: {},
    causal: [],
    log: [],
    intel: [],
    inventory: {
      fishGearUntilHour: 0,
      feed: payload.origin === "tamer_apprentice" ? 1 : 0,
      bedPaidUntilHour: 0,
    },
    combat: null,
    settings: { llmEnabled: false },
  };
}

export function validateCreate(p: CreatePayload): string | null {
  if (!p.race) return "未选种族。";
  if (!p.name.trim()) return "未填名。";
  return null;
}
