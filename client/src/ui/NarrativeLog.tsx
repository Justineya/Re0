import { GRADE_ZH, sceneCaption } from "../sim/narrative";
import type { GameState, IntelGrade } from "../sim/types";
import { useEffect, useRef } from "react";

function tagClass(g?: IntelGrade, kind?: string): string {
  if (g) return g;
  if (kind === "news") return "rumor";
  return "system";
}

export function NarrativeLog({ state }: { state: GameState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.log.length, state.seq]);

  return (
    <div className="panel hud-center" style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div className="scene-chip">{sceneCaption(state)}</div>
      <div className="log" ref={ref}>
        {state.log.map((e) => (
          <article key={e.id} className={`log-item ${e.kind === "hud" ? "hud-entry" : ""} ${e.kind}`}>
            {e.kind !== "hud" && (
              <span className={`tag ${tagClass(e.grade, e.kind)}`}>
                {e.grade ? GRADE_ZH[e.grade] : e.kind === "news" ? "月报/摘要" : "系统"}
              </span>
            )}
            {e.speaker && <div className="who">{e.speaker}</div>}
            <div style={{ whiteSpace: "pre-wrap" }}>{e.text}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
