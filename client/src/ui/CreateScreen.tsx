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
  goal: "先活过这个月，再决定要不要看世界树",
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
  const race = useMemo(() => raceById(p.race), [p.race]);

  function set<K extends keyof CreatePayload>(k: K, v: CreatePayload[K]) {
    setP((old) => ({ ...old, [k]: v }));
  }

  return (
    <div className="screen-center">
      <div className="panel create-wrap">
        <h2>选择你的起点　·　提交后世界不会为你重排。</h2>
        <p className="create-lead">时代决定开局新闻与物价，不决定你的命运。种族不是职业。外观可调，特性仍来自九族之一。</p>
        <div className="form-grid">
          <label>
            姓名
            <input value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="账号名" />
          </label>
          <label>
            外观年龄
            <input value={p.ageLook} onChange={(e) => set("ageLook", e.target.value)} />
          </label>
          <label>
            时代
            <span className="help">停滞期适合先学生活。攻略仍在远处失败。</span>
            <select value={p.era} onChange={(e) => set("era", e.target.value)}>
              {ERAS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                  {"recommended" in e && e.recommended ? "（推荐）" : ""}
                  {"default" in e && e.default ? "（默认·新生ALO）" : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            种族
            <span className="help">
              {p.race === "cait_sith"
                ? "驯兽 / 短剑 / 骑兽 / 情报很快——真假都快。"
                : `${race?.social ?? ""} MVP 内容仍在弗莉莉亚。`}
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
            身份
            <select value={p.origin} onChange={(e) => set("origin", e.target.value)}>
              {ORIGINS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {"note" in o && o.note ? `（${o.note}）` : ""}
                </option>
              ))}
            </select>
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
          <label className="span2">
            现实侧（只影响可玩时段的叙事，不给数值外挂）
            <input value={p.irl} onChange={(e) => set("irl", e.target.value)} />
          </label>
          <label className="span2">
            性格三词
            <input value={p.traits} onChange={(e) => set("traits", e.target.value)} />
          </label>
          <label className="span2">
            一句话人生目标
            <input value={p.goal} onChange={(e) => set("goal", e.target.value)} />
          </label>
          <label className="span2">
            模拟风格
            <select value={p.simStyle} onChange={(e) => set("simStyle", e.target.value)}>
              {SIM_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
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
            展开第一对翅膀
          </button>
        </div>
      </div>
    </div>
  );
}
