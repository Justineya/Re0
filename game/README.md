# 岚羽 Online · 九族世界模拟（Galeplume）

> Phase 0 内容圣经。可玩文本客户端是 **Phase 1**，本目录现在交付的是**世界、规则、故事脊骨、新手脚本、立绘管线与起始 JSON**。

## 这是什么

《岚羽 Online》是一款**单人、确定论模拟 + LLM 叙事**的文字世界模拟游戏。玩家不是天选者，只是羽洲上一个有翅膀的人。世界在登录前已经转过很久；你去钓鱼时，天枢木攻略组仍可能在失败。

它**派生自**抖音「哭猫」ALO 世界模拟器提示词的**机制**（九族、飞行精力、世界树级长线攻略、旧死局数据残片、反主角光环、无玩家也走月结算），但使用**完全原创 IP**：

| 不要使用 | 本作对应 |
| --- | --- |
| Sword Art Online / SAO / 刀剑神域 | 《钢茧》（死局协议残片） |
| ALO / ALfheim / 阿尔普海姆 | 岚羽 Online / 羽洲 |
| Kirito / Asuna / 桐人 / 亚丝娜 | 原创角色（见 `docs/04-storylines.md`） |
| RECT | 澄空织造 |
| Yggdrasil / 世界树作为商标产品名 | 天枢木（地理与攻略目标） |
| Yrd | 岚铢（`LAN`） |

源提示词整理仍保留在仓库 `alo-prompt/`，仅作机制考古，**不得进入游戏客户端文案**。

## 现在有什么

| 路径 | 内容 |
| --- | --- |
| [`docs/00-product.md`](docs/00-product.md) | 产品、三层架构、IP 立场 |
| [`docs/01-world.md`](docs/01-world.md) | 完整世界观 |
| [`docs/02-races.md`](docs/02-races.md) | 九族（含填满的珀尾族） |
| [`docs/03-systems.md`](docs/03-systems.md) | 作为游戏数据的规则，不是聊天提示词 |
| [`docs/04-storylines.md`](docs/04-storylines.md) | 多条可选故事脊骨 + 珀尾津 NPC |
| [`docs/05-onboarding.md`](docs/05-onboarding.md) | 完整新手讲解脚本与 UI 文案 |
| [`docs/06-portraits.md`](docs/06-portraits.md) | 立绘实现方案（Phase 1 即可存 ID） |
| [`docs/07-phase1-client.md`](docs/07-phase1-client.md) | 下一阶段可玩客户端范围 |
| [`data/`](data/) | `races.json` `locations.json` `npcs.json` `onboarding-beats.json` `portrait-templates.json` |
| [`assets/portraits/`](assets/portraits/) | 占位 SVG 与目录约定 |

## 建议阅读顺序

产品 → 世界 → 种族 → 系统 → 故事脊骨 → 新手 → 立绘 → Phase 1 客户端。JSON 与文档字段名对齐，客户端应读 JSON，不要把世界观硬编码进提示词。
