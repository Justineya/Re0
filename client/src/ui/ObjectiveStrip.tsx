import { currentGuide, freePlayBlurb } from "../sim/guide";
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
  if (state.flags.tutorial_graduated || state.flags.tutorial_skipped) {
    return (
      <div className="panel obj guide-obj done">
        <div className="obj-kicker">自由行动</div>
        <div className="obj-title">入门已结束</div>
        <p className="obj-body">{freePlayBlurb()}</p>
      </div>
    );
  }
  return null;
}
