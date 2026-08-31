import racesJson from "@data/races.json";
import locationsJson from "@data/locations.json";
import npcsJson from "@data/npcs.json";
import onboardingJson from "@data/onboarding-beats.json";
import portraitsJson from "@data/portrait-templates.json";

export const racesData = racesJson;
export const locationsData = locationsJson;
export const npcsData = npcsJson;
export const onboarding = onboardingJson;
export const portraitsData = portraitsJson;

export type RaceRec = (typeof racesJson.races)[number];
export type NpcRec = (typeof npcsJson.npcs)[number];
export type LocRec = (typeof locationsJson.locations)[number];

export const MONTHS = [
  "芽风月",
  "青叶月",
  "金芒月",
  "雨鳞月",
  "炎翼月",
  "暮萤月",
  "霜羽月",
  "雪翎月",
  "深根月",
  "雾石月",
  "星潮月",
  "归巢月",
] as const;

export const ERAS = [
  { id: "era_old_eve", name: "旧ALO事件前夜" },
  { id: "era_new_alo", name: "新生ALO开服初期", default: true },
  { id: "era_race_war", name: "种族战争激化期" },
  { id: "era_tree_stall", name: "世界树攻略停滞期", recommended: true },
  { id: "era_sao_leak", name: "旧SAO残片扩散期" },
  { id: "era_guild_rule", name: "公会联合统治期" },
  { id: "era_custom", name: "自定义（高级）" },
] as const;

export const ORIGINS = [
  { id: "solo_novice", name: "新手独行" },
  { id: "craft_apprentice", name: "工匠学徒" },
  { id: "merchant", name: "商人" },
  { id: "info_broker", name: "情报贩子" },
  { id: "guild_newbie", name: "公会新人" },
  { id: "raid_hopeful", name: "攻略组候补", note: "只是想当，没有内定席" },
  { id: "mercenary", name: "佣兵" },
  { id: "tamer_apprentice", name: "驯兽师学徒", default: true },
  { id: "casual", name: "休闲玩家" },
  { id: "cocoon_related_flavor_only", name: "旧SAO相关者", note: "仅背景，无额外能力" },
  { id: "custom", name: "自定义" },
] as const;

export const BIRTHPLACES = [
  { id: "capital", name: "首都" },
  { id: "freelia", name: "弗莉莉亚", default: true },
  { id: "neutral", name: "其他中立城" },
] as const;

export const AFFINITIES = [
  { id: "wind", name: "风" },
  { id: "fire", name: "火" },
  { id: "water", name: "水" },
  { id: "earth", name: "土" },
  { id: "dark", name: "暗" },
  { id: "illusion", name: "幻" },
  { id: "music", name: "音" },
  { id: "heal", name: "愈" },
  { id: "forge", name: "锻" },
  { id: "balanced", name: "均衡", default: true },
  { id: "random", name: "随机" },
] as const;

export const SIM_STYLES = [
  { id: "daily", name: "日常", default: true },
  { id: "adventure", name: "冒险" },
  { id: "politics", name: "政治" },
  { id: "sao_investigate", name: "旧SAO调查" },
  { id: "mixed", name: "混合" },
] as const;

export const GENDERS = ["不公开", "女性", "男性", "中性"] as const;

export const DISTRICT_META: Record<
  string,
  { name: string; locationId: string; outdoor: boolean; hint: string }
