import type { GameState, TimeOfDay } from "./types";
import { npcById, DISTRICT_META } from "./content";
import { todFromHour } from "./time";

/** Where an NPC tends to stand this time of day (MVP Freelia). */
export function npcDistrict(npcId: string, tod: TimeOfDay): string | null {
  const table: Record<string, Record<TimeOfDay, string | null>> = {
    npc_quefeng: { dawn: "wing_yard", noon: "wing_yard", dusk: "wing_yard", night: "grass_inn" },
    npc_luhua: { dawn: "grass_inn", noon: "grass_inn", dusk: "grass_inn", night: "grass_inn" },
    npc_tieqian: {
      dawn: "forge_clamp",
      noon: "forge_clamp",
      dusk: "forge_clamp",
      night: "night_well_alley",
    },
    npc_jingchuan: {
      dawn: "clinic_mirror",
      noon: "clinic_mirror",
      dusk: "clinic_mirror",
      night: "clinic_mirror",
    },
    npc_mobei: { dawn: "reed_market", noon: "reed_market", dusk: "reed_market", night: null },
    npc_chisha: {
      dawn: "amber_gate_north",
      noon: "amber_gate_north",
      dusk: "grass_inn",
      night: "grass_inn",
    },
    npc_taixu: { dawn: "amber_gate_north", noon: "wild_plain", dusk: "reed_market", night: null },
    npc_ling_xiaoman: { dawn: "grass_inn", noon: "reed_market", dusk: "reed_market", night: "grass_inn" },
    npc_jingdi: { dawn: null, noon: null, dusk: "night_well_alley", night: "night_well_alley" },
    npc_asui: { dawn: "tamer_row", noon: "tamer_row", dusk: "tamer_row", night: null },
    npc_shian: {
      dawn: "watch_keep",
      noon: "amber_gate_north",
      dusk: "watch_keep",
      night: "watch_keep",
    },
    npc_huiya: { dawn: "wing_yard", noon: "broken_wing", dusk: "wild_plain", night: "grass_inn" },
  };
  return table[npcId]?.[tod] ?? null;
}

export function npcsHere(state: GameState): string[] {
  const tod = todFromHour(state.world.hourOfDay);
  const here = state.world.districtId;
  return (
    [
      "npc_quefeng",
      "npc_luhua",
      "npc_tieqian",
      "npc_jingchuan",
      "npc_mobei",
      "npc_chisha",
      "npc_taixu",
      "npc_ling_xiaoman",
      "npc_jingdi",
      "npc_asui",
      "npc_shian",
      "npc_huiya",
    ] as const
  ).filter((id) => {
    if (id === "npc_huiya" && state.flags.huiya_left) return false;
    return npcDistrict(id, tod) === here;
  });
}

export function npcLabel(id: string, talked: boolean): string {
  const n = npcById(id);
  if (!n) return id;
  if (id === "npc_quefeng" && !talked) return "飞行教官";
  return n.name_zh;
}

export function presentHint(id: string): string {
  const n = npcById(id);
  return n ? `${n.name_zh}　${n.role}` : id;
}

export function districtOutdoor(id: string): boolean {
  return DISTRICT_META[id]?.outdoor ?? true;
}
