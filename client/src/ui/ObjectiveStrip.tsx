import { currentGuide, softObjectives } from "../sim/guide";
import type { GameState } from "../sim/types";

export function ObjectiveStrip({ state }: { state: GameState }) {
  const g = currentGuide(state);
  if (g) {
    return (
      <div className="panel obj guide-obj">
        <div className="obj-kicker">
          现在该做什么 · {g.step}/{g.total}
        </div>
        <div className="obj-title">{g.title}</div>
        <p className="obj-body">{g.body}</p>
      </div>
    );
  }
  const soft = softObjectives(state);
  if (soft) {
    return (
      <div className="panel obj guide-obj done">
        <div className="obj-kicker">自由行动</div>
        <div className="obj-title">{soft.title}</div>
        <p className="obj-body">{soft.body}</p>
      </div>
    );
  }
  return null;
}
