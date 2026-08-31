import { ADJACENT, COSTS, DISTRICT_META, locById, raceById } from "./content";
import { createNewGame } from "./create";
import { freePlayBlurb, guideJustFinished } from "./guide";
import { applyMonthTick } from "./month";
import {
  crashProse,
  eatProse,
  fishHourLine,
  flightOk,
  flightWarn,
  landingProse,
  logEntry,
  moveProse,
  noMythic,
  rumorIntel,
  talkCopy,
} from "./narrative";
import { districtOutdoor, npcsHere } from "./npcs";
import { roll } from "./rng";
import { applyHours, todFromHour } from "./time";
import type { GameAction, GameState, LogEntry } from "./types";

function lookTreeProseLocal(): string {
  return "北面，世界树仍是淡青柱影。你看见的是远影，不是攻略进度。云环破没破，这双眼睛给不了判决。";
}

function push(state: GameState, e: Omit<LogEntry, "id" | "hour">): void {
  state.log.push(logEntry(state, e));
  if (state.log.length > 120) state.log.splice(0, state.log.length - 120);
}

function flag(state: GameState, k: string): number {
  return state.flags[k] ?? 0;
}

function setFlag(state: GameState, k: string, v = 1): void {
  state.flags[k] = v;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function pay(state: GameState, yrd: number): boolean {
  const cost = Math.max(1, Math.round(yrd * state.world.priceIndex));
  if (state.player.yrd < cost) return false;
  state.player.yrd -= cost;
  return true;
}

function satMul(state: GameState): number {
  return state.player.sat < 20 ? 0.4 : 1;
}

function regenOnGround(state: GameState, hours: number, inn: boolean): void {
  const p = state.player;
  if (p.flying) return;
  const staRate = (inn ? 18 : 6) * satMul(state);
  p.sta = clamp(p.sta + staRate * hours, 0, p.staMax);
  p.hp = clamp(p.hp + (inn ? 8 : 1) * hours, 0, p.hpMax);
  p.mp = clamp(p.mp + (inn ? 6 : 2) * hours, 0, p.mpMax);
}

function drainLiving(state: GameState, hours: number): void {
  const p = state.player;
  p.sat = clamp(p.sat - 3.2 * hours, 0, p.satMax);
  if (p.sat < 15) {
    p.sta = clamp(p.sta - 2 * hours, 0, p.staMax);
  }
}

function tickTime(state: GameState, hours: number, inn = false): void {
  drainLiving(state, hours);
  regenOnGround(state, hours, inn);
  const adv = applyHours(state, hours);
  if (adv.crossedMonth) applyMonthTick(state, adv.months);
}

function syncDanger(state: GameState): void {
  const loc = locById(state.world.locationId);
  const night = todFromHour(state.world.hourOfDay) === "night";
  let d = loc?.danger ?? 0;
  if (night && "dangerNight" in (loc ?? {}) && typeof (loc as { dangerNight?: number }).dangerNight === "number") {
    d = (loc as { dangerNight: number }).dangerNight;
  }
  if (state.world.districtId === "oar_bay") d = Math.min(d, 1);
  state.world.danger = d;
}

function land(state: GameState): void {
  state.player.flying = false;
  state.player.heightFt = 0;
  state.player.flightMode = "ground";
}

function maybeEncounter(state: GameState): void {
  if (state.combat) return;
  if (state.world.locationId !== "loc_reedwind_wild") return;
  if (flag(state, "combat_resolved")) return;
  if (state.world.districtId === "oar_bay") return;
  setFlag(state, "wild_seen");
  state.combat = {
    enemyId: "wind_rat",
    enemyName: "风鼠",
    enemyHp: 28,
    enemyHpMax: 28,
    turn: 0,
  };
  push(state, {
    kind: "system",
    beat: "b7",
    text: "草里有东西在盯你。风鼠，或者一只脾气不好的苇羊。这不是试炼场。没人给你勋章。",
    grade: "eyewitness",
  });
}

function dieToClinic(state: GameState): void {
  land(state);
  state.combat = null;
  const lossRoll = roll(state.rng);
  state.rng = lossRoll.state;
  const loss = 8 + Math.floor(lossRoll.n * 8);
  state.player.yrd = Math.max(0, state.player.yrd - loss);
  state.player.hp = 45;
  state.player.sta = 30;
  state.player.dur = clamp(state.player.dur - 10, 0, 100);
  state.world.locationId = "loc_amber_crossing";
  state.world.districtId = "clinic_mirror";
  syncDanger(state);
  push(state, {
    kind: "system",
    text: `你在诊所醒来。少了 ${loss} Yrd。雀风的声音像从试飞场飘来：「欢迎回来，还是那块牌子。」死亡不是结局。`,
    grade: "eyewitness",
  });
}

function addIntel(
  state: GameState,
  grade: "eyewitness" | "npc_told" | "rumor",
  source: string,
  text: string,
): void {
  state.seq += 1;
  state.intel.unshift({
    id: `i${state.seq}`,
    hour: state.world.totalHours,
    grade,
    source,
    text,
  });
  if (state.intel.length > 40) state.intel.length = 40;
}

function flightMul(state: GameState): number {
  const race = raceById(state.player.race);
  const cruise = race?.flight && "cruiseMul" in race.flight ? Number(race.flight.cruiseMul) : 1;
  return Number.isFinite(cruise) ? cruise : 1;
}

function skillGain(state: GameState, key: "flight" | "fish"): number {
  const count = key === "flight" ? state.player.flightCount : flag(state, "fish_count");
  if (count >= 8) return 0;
  return Math.max(0, 3 - count * 0.35);
}

function clone<T>(x: T): T {
  return structuredClone(x);
}

export function reduce(state: GameState, action: GameAction): GameState {
  if (action.type === "LOAD_STATE") return action.state;
  if (action.type === "NEW_GAME") {
    const g = createNewGame(action.payload, action.seed ?? Date.now() % 1_000_000);
    return g;
  }

  const s = clone(state);

  switch (action.type) {
    case "OPEN_SCREEN":
      s.screen = action.screen;
      return s;
    case "SET_LLM":
      s.settings.llmEnabled = action.enabled;
      push(s, {
        kind: "system",
        text: action.enabled
          ? "叙事模型钩子已打开（MVP 仍走模板；无密钥、无补丁写入）。"
          : "叙事模型关闭。模板句权威。",
      });
      return s;
    case "FINISH_LOGIN": {
      s.screen = "game";
      setFlag(s, "login_done");
      push(s, {
        kind: "narrative",
        beat: "b2",
        grade: "eyewitness",
        text: landingProse(s),
      });
      push(s, {
        kind: "narrative",
        beat: "b2",
        speaker: "飞行教官",
        speakerId: "npc_quefeng",
        grade: "npc_told",
        text: talkCopy(s, "npc_quefeng", true),
      });
      push(s, {
        kind: "hud",
        beat: "b2",
        text: "试飞场小抄\n· 点下方黄色「第一次低空巡航」\n· STA（精力）≤20% 必须降落\n· 城内限高 40 尺\n· 左侧「现在该做什么」= 当前目标",
      });
      push(s, {
        kind: "system",
        text: "入门引导已开启：一次只开放少量指令。不想学可点「跳过入门引导」。",
      });
      return s;
    }
    case "SKIP_TUTORIAL":
      setFlag(s, "tutorial_skipped");
      setFlag(s, "tutorial_graduated");
      setFlag(s, "login_done");
      s.screen = "game";
      if (s.log.length === 0) {
        push(s, { kind: "narrative", beat: "b2", grade: "eyewitness", text: landingProse(s) });
      }
      push(s, {
        kind: "system",
        text: "已跳过入门。全部指令开放。STA 警告与危险度仍在——世界不等你。",
      });
      return s;
    case "MOVE": {
      if (s.combat && s.combat.turn >= 0 && action.districtId !== "amber_gate_north") {
        push(s, { kind: "system", text: "先处理眼前的东西，或绕开、或逃。" });
        return s;
      }
      const dest = action.districtId;
      const meta = DISTRICT_META[dest];
      if (!meta) {
        push(s, { kind: "system", text: "没有这条路。" });
        return s;
      }
      const from = s.world.districtId;
      const ok = ADJACENT[from]?.includes(dest) || from === dest;
      if (!ok) {
        push(s, { kind: "system", text: "太远。先走到相邻的区。" });
        return s;
      }
      if (s.player.flying && !meta.outdoor) {
        land(s);
        push(s, { kind: "system", text: "室内禁飞。你收翅落地。" });
      }
      const hours = meta.locationId === s.world.locationId ? 0.4 : 1.2;
      s.world.districtId = dest;
      s.world.locationId = meta.locationId;
      if (!s.player.flying) s.player.sta = clamp(s.player.sta - 1.5, 0, s.player.staMax);
      tickTime(s, hours);
      syncDanger(s);
      push(s, { kind: "narrative", grade: "eyewitness", text: moveProse(dest) });
      if (dest === "wing_yard") setFlag(s, "saw_yard");
      if (dest === "grass_inn") setFlag(s, "saw_inn");
      if (dest === "reed_market") setFlag(s, "saw_market");
      if (dest === "canal_mouth") {
        setFlag(s, "saw_canal");
        if (s.player.flying) land(s);
      }
      maybeEncounter(s);
      return s;
    }
    case "TALK": {
      const here = npcsHere(s);
      if (!here.includes(action.npcId)) {
        push(s, { kind: "system", text: "这个时段，对方不在这儿。" });
        return s;
      }
      const first = !flag(s, `talk_${action.npcId}`);
      setFlag(s, `talk_${action.npcId}`);
      tickTime(s, 0.25);
      const text = talkCopy(s, action.npcId, first);
      const npc = action.npcId;
      push(s, {
        kind: "narrative",
        speakerId: npc,
        speaker: npc === "npc_quefeng" && !flag(s, "named_quefeng") ? "飞行教官" : undefined,
        grade: "npc_told",
        text,
      });
      if (npc === "npc_quefeng") {
        setFlag(s, "named_quefeng");
        setFlag(s, "heard_quefeng_rules");
      }
      if (npc === "npc_taixu") {
        setFlag(s, "asked_taixu");
        addIntel(s, "npc_told", "苔须", "营地还在。有人死了游戏里那种。没破。");
        push(s, {
          kind: "system",
          grade: "npc_told",
          beat: "b6",
          text: "情报已记：NPC告知 · 苔须。不是亲眼看见云环。",
        });
        if (flag(s, "bought_mobei_rumor") && !flag(s, "rumor_debunked")) {
          setFlag(s, "rumor_debunked");
          addIntel(s, "npc_told", "苔须", "墨碑那条「云环已破」是假的。日期对不上。");
          push(s, {
            kind: "system",
            grade: "npc_told",
            beat: "b6",
            text: "【对照】传闻（墨碑）云环已破　vs　NPC告知（苔须）没破。没有弹窗表扬你聪明，只是两条情报叠在一起。",
          });
        }
      }
      if (npc === "npc_ling_xiaoman") {
        addIntel(s, "rumor", "铃小满", "歌词里仍是三层。像唱给板报听的。");
      }
      return s;
    }
    case "FLIGHT": {
      const loc = locById(s.world.locationId);
      if (!districtOutdoor(s.world.districtId) || loc?.flightAllowed === false) {
        push(s, { kind: "system", text: "这里不能飞。" });
        return s;
      }
      if (s.world.weather === "storm") {
        push(s, { kind: "system", text: "雷暴关闭试飞。牌子上写过。" });
        return s;
      }
      if (action.mode === "land") {
        land(s);
        tickTime(s, 0.1);
        push(s, { kind: "system", grade: "eyewitness", text: "你落地。地面开始把精力还给你——很慢，而且要吃东西。" });
        return s;
      }
      const hover = action.mode === "hover";
      const mul = flightMul(s);
      let cost = (hover ? 36 : 28) * mul;
      if (!flag(s, "first_flight")) {
        cost = Math.max(cost, s.player.sta - 20);
        if (s.player.sta <= 22) cost = s.player.sta;
      } else if (s.player.sta > 35 && !flag(s, "sta_warned")) {
        cost = Math.max(cost, 18);
      }
      if (s.player.sta - cost < 0) cost = s.player.sta;
      s.player.flying = true;
      s.player.flightMode = hover ? "hover" : "cruise";
      s.player.heightFt = Math.min(40, hover ? 12 : 28);
      s.player.sta = clamp(s.player.sta - cost, 0, s.player.staMax);
      s.player.flightCount += 1;
      s.player.flightSkill += skillGain(s, "flight");
      tickTime(s, hover ? 0.4 : 0.8);
      if (s.player.sta <= 0) {
        const fall = Math.min(55, (s.player.heightFt - 8) * 1.2);
        const dmg = s.world.danger === 0 ? fall / 2 : fall;
        s.player.hp = clamp(s.player.hp - dmg, 1, s.player.hpMax);
        s.player.dur = clamp(s.player.dur - 14, 0, 100);
        setFlag(s, "crashed");
        setFlag(s, "sta_warned");
        setFlag(s, "first_flight");
        land(s);
        push(s, { kind: "narrative", beat: "b4", grade: "eyewitness", text: crashProse() });
        push(s, {
          kind: "narrative",
          speakerId: "npc_quefeng",
          speaker: "雀风",
          grade: "npc_told",
          text: talkCopy(s, "npc_quefeng", false),
        });
        return s;
      }
      if (s.player.sta <= 20 && !flag(s, "sta_warned")) {
        setFlag(s, "sta_warned");
        push(s, { kind: "hud", beat: "b4", text: flightWarn() });
      }
      setFlag(s, "first_flight");
      push(s, { kind: "narrative", beat: "b4", grade: "eyewitness", text: flightOk(s) });
      if (s.player.flightCount > 8) {
        push(s, { kind: "system", text: "同一条低空航线的熟练度已经挤不出油水。" });
      }
      return s;
    }
    case "EAT": {
      if (!["grass_inn", "reed_market"].includes(s.world.districtId)) {
        push(s, { kind: "system", text: "这里没有热食。去客栈或市集。" });
        return s;
      }
      const cost = action.item === "soup" ? COSTS.foodSoup : COSTS.foodDry;
      if (!pay(s, cost)) {
        push(s, { kind: "system", text: "Yrd 不够。钱会花在吃和修上——这就是第一课。" });
        return s;
      }
      s.player.sat = clamp(s.player.sat + (action.item === "soup" ? 50 : 30), 0, s.player.satMax);
      s.player.sta = clamp(s.player.sta + (action.item === "soup" ? 18 : 8), 0, s.player.staMax);
      setFlag(s, "paid_food");
      tickTime(s, 0.5, true);
      push(s, { kind: "narrative", beat: "b5", grade: "eyewitness", text: eatProse(action.item) });
      return s;
    }
    case "REPAIR": {
      if (s.world.districtId !== "forge_clamp") {
        push(s, { kind: "system", text: "去钳炉。" });
        return s;
      }
      const cost = action.apprentice ? COSTS.repairApprentice : COSTS.repair;
      if (!pay(s, cost)) {
        push(s, { kind: "system", text: "修理费不够。学徒价要等，全价也要钱。" });
        return s;
      }
      if (action.apprentice) tickTime(s, 3, false);
      else tickTime(s, 0.8);
      s.player.dur = 100;
      setFlag(s, "paid_repair");
      push(s, {
        kind: "narrative",
        beat: "b5",
        speakerId: "npc_tieqian",
        speaker: "铁钳·炉",
        grade: "npc_told",
        text: action.apprentice
          ? "「学徒活。刃口能用了。别谢，谢工时。」"
          : "「好了。下次摔自己看牌子。」",
      });
      return s;
    }
    case "REGISTER_BED": {
      if (s.world.districtId !== "grass_inn") {
        push(s, { kind: "system", text: "床在草尾客栈。" });
        return s;
      }
      if (!pay(s, COSTS.bed)) {
        push(s, { kind: "system", text: "8 Yrd 一晚。你付不起。" });
        return s;
      }
      s.inventory.bedPaidUntilHour = s.world.totalHours + 24;
      s.player.sat = clamp(s.player.sat + 12, 0, s.player.satMax);
      setFlag(s, "registered_bed");
      tickTime(s, 0.3);
      push(s, {
        kind: "system",
        beat: "b3",
        text: "你登记了床位。这不绑定任何主线。",
      });
      return s;
    }
    case "RENT_GEAR": {
      if (!["grass_inn", "oar_bay"].includes(s.world.districtId)) {
        push(s, { kind: "system", text: "渔具在客栈或湾边租。" });
        return s;
      }
      if (!pay(s, COSTS.gear)) {
        push(s, { kind: "system", text: "3 铢日租。口袋空了。" });
        return s;
      }
      s.inventory.fishGearUntilHour = s.world.totalHours + 24;
      setFlag(s, "rented_gear");
      tickTime(s, 0.2);
      push(s, { kind: "system", text: "渔具租到。折桨湾在北原边上。钓多久，世界就走多久。" });
      return s;
    }
    case "BUY_FEED": {
      if (s.world.districtId !== "tamer_row") {
        push(s, { kind: "system", text: "饲料在驯兽街。" });
        return s;
      }
      if (!pay(s, COSTS.feed)) {
        push(s, { kind: "system", text: "五铢一份。兽不赊账。" });
        return s;
      }
      s.inventory.feed += 1;
      tickTime(s, 0.2);
      push(s, {
        kind: "narrative",
        speakerId: "npc_asui",
        speaker: "阿穗",
        grade: "npc_told",
        text: "「拿去。你不吃可以硬撑，它们会咬你。」",
      });
      return s;
    }
    case "BUY_RUMOR": {
      // 入门阶段允许买到假新闻，避免晚上墨碑不在摊导致卡关
      const tutorialIntel =
        !s.flags.tutorial_graduated &&
        !s.flags.tutorial_skipped &&
        !s.flags.bought_mobei_rumor;
      if (
        s.world.districtId !== "reed_market" ||
        (!tutorialIntel && !npcsHere(s).includes("npc_mobei"))
      ) {
        push(s, {
          kind: "system",
          text: tutorialIntel
            ? "先到弗莉莉亚市集再买情报。"
            : "墨碑这一刻不在摊上。等到晨/午/黄昏再来，或点「等待」。",
        });
        return s;
      }
      if (!pay(s, COSTS.rumor)) {
        push(s, { kind: "system", text: "15 铢。假新闻也要钱。" });
        return s;
      }
      setFlag(s, "bought_mobei_rumor");
      tickTime(s, 0.3);
      const text = rumorIntel();
      addIntel(s, "rumor", "墨碑", text);
      push(s, {
        kind: "narrative",
        beat: "b6",
        speakerId: "npc_mobei",
        speaker: "墨碑",
        grade: "rumor",
        text: "「独家！云环已破，枢卫倒下！资料 15 铢！」\n系统记下：传闻 · 来源墨碑。不是亲眼所见。",
      });
      return s;
    }
    case "LOOK_TREE": {
      tickTime(s, 0.15);
      setFlag(s, "looked_tree");
      const text = lookTreeProseLocal();
      addIntel(s, "eyewitness", "自己", "世界树远影。无攻略进度。");
      push(s, { kind: "narrative", beat: "b6", grade: "eyewitness", text });
      if (flag(s, "bought_mobei_rumor") && !flag(s, "rumor_debunked")) {
        setFlag(s, "rumor_debunked");
        addIntel(s, "eyewitness", "自己", "远影仍是完整柱。看不见墨碑写的破口。传闻被拆穿。");
        push(s, {
          kind: "system",
          beat: "b6",
          grade: "eyewitness",
          text: "【对照】传闻（墨碑）云环已破　vs　亲眼所见：柱影还在，没有洞。假新闻不退钱。没有命运弹窗。",
        });
      }
      return s;
    }
    case "CANAL_SCOUR": {
      if (s.world.districtId !== "canal_mouth") {
        push(s, { kind: "system", text: "旧渠一层在南苔门方向。先走到入口。" });
        return s;
      }
      land(s);
      const runs = flag(s, "canalRuns");
      const r = roll(s.rng);
      s.rng = r.state;
      const staCost = 18;
      const durCost = 7;
      const hpCost = 4 + Math.floor(r.n * 8);
      s.player.sta = clamp(s.player.sta - staCost, 0, s.player.staMax);
      s.player.dur = clamp(s.player.dur - durCost, 0, 100);
      s.player.hp = clamp(s.player.hp - hpCost, 0, s.player.hpMax);
      tickTime(s, 2);
      const mul = Math.max(0.15, 1 - runs * 0.32);
      const jitter = Math.floor(r.n * 3);
      const loot = Math.max(1, Math.round((10 + jitter) * mul));
      s.player.yrd += loot;
      s.flags.canalRuns = runs + 1;
      setFlag(s, "canal_cleared");
      if (runs >= 1) setFlag(s, "canal_loot_decay");
      push(s, {
        kind: "narrative",
        grade: "eyewitness",
        text: `你沿着塌驿站走了一层。禁飞。水声像从更深处传来。耗 STA / DUR / HP。搜到 ${loot} Yrd 的锈件与劣矿。${runs >= 1 ? "同一条渠清过的人太多：材料在衰减。这不是副本重置。" : "脚印还在。下次再来，渠不会刷新成新的。"}没有神话钥匙。`,
      });
      if (s.player.hp <= 0) dieToClinic(s);
      return s;
    }
    case "CANAL_DOOR": {
      if (s.world.districtId !== "canal_mouth") {
        push(s, { kind: "system", text: "错误门在旧渠更深处。你还没走到入口。" });
        return s;
      }
      land(s);
      tickTime(s, 0.4);
      setFlag(s, "saw_error_door");
      addIntel(
        s,
        "eyewitness",
        "自己",
        "深层门上锁。标签像旧 SAO 残片气味，没有钥匙，也没有攻略弹窗。",
      );
      push(s, {
        kind: "narrative",
        grade: "eyewitness",
        text: "更深的台阶停在一扇不对劲的门前。封条写着城卫的字。门缝里有一股旧资料的气味——有人私下叫它错误门。锁着。危险度写着四。你没有被选中，也没有碎片任务。可以离开。",
      });
      return s;
    }
    case "FISH": {
      if (s.world.districtId !== "oar_bay") {
        push(s, { kind: "system", text: "钓鱼在折桨湾。" });
        return s;
      }
      if (s.inventory.fishGearUntilHour < s.world.totalHours) {
        push(s, { kind: "system", text: "先租渔具。" });
        return s;
      }
      land(s);
      const hours = action.hours;
      s.flags.fish_count = flag(s, "fish_count") + 1;
      const decay = skillGain(s, "fish");
      const r = roll(s.rng);
      s.rng = r.state;
      const catchYrd = Math.round((2 + r.n * 4) * (decay > 0 ? 1 : 0.35) / s.world.priceIndex);
      s.player.yrd += catchYrd;
      for (let i = 0; i < hours; i += 1) {
        tickTime(s, 1, false);
        push(s, {
          kind: "news",
          beat: "b8",
          grade: "rumor",
          text: `（你在折桨湾）\n${fishHourLine(Math.floor(s.world.totalHours), i)}`,
        });
      }
      if (hours >= 8 && s.inventory.bedPaidUntilHour < s.world.totalHours) {
        setFlag(s, "bed_lost");
        push(s, { kind: "system", text: "钓得太晚。没付钱的床位被人占了。" });
      }
      setFlag(s, "fished");
      if (!flag(s, "world_unpaused_line")) {
        setFlag(s, "world_unpaused_line");
        push(s, {
          kind: "system",
          beat: "b8",
          text: "你不在场的时候，阿尔普海姆没有暂停。",
        });
      }
      push(s, {
        kind: "narrative",
        grade: "eyewitness",
        text: `浮标沉了一次。卖得 ${catchYrd} Yrd。${decay === 0 ? noMythic() : ""}`.trim(),
      });
      return s;
    }
    case "WAIT": {
      land(s);
      const inn = Boolean(action.inn) && s.world.districtId === "grass_inn";
      if (inn && s.inventory.bedPaidUntilHour < s.world.totalHours) {
        push(s, { kind: "system", text: "没登记床位。你可以在厅里坐着耗时间，回得慢。" });
      }
      tickTime(s, action.hours, inn && s.inventory.bedPaidUntilHour >= s.world.totalHours);
      syncDanger(s);
      push(s, {
        kind: "system",
        text: inn ? "你躺过一个时辰。世界照走。" : "你等。风还在。板报上的墨会干。",
      });
      return s;
    }
    case "COMBAT": {
      if (action.choice === "bypass" || action.choice === "help" || action.choice === "shoo" || action.choice === "fight") {
        if (!s.combat && action.choice !== "bypass") {
          maybeEncounter(s);
        }
      }
      if (action.choice === "bypass") {
        s.combat = null;
        setFlag(s, "combat_resolved");
        setFlag(s, "skipped_fight");
        tickTime(s, 0.2);
        push(s, {
          kind: "system",
          beat: "b7",
          grade: "eyewitness",
          text: "你绕开。合法。灰芽自己想办法。这不是试炼场。没人给你勋章。",
        });
        return s;
      }
      if (action.choice === "help") {
        if (!pay(s, COSTS.helpHuiya)) {
          push(s, { kind: "system", text: "8 铢修剑你付不起。你仍把她送回门，空手。" });
        }
        s.combat = null;
        setFlag(s, "combat_resolved");
        if (!s.causal.includes("save_huiya")) s.causal.push("save_huiya");
        setFlag(s, "huiya_left");
        tickTime(s, 0.8);
        push(s, {
          kind: "narrative",
          beat: "b7",
          grade: "eyewitness",
          text: "你把灰芽送回门。没有弹窗写「命运之子」。因果边 save_huiya 被记下，只是权重，不是预言。",
        });
        return s;
      }
      if (action.choice === "shoo") {
        const r = roll(s.rng);
        s.rng = r.state;
        tickTime(s, 0.2);
        if (r.n > 0.45) {
          s.combat = null;
          setFlag(s, "combat_resolved");
          push(s, { kind: "narrative", beat: "b7", grade: "eyewitness", text: "你挥翅驱赶。风鼠窜了。DUR 没怎么动。" });
          return s;
        }
        push(s, { kind: "system", text: "驱赶失败。它还是扑上来。" });
        if (!s.combat) maybeEncounter(s);
        return s;
      }
      if (action.choice === "fight") {
        if (!s.combat) maybeEncounter(s);
        push(s, { kind: "system", text: "短剑或法术。消耗 DUR / STA。可以逃。" });
        return s;
      }
      if (!s.combat) {
        push(s, { kind: "system", text: "没有交战。" });
        return s;
      }
      if (action.choice === "flee") {
        s.player.sta = clamp(s.player.sta - 15, 0, s.player.staMax);
        s.combat = null;
        setFlag(s, "combat_resolved");
        setFlag(s, "skipped_fight");
        s.world.locationId = "loc_amber_crossing";
        s.world.districtId = "amber_gate_north";
        land(s);
        tickTime(s, 0.4);
        syncDanger(s);
        push(s, {
          kind: "narrative",
          beat: "b7",
          grade: "eyewitness",
          text: "你朝安全区方向逃。耗了 STA。门岗没鼓掌。",
        });
        return s;
      }
      if (s.player.dur <= 0 && action.choice === "sword") {
        push(s, { kind: "system", text: "剑是废铁。用法术或逃。" });
        return s;
      }
      if (action.choice === "sword") {
        s.player.dur = clamp(s.player.dur - 6, 0, 100);
        s.player.sta = clamp(s.player.sta - 8, 0, s.player.staMax);
        s.combat.enemyHp -= 12 + (s.player.flightSkill > 2 ? 2 : 0);
      } else {
        if (s.player.mp < 12) {
          push(s, { kind: "system", text: "MP 不够。" });
          return s;
        }
        s.player.mp -= 12;
        s.player.sta = clamp(s.player.sta - 4, 0, s.player.staMax);
        s.combat.enemyHp -= 10;
      }
      s.combat.turn += 1;
      tickTime(s, 0.12);
      if (s.combat.enemyHp <= 0) {
        const r = roll(s.rng);
        s.rng = r.state;
        const loot = 3 + Math.floor(r.n * 4);
        s.player.yrd += loot;
        s.combat = null;
        setFlag(s, "combat_resolved");
        push(s, {
          kind: "narrative",
          beat: "b7",
          grade: "eyewitness",
          text: `风鼠散成数据残渣。掉了 ${loot} Yrd 的皮料钱。没有人给你勋章，也没有稀有剑。`,
        });
        return s;
      }
      const hitRoll = roll(s.rng);
      s.rng = hitRoll.state;
      const hit = 7 + Math.floor(hitRoll.n * 5);
      s.player.hp = clamp(s.player.hp - hit, 0, s.player.hpMax);
      push(s, {
        kind: "system",
        text: `你出手。敌方 HP ${Math.max(0, s.combat.enemyHp)}。它回敬 ${hit} 点。`,
      });
      if (s.player.hp <= 0) dieToClinic(s);
      return s;
    }
    default:
      return s;
  }
}

export function applyAction(state: GameState, action: GameAction): GameState {
  const s = reduce(state, action);
  if (guideJustFinished(s)) {
    setFlag(s, "tutorial_graduated");
    push(s, { kind: "system", text: freePlayBlurb() });
  }
  return s;
}
