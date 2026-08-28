# ALfheim Online · Phase 1 网页客户端（MVP）

单机文字 RPG / 视觉小说面板。模拟层确定论，叙事默认模板（不需要 API key）。

## 运行

```bash
cd client
npm i
npm run dev
```

Vite `base` 为 `/Re0/`（GitHub Pages 仓库名）。本地开发请打开 **http://localhost:5173/Re0/**。

构建：`npm run build`。规则测试：`npm test`。

## GitHub Pages

可以。这是纯静态站（存档在浏览器 **localStorage**，没有服务器数据库），适合 Pages。

上线地址（合并并部署成功后）：**https://Justineya.github.io/Re0/**

首次需要仓库管理员点一次：

1. GitHub 仓库 → **Settings** → **Pages**
2. **Build and deployment** → **Source** 选 **GitHub Actions**

之后每次推送到 `main`（以及当前 PR 分支）会自动构建 `client/` 并发布。若 Actions 报 Pages 权限错误，多半是还没改这一项。

## 范围

弗莉莉亚猫妖开局：试飞、吃饭修理、传闻标签、可选北原战斗、折桨湾钓鱼、月末新闻、localStorage 存档。

详见仓库 `game/docs/08-mvp-gameplay.md` 与 `game/docs/05-onboarding.md`。
