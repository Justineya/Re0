import type { GameState, IntelGrade, LogEntry } from "./types";
import { COSTS, districtName, locationName, npcById, raceById } from "./content";
import { calendarLabel, todFromHour } from "./time";

export const GRADE_ZH: Record<IntelGrade, string> = {
  eyewitness: "亲眼所见",
  npc_told: "NPC告知",
  rumor: "传闻",
};

export function gradeLabel(g?: IntelGrade): string {
  return g ? GRADE_ZH[g] : "现场";
}

function p(state: GameState) {
  return state.player;
}

export function sceneCaption(state: GameState): string {
  const loc = locationName(state.world.locationId);
  const dist = districtName(state.world.districtId);
  const race = raceById(p(state).race);
  return `${loc} · ${dist}　${calendarLabel(state.world)}　${weatherZh(state.world.weather)}　${race?.name_zh ?? ""}`;
}

export function weatherZh(id: string): string {
  const map: Record<string, string> = {
    clear: "晴",
    wind: "风",
    fog: "雾",
    rain: "雨",
    storm: "雷暴",
    tide_element: "元素潮",
  };
  return map[id] ?? id;
}

export const LOGIN_CRAWL = [
  "你要进入的是《ALfheim Online》——文字版人生模拟，不是聊天机器人。",
  "玩法：看中间的故事 → 点下方指令行动。不用打字。",
  "开局城市：猫妖领地弗莉莉亚。你只是普通玩家，不是天选者。",
  "入门只做三件事：① 试飞一次　② 去客栈吃饭/开房　③ 在市集买一条「传闻」。",
  "右侧面板是血量、精力 STA、金钱 Yrd。飞会耗 STA；吃饭会花钱。",
];

export function landingProse(state: GameState): string {
  return `【你在哪里】弗莉莉亚 · 试飞场。账号名：${p(state).name}。\n【发生了什么】你刚登录 ALO。没有欢迎仪式，没有隐藏血统。远处那根淡青柱影是世界树——现在还轮不到你。\n【怎么玩】看完这段，去点下方高亮的「第一次低空巡航」。左上角「现在该做什么」会一步步带你。`;
}

