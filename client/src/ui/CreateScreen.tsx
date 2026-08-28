import { useMemo, useState } from "react";
import {
  AFFINITIES,
  BIRTHPLACES,
  ERAS,
  GENDERS,
  ORIGINS,
  SIM_STYLES,
  raceById,
  racesData,
} from "../sim/content";
import { validateCreate } from "../sim/create";
import type { CreatePayload } from "../sim/types";

const defaultPayload = (): CreatePayload => ({
  name: "",
  race: "cait_sith",
  origin: "tamer_apprentice",
  era: "era_new_alo",
  ageLook: "青年",
  gender: "不公开",
  birthplace: "freelia",
  irl: "夜班后登录",
  affinity: "balanced",
  traits: "谨慎, 嘴快, 不肯当先锋",
  goal: "先搞清楚怎么在弗莉莉亚活下去",
  simStyle: "daily",
});

export function CreateScreen({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (p: CreatePayload) => void;
}) {
  const [p, setP] = useState<CreatePayload>(defaultPayload);
  const [err, setErr] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const race = useMemo(() => raceById(p.race), [p.race]);

  function set<K extends keyof CreatePayload>(k: K, v: CreatePayload[K]) {
    setP((old) => ({ ...old, [k]: v }));
  }

  return (
    <div className="screen-center">
      <div className="panel create-wrap">
        <h2>创建角色</h2>
        <p className="create-lead">
          这是文字 RPG：进入后用<strong>底部按钮</strong>行动，不用打字。默认已选好「新生 ALO · 猫妖 · 驯兽学徒 · 弗莉莉亚」——你只需填名字，后面会有三步入门。
        </p>
        <div className="form-grid">
          <label className="span2">
            姓名（必填）
            <input
              value={p.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="例如：小夜、芦哨"
              autoFocus
            />
          </label>
          <label>
            种族
            <span className="help">
              {p.race === "cait_sith"
                ? "推荐：猫妖。开局内容都在弗莉莉亚附近。"
                : `${race?.name_zh ?? ""} · MVP 地图仍主要在弗莉莉亚。`}
            </span>
            <select value={p.race} onChange={(e) => set("race", e.target.value)}>
              {racesData.races.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name_zh} · {r.codename}
                </option>
              ))}
            </select>
          </label>
          <label>
            开局身份
            <select value={p.origin} onChange={(e) => set("origin", e.target.value)}>
              {ORIGINS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {"note" in o && o.note ? `（${o.note}）` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button type="button" className="btn ghost advanced-toggle" onClick={() => setAdvanced((v) => !v)}>
          {advanced ? "收起更多选项" : "更多选项（时代 / 性格 / 目标）"}
        </button>

        {advanced ? (
          <div className="form-grid" style={{ marginTop: "0.8rem" }}>
            <label>
              时代
              <select value={p.era} onChange={(e) => set("era", e.target.value)}>
                {ERAS.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              外观年龄
              <input value={p.ageLook} onChange={(e) => set("ageLook", e.target.value)} />
            </label>
            <label>
              性别
              <select value={p.gender} onChange={(e) => set("gender", e.target.value)}>
                {GENDERS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <label>
              出生地
              <select value={p.birthplace} onChange={(e) => set("birthplace", e.target.value)}>
                {BIRTHPLACES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              元素亲和
              <select value={p.affinity} onChange={(e) => set("affinity", e.target.value)}>
                {AFFINITIES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              模拟风格
              <select value={p.simStyle} onChange={(e) => set("simStyle", e.target.value)}>
                {SIM_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="span2">
              现实侧备注
              <input value={p.irl} onChange={(e) => set("irl", e.target.value)} />
            </label>
            <label className="span2">
              性格
              <input value={p.traits} onChange={(e) => set("traits", e.target.value)} />
            </label>
            <label className="span2">
              人生目标
              <input value={p.goal} onChange={(e) => set("goal", e.target.value)} />
            </label>
          </div>
        ) : null}

        <p className="err">{err ?? ""}</p>
        <div className="create-actions">
          <button type="button" className="btn ghost" onClick={onBack}>
            返回
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              const e = validateCreate(p);
              setErr(e);
              if (!e) onSubmit(p);
            }}
          >
            进入游戏
          </button>
        </div>
      </div>
    </div>
  );
}
