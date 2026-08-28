import { onboarding } from "../sim/content";

export function TitleScreen({
  hasSave,
  onCreate,
  onLoad,
  onSettings,
}: {
  hasSave: boolean;
  onCreate: () => void;
  onLoad: () => void;
  onSettings: () => void;
}) {
  return (
    <div className="screen-center">
      <div className="panel title-wrap">
        <div className="display" style={{ color: "var(--leaf)", letterSpacing: "0.28em", fontSize: "0.78rem" }}>
          RECT Progressive
        </div>
        <h1>{onboarding.productTitle}</h1>
        <p className="sub">{onboarding.productSubtitle}</p>
        <p className="how-to-play">
          文字 RPG：看故事 → 点指令。不用打字。开局在弗莉莉亚，三步入门（飞 / 吃饭 / 听传闻）。
        </p>
        <div className="title-actions">
          <button type="button" className="btn primary" onClick={onCreate}>
            新游戏
          </button>
          <button type="button" className="btn" onClick={onLoad} disabled={!hasSave}>
            读取存档
          </button>
          <button type="button" className="btn ghost" onClick={onSettings}>
            设定
          </button>
        </div>
        <p className="fan-note">刀剑神域 / ALO 同人向私用。非官方、非商用。你不是天选者。</p>
      </div>
    </div>
  );
}