export function talkCopy(state: GameState, npcId: string, first: boolean): string {
  const tod = todFromHour(state.world.hourOfDay);
  switch (npcId) {
    case "npc_quefeng":
      if (!state.flags.sta_warned) {
        return first
          ? "「新翅膀？看牌子。STA 掉到两成就给我落地。摔伤的修理费自理，诊所在镜川那儿。」"
          : "「牌子还在。城内四十尺。雷暴关场。教官不负责你的人生目标。」";
      }
      if (state.causal.includes("save_huiya")) {
        return "「灰芽回场了。还是那块牌子。她搬箱子，你管自己的 STA。」";
      }
      if (state.flags.crashed) {
        return "「看吧。翅膀不是无限外挂。去吃饭，STA 空着回得慢。」";
      }
      return "「落地了就对。去吃饭或修剑，别空着精力硬撑面子。」";
    case "npc_luhua":
      if (tod === "night") return "「打烊倒不是，锁兽栏了。床还在的话自己上楼。别把泥带进灶。」";
      if (state.causal.includes("save_huiya")) {
        return "「灰芽那丫头来吃过粥。后勤名册边上的名字，不是英雄榜。」";
      }
      return first
        ? "「欢迎来津。床 8 Yrd一晚，包一口粥。渔具 3 铢日租。世界树？啊，你是说世界树。板报在弗莉莉亚市集。别全信。」"
        : "「在津，消息比饲料跑得快。真的少。要吃饭就说，要听闲话也行——我不当保证人。」";
    case "npc_tieqian":
      if (state.flags.market_tight) {
        return "「合金价往上爬。修一次按市价，别跟我讲情怀。旧渠那点锈铁也填不满缺口。」";
      }
      if (state.flags.crashed && first) {
        return "「剑刃卷了。修一次 12 铢，学徒价 9 铢但要等。DUR 到 0 是废铁，不是情怀。」";
      }
      return "「报工号。刃口我看一眼。学徒价要排队，急件按全价。」";
    case "npc_mobei":
      if (state.flags.rumor_debunked) {
        return "「独家改成『未证实』了。退款？那是你买的娱乐。板报明天照样有人抄。」";
      }
      return "「独家！云环已破，枢卫倒下！资料 15 铢！不买也行，反正板报上明天也会有人抄。」";
    case "npc_taixu":
      if (state.flags.bought_mobei_rumor && !state.flags.rumor_debunked) {
        return "「墨碑那张纸？日期对不上。营地还在，云环没破。合金紧是真的，枢卫倒下是他编的。」";
      }
      if (state.flags.rumor_debunked) {
        return "「你对过远影就行。矿还是矿，门还是锁着。别把传闻写成履历。」";
      }
      return "「营地还在。有人死了游戏里那种。没破。合金还是紧，别听市集喊。」";
    case "npc_ling_xiaoman":
      return "她把琴往肩上一靠，唱得很轻：「三层，还是三层——云环上面风好冷。」像儿歌，不像战报。";
    case "npc_asui":
      if (state.flags.market_tight) {
        return "「饲料袋上的价签又改了。兽不赊账，物价也不认你是驯兽学徒。」";
      }
      return p(state).origin === "tamer_apprentice"
        ? "「兽也要吃。你不吃可以硬撑，它们会咬你。饲料五铢一份，别赊。」"
        : "「看可以。摸要问。琥珀今天不叫，算它赏脸。」";
    case "npc_huiya":
      if (state.causal.includes("save_huiya")) {
        return "「名册边上有我。搬箱子、数羽。没有弹窗说我是谁的命运。」她把灰从袖口弹掉。";
      }
      return "「我不是卡关。碑只是比桩高一点。风鼠那东西——你可以当没看见。」";
    case "npc_jingchuan":
      return "「摔伤减半只在安全区。疲劳我开药，药不是无限。别把诊所当存档点。」";
    case "npc_chisha":
      return "「护卫合同我有。你这样的翅膀，先活过北原再谈编制。」";
    case "npc_shian":
      if (state.causal.includes("save_huiya")) {
        return "「北门数字今天好看。后勤名册边上多了个灰芽。不是先锋编制。」";
      }
      return "「北门数字今天好看。别在门岗试飞。出去自己看危险度。」";
    case "npc_jingdi":
      return "影巷摊上的人抬头：「……货有。问题也有。你不像来买答案的。」";
    default:
      return `${npcById(npcId)?.name_zh ?? "有人"}正忙，只点了一下头。`;
  }
}

export function moveProse(districtId: string): string {
  const name = districtName(districtId);
  const map: Record<string, string> = {
    wing_yard: "试飞场的木桩还在发潮。牌子钉在进场处，字写得很不客气。",
    grass_inn: "草尾客栈门口挂着风干的渔线。灶烟是粟米和兽脂的味道。",
    reed_market: "弗莉莉亚市集比情报更吵。板报被钉了三层，最上面那张墨迹未干。",
    amber_gate_north: "北驿门的卫兵在数进出。门外草原一抬，世界树的柱影仍远。",
    tamer_row: "驯兽街有哨子和不满的喉音。饲料袋子靠墙码着。",
    clinic_mirror: "诊所里水元素的灯很稳。床位空着，像在等一种可预防的蠢。",
    forge_clamp: "钳炉的热浪把翅膀上的露蒸干。铁钳不抬头也知道你剑钝了。",
    night_well_alley: "影巷窄，符文灯只照脚。井盖边有没写完的价目。",
    watch_keep: "卫所门口贴着本周罚款：试飞场打架、限高、无证骑兽。",
    south_moss_gate: "南苔门朝林。苔藓爬过石缝，空气比北门湿。",
    wild_plain: "弗莉莉亚北原的草刮小腿。危险度不再是零。没有人给你勋章。",
    broken_wing: "折翼碑的影子斜在草上。有人在碑座后喘气，翅膀还在抖。",
    oar_bay: "折桨湾的水拍旧码头。渔浮标一排，像不想参与攻略的人。",
    moss_edge: "南林缘的光碎成斑。你可以继续走，也可以回去吃饭。",
    canal_mouth: "旧渠入口有城卫的封条和更旧的脚印。这里不是副本：清过的锈还会在。深层的门仍锁。你没有神话钥匙。",
  };
  return map[districtId] ?? `你走到${name}。`;
}

