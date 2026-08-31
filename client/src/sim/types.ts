export const SAVE_SCHEMA = "alo.save.v1" as const;

export type IntelGrade = "eyewitness" | "npc_told" | "rumor";
export type TimeOfDay = "dawn" | "noon" | "dusk" | "night";
export type ScreenId = "title" | "create" | "login" | "game" | "settings";
export type FlightMode = "ground" | "cruise" | "hover";

export type CreatePayload = {
  name: string;
  race: string;
  origin: string;
  era: string;
  ageLook: string;
  gender: string;
  birthplace: string;
  irl: string;
  affinity: string;
  traits: string;
  goal: string;
  simStyle: string;
};

export type LogEntry = {
  id: string;
  hour: number;
  grade?: IntelGrade;
  speaker?: string;
  speakerId?: string;
  kind: "narrative" | "system" | "news" | "hud";
  text: string;
  beat?: string;
};

export type IntelEntry = {
  id: string;
  hour: number;
  grade: IntelGrade;
  source: string;
  text: string;
};

export type CombatState = {
  enemyId: "wind_rat" | "reed_sheep";
  enemyName: string;
  enemyHp: number;
  enemyHpMax: number;
  turn: number;
};

export type PlayerState = {
  name: string;
  race: string;
  origin: string;
  era: string;
  ageLook: string;
  gender: string;
  birthplace: string;
  irl: string;
  affinity: string;
  traits: string;
  goal: string;
  simStyle: string;
  portraitId: string;
  hp: number;
  hpMax: number;
  mp: number;
  mpMax: number;
  sta: number;
  staMax: number;
  sat: number;
  satMax: number;
  yrd: number;
  dur: number;
  flightSkill: number;
  flightCount: number;
  heightFt: number;
  flying: boolean;
  flightMode: FlightMode;
};

export type WorldState = {
  year: number;
  monthIndex: number;
  day: number;
  hourOfDay: number;
  totalHours: number;
  weather: string;
  locationId: string;
  districtId: string;
  danger: number;
  priceIndex: number;
  raidStatus: string;
  monthsPassed: number;
};

export type InventoryState = {
  fishGearUntilHour: number;
  feed: number;
  bedPaidUntilHour: number;
};

export type GameState = {
  schema: typeof SAVE_SCHEMA;
  seed: number;
  rng: number;
  seq: number;
  screen: ScreenId;
  player: PlayerState;
  world: WorldState;
  flags: Record<string, number>;
  causal: string[];
  log: LogEntry[];
  intel: IntelEntry[];
  inventory: InventoryState;
  combat: CombatState | null;
  settings: { llmEnabled: boolean };
};

export type GameAction =
  | { type: "NEW_GAME"; payload: CreatePayload; seed?: number }
  | { type: "FINISH_LOGIN" }
  | { type: "LOAD_STATE"; state: GameState }
  | { type: "MOVE"; locationId?: string; districtId: string }
  | { type: "TALK"; npcId: string }
  | { type: "FLIGHT"; mode: "cruise" | "hover" | "land" }
  | { type: "EAT"; item: "dry" | "soup" }
  | { type: "REPAIR"; apprentice: boolean }
  | { type: "REGISTER_BED" }
  | { type: "RENT_GEAR" }
  | { type: "BUY_RUMOR" }
  | { type: "LOOK_TREE" }
  | { type: "CANAL_SCOUR" }
  | { type: "CANAL_DOOR" }
  | { type: "BUY_FEED" }
  | { type: "FISH"; hours: 1 | 4 | 8 }
  | { type: "WAIT"; hours: number; inn?: boolean }
  | { type: "COMBAT"; choice: "fight" | "shoo" | "bypass" | "help" | "sword" | "spell" | "flee" }
  | { type: "SKIP_TUTORIAL" }
  | { type: "SET_LLM"; enabled: boolean }
  | { type: "OPEN_SCREEN"; screen: ScreenId };

export type CommandDef = {
  id: string;
  label: string;
  hint?: string;
  group: "move" | "talk" | "act" | "wait" | "combat" | "meta";
  action: GameAction;
  warn?: boolean;
  accent?: boolean;
};