> = {
  wing_yard: {
    name: "试飞场",
    locationId: "loc_amber_crossing",
    outdoor: true,
    hint: "木桩、限高四十尺、世界树只是柱影",
  },
  grass_inn: {
    name: "草尾客栈",
    locationId: "loc_amber_crossing",
    outdoor: false,
    hint: "床、粥、渔具、闲话",
  },
  reed_market: {
    name: "弗莉莉亚市集",
    locationId: "loc_amber_crossing",
    outdoor: true,
    hint: "板报、摊位、真假消息一起跑",
  },
  amber_gate_north: {
    name: "北驿门",
    locationId: "loc_amber_crossing",
    outdoor: true,
    hint: "通往弗莉莉亚北原",
  },
  tamer_row: {
    name: "驯兽街",
    locationId: "loc_amber_crossing",
    outdoor: true,
    hint: "饲料与叫声",
  },
  clinic_mirror: {
    name: "镜川诊所",
    locationId: "loc_amber_crossing",
    outdoor: false,
    hint: "摔伤与疲劳",
  },
  forge_clamp: {
    name: "钳炉工房",
    locationId: "loc_amber_crossing",
    outdoor: false,
    hint: "DUR 到 0 是废铁",
  },
  night_well_alley: {
    name: "影巷",
    locationId: "loc_amber_crossing",
    outdoor: true,
    hint: "井底出摊的时段才热闹",
  },
  watch_keep: {
    name: "卫所",
    locationId: "loc_amber_crossing",
    outdoor: true,
    hint: "北门数字要好看",
  },
  south_moss_gate: {
    name: "南苔门",
    locationId: "loc_amber_crossing",
    outdoor: true,
    hint: "南林缘 / 旧渠方向",
  },
  wild_plain: {
    name: "北原草径",
    locationId: "loc_reedwind_wild",
    outdoor: true,
    hint: "危险度 1 · 风鼠与野羊",
  },
  broken_wing: {
    name: "折翼碑",
    locationId: "loc_reedwind_wild",
    outdoor: true,
    hint: "灰芽可能卡在这儿",
  },
  oar_bay: {
    name: "折桨湾",
    locationId: "loc_reedwind_wild",
    outdoor: true,
    hint: "钓鱼时世界不会暂停",
  },
  moss_edge: {
    name: "南林缘",
    locationId: "loc_mossshadow_edge",
    outdoor: true,
    hint: "夜间危险度升高",
  },
  canal_mouth: {
    name: "旧渠入口",
    locationId: "loc_old_canal",
    outdoor: false,
    hint: "危险度 2 · 禁飞 · 非副本 · 可离开",
  },
};

/** Shop prices follow the monthly priceIndex (already used by pay()). */
export function pricedYrd(priceIndex: number, base: number): number {
  return Math.max(1, Math.round(base * priceIndex));
}

export const ADJACENT: Record<string, string[]> = {
  wing_yard: ["reed_market", "grass_inn", "amber_gate_north"],
  grass_inn: ["wing_yard", "reed_market", "tamer_row", "oar_bay"],
  reed_market: [
    "wing_yard",
    "grass_inn",
    "amber_gate_north",
    "tamer_row",
    "forge_clamp",
    "clinic_mirror",
    "watch_keep",
    "south_moss_gate",
    "night_well_alley",
  ],
  amber_gate_north: ["reed_market", "wing_yard", "watch_keep", "wild_plain"],
  tamer_row: ["grass_inn", "reed_market"],
  clinic_mirror: ["reed_market"],
  forge_clamp: ["reed_market", "night_well_alley"],
  night_well_alley: ["reed_market", "forge_clamp"],
  watch_keep: ["reed_market", "amber_gate_north"],
  south_moss_gate: ["reed_market", "moss_edge", "canal_mouth"],
  wild_plain: ["amber_gate_north", "broken_wing", "oar_bay"],
  broken_wing: ["wild_plain", "oar_bay"],
  oar_bay: ["wild_plain", "broken_wing", "grass_inn"],
  moss_edge: ["south_moss_gate", "canal_mouth"],
  canal_mouth: ["moss_edge", "south_moss_gate"],
};

export function raceById(id: string): RaceRec | undefined {
  return racesJson.races.find((r) => r.id === id);
}

export function npcById(id: string): NpcRec | undefined {
  return npcsJson.npcs.find((n) => n.id === id);
}

export function locById(id: string): LocRec | undefined {
  return locationsJson.locations.find((l) => l.id === id);
}

export function districtName(id: string): string {
  return DISTRICT_META[id]?.name ?? id;
}

export function locationName(id: string): string {
  return locById(id)?.name_zh ?? id;
}

export const COSTS = {
  bed: 8,
  gear: 3,
  repair: 12,
  repairApprentice: 9,
  foodDry: 4,
  foodSoup: 6,
  rumor: 15,
  feed: 5,
  helpHuiya: 8,
} as const;