export function flightWarn(): string {
  return "⚠ 精力 20%\n强制降落协议将在 0% 启动。\n城内摔伤减半，但 DUR 照扣。";
}

export function flightOk(state: GameState): string {
  const left = Math.round(state.player.sta);
  return `低空巡航。城内限高压着头顶。STA ${left}。北驿门的顶在风里像一块可到达的木头——不是试炼。`;
}

export function crashProse(): string {
  return "精力归零。强制降落。木桩擦过靴底，你还是摔了。安全区把伤害砍半，剑刃却不认安全区。DUR 往下掉。";
}

export function rumorIntel(): string {
  return "墨碑手抄：「云环已破，枢卫倒下。」纸边还有他改过的日期。";
}

export function fishHourLine(hour: number, i: number): string {
  const lines = [
    "· 弗莉莉亚市集饲料价格微调 −1%",
    "· 试飞场：两名新手打架被罚款（传闻）",
    "· 北线驿站：攻略营地申请加急合金（传闻）",
    "· 南苔门卫兵换班，数字仍好看",
    "· 有人在板报上画了第四层，随即被撕",
  ];
  return lines[(hour + i) % lines.length] ?? lines[0];
}

export function monthNews(state: GameState, prevIndex: number): string[] {
  const idx = state.world.priceIndex;
  const delta = idx - prevIndex;
  const sign = delta >= 0 ? "+" : "";
  const tight = Boolean(state.flags.market_tight);
  const lines = [
    `【月报 · 地区】世界树攻略进度：云环第三层仍停滞。没有破。`,
    `【月报 · 物价】弗莉莉亚价格指数 ${prevIndex.toFixed(2)} → ${idx.toFixed(2)}（${sign}${delta.toFixed(2)}）。饲料、修理、情报都按新指数结算。${tight ? "市集偏紧：价签被改过。" : "还没到抢购的程度。"}神器仍不会从天上掉下来。`,
  ];
  if (state.causal.includes("save_huiya")) {
    lines.push("【月报 · 因果】灰芽出现在北门后勤名册边缘。不是命运，是她还活着、还想飞。");
  } else {
    lines.push("【月报 · 日常】折桨湾渔获一般。有人整月没出北门，也没人因此成为主角。");
  }
  if (tight) {
    lines.push("【月报 · 日程】驯兽街收摊更早。铁钳把学徒价单往墙上又钉了一层。");
  }
  return lines;
}

export function eatProse(item: "dry" | "soup"): string {
  return item === "soup"
    ? `热汤 ${COSTS.foodSoup} 铢。饱食回得像样。STA 空着回得慢——这口别省。`
    : `干粮 ${COSTS.foodDry} 铢。能垫，谈不上爽。芦花看你一眼，没评价你的人生目标。`;
}

export function noMythic(): string {
  return "箱子里没有神话。重复的草径也不会给你递减为零的熟练度以外的东西。";
}

export function logEntry(
  state: GameState,
  partial: Omit<LogEntry, "id" | "hour">,
): LogEntry {
  state.seq += 1;
  return {
    id: `e${state.seq}`,
    hour: state.world.totalHours,
    ...partial,
  };
}
