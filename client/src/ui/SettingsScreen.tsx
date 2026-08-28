import { GRADE_ZH } from "../sim/narrative";
import type { GameState } from "../sim/types";

export function SettingsScreen({
  state,
  onBack,
  onToggleLlm,
  onExport,
  onImport,
}: {
  state: GameState | null;
  onBack: () => void;
  onToggleLlm: (v: boolean) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}) {
  return (
    <div className="screen-center">
      <div className="panel create-wrap">
        <h2>设定</h2>
        <p className="create-lead">叙事默认模板。LLM 钩子存在但不联网、不写补丁。</p>
        <label>
          启用 LLM 叙事钩子（默认关）
          <select
            value={state?.settings.llmEnabled ? "on" : "off"}
            onChange={(e) => onToggleLlm(e.target.value === "on")}
            disabled={!state}
          >
            <option value="off">关</option>
            <option value="on">开（仍无模型，模板兜底）</option>
          </select>
        </label>
        {state && (
          <div style={{ marginTop: "1rem" }}>
            <div className="stat-kv">
              <span>存档角色</span>
              <b>{state.player.name}</b>
            </div>
            <div className="stat-kv">
              <span>情报条数</span>
              <b>{state.intel.length}</b>
            </div>
            <ul style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
              {state.intel.slice(0, 6).map((i) => (
                <li key={i.id}>
                  [{GRADE_ZH[i.grade]}] {i.source}：{i.text}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="create-actions">
          <button type="button" className="btn ghost" onClick={onBack}>
            返回
          </button>
          <button type="button" className="btn" onClick={onExport} disabled={!state}>
            导出存档 JSON
          </button>
          <label className="btn" style={{ display: "inline-block" }}>
            导入 JSON
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImport(f);
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
