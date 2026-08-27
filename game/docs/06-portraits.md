# 立绘实现 · 从 Phase 1 ID 到 Phase 5 视觉壳

立绘（portrait）是**角色可读的半身像**，不是 3D 模型。Phase 1 文本客户端就必须在存档里写下 `portraitId` 与组件字段，以免 Phase 5 无法对齐旧档。

**不建议**先做 3D。成本高、九族翅膀剪影难统一、与文字模拟的迭代速度不匹配。v1 走：占位符 → 锁定提示词的静帧 → （可选）分层 PSD / 2D 骨骼。

---

## 1. 风格圣经

- **调性：** 动漫相邻、VR 妖精、清晰剪影、能在 256–512px 识别种族。  
- **不是：** 写实欧美奇幻油绘、赛博义体主视觉、商标角色脸。  
- **构图：** 膝上或腰上半身，翅膀必须入画（至少一侧）。背景简化为种族色块 + 一枚符文，避免场景抢脸。  
- **线：** 干净，少过密盔甲花纹（花纹会在缩小后糊成脏斑）。

### 1.1 种族色盘与翅膀剪影

| race | 主色 | 辅色 | 翅剪影关键词 |
| --- | --- | --- | --- |
| sylph | `#3ECF8E` | `#E8FFF4` | 窄、后掠、风刃 |
| salamander | `#E23D2A` | `#2A0A08` | 宽膜、炽纹 |
| undine | `#2B8CFF` | `#D6F0FF` | 圆端水膜 |
| gnome | `#C4A574` | `#3D3428` | 短厚 |
| cait_sith | `#E6A23C` | `#6B8F3A` | 软翅；耳尾必现 |
| pooka | `#C77DFF` | `#FFF4C4` | 羽状、可画振纹 |
| imp | `#5B3A9A` | `#1A1228` | 折角夜膜 |
| spriggan | `#8E9AA8` | `#E6EEF5` | 碎形、半透明 |
| leprechaun | `#D4AF37` | `#4A4A4A` | 骨翼+小机械 |

### 1.2 服装阶层（outfit tier）

| tier | 用途 | 视觉 |
| --- | --- | --- |
| `novice` | 开局、教程 | 亚麻、护具少、种族色只在边饰 |
| `artisan` | 工匠/商人/驯兽 | 围裙、工具带、少战斗件 |
| `raider` | 野外/攻略后勤以上 | 护肩、翅骨加固，仍要能认出种族 |

禁止默认神话甲。神话是掉落/订做，不是创建赠品。

### 1.3 表情（expression）

v1 最多 4 槽：`idle` `talk` `hurt` `angry`。  
NPC v1：**1 张关键帧 + 最多 3 表情**（通常 idle/talk/angry，hurt 可省）。

---

## 2. 数据模型

存档与 `portrait-templates.json`：

```json
{
  "portraitId": "pc_cait_sith_novice_a3f2",
  "race": "cait_sith",
  "body": "androgynous_m",
  "hair": "short_amber",
  "wings": "cait_soft_01",
  "outfit": "novice",
  "seed": 482716,
  "expression": "idle",
  "asset": "placeholders/cait_sith.svg"
}
```

| 字段 | 说明 |
| --- | --- |
| `portraitId` | 稳定 ID。玩家角色：`pc_{race}_{outfit}_{hash}`。NPC：`npc_{npcId}_{expr}` 或共享模板 + expr |
| `race` | 九 id 之一 |
| `body` | 少量体型枚举，不是自由雕塑 |
| `hair` | 每族 4–6 款 |
| `wings` | 每族 2–3 款剪影 |
| `outfit` | novice/artisan/raider |
| `seed` | 图像模型种子；占位符阶段也要存，供日后生成 |
| `expression` | 当前槽 |
| `costumeToken` | 锁定提示词里的服装短语，换装才改 |
| `asset` | Phase 1 实际文件 |

玩家角色：**组合器** = 种族模板 + 有限滑条（发色、翅色、耳尾长度、身高三档）。**不是**无限捏脸。

NPC：一张 key art，表情用同一 seed 与 `costumeToken` 只改口型/眉。

---

## 3. 管线

### 阶段 (1) Phase 1 占位

`game/assets/portraits/placeholders/{race}.svg`  
或 CSS：纯色底 + 种族符文。对话 UI 左侧 96×128 即可。

本仓库已放：`cait_sith.svg`、`sylph.svg` 作为种族模板示例。其余族 Phase 1 可用同结构改色盘生成，不必一次画完九张精绘。

### 阶段 (2) 锁定提示词的静帧

用同一 **中英双语模板** + **固定 negative** + **每角色 seed** + **costumeToken**。  
批量时一次最多试 1–2 张模板，禁止一次生成全剧组（版权与一致性灾难）。

换表情：只改 expression 句，其它 token 不动。  
换装：改 costumeToken 与 outfit，**seed 保持**。

### 阶段 (3) 后期可选

分层 PSD（头发/翅/甲分开）或 Spine 2D。仍不要先 3D。

---

## 4. 提示词模板

### 4.1 正向（中英一起喂给模型，英文为主、中文锁设定）

```
[EN] Anime-adjacent character portrait, waist-up, clean line art, consistent fairy-VR MMO look,
one pair of visible wings, readable silhouette, soft studio lighting, plain rune backdrop.
Race: {race_en} fairy ({race_cn}). Wing silhouette: {wing_keyword}.
Outfit tier: {outfit} — {costumeToken}.
Hair: {hair}. Body type: {body}.
Expression: {expression}.
Color palette: {hex_primary} and {hex_secondary}.
No photoreal skin pores, no crowded background, no extra limbs.

[ZH] 动漫相邻半身立绘，妖精VR，翅膀入画，种族可辨，服装阶层{outfit}，表情{expression_cn}。
原创角色，不是任何现有动画主角。
```

`costumeToken` 例（珀尾新手）：  
`reed-linen tunic, leather tamer sash, small ear tufts, amber-tipped tail, unarmored`

### 4.2 Negative

```
photorealistic, 3d render, western oil painting, extra wings, extra ears,
copyright character, named franchise hero, messy background, gore,
overdesigned legendary armor, watermark, text, logo, duplicate face
```

### 4.3 一致性规则

1. 同一 `seed` + 同一 `costumeToken` + 同一 `wing` 关键词。  
2. 禁止在提示词里写商标角色名「像某某」。  
3. NPC 三表情必须同 seed。  
4. 玩家滑条只映射到枚举 token，不把自由文本拼进提示词（防提示注入与崩设定）。

---

## 5. 文件布局

```
game/assets/portraits/
  README.md                 ← 本目录说明（短）
  placeholders/             ← Phase 1 SVG
    cait_sith.svg
    sylph.svg
  templates/                ← 日后静帧输出
    {portraitId}_{expr}.png
  npc/                      ← NPC key art
  pc/                       ← 玩家组合结果缓存
```

JSON 索引：`game/data/portrait-templates.json`。

---

## 6. 法律

- 只画原创角色。NPC 名、脸、服装与任何商标作品解耦。  
- 提示词禁止「in the style of [具体在世画师]」若发行有风险；用风格圣经的材料描述代替。  
- 玩家上传自定义图：Phase 1 不做；若未来做，需过滤商标与成人内容。

---

## 7. UI 用法（Phase 1 / 5）

Phase 1：叙事窗左侧色块 + 符文 + 名字。  
Phase 5：同槽换 PNG；`talk` 在 NPC 说话时切换，句末回 `idle`；`hurt` 仅战斗结算闪一下。
