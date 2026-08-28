import { ORIGINS } from "../sim/content";
import { npcsHere, presentHint } from "../sim/npcs";
import { listCommands } from "../sim/commands";
import type { GameAction, GameState } from "../sim/types";
import { CommandMenu } from "./CommandMenu";
import { MiniMap } from "./MiniMap";
import { NarrativeLog } from "./NarrativeLog";
import { ObjectiveStrip } from "./ObjectiveStrip";
import { PortraitSlot } from "./PortraitSlot";
import { StatusPanel } from "./StatusPanel";

function originName(id: string): string {
  return ORIGINS.find((o) => o.id === id)?.name ?? id;
}

export function GameHud({
  state,
  onAction,
  onTitle,
  onSettings,
}: {
  state: GameState;
  onAction: (a: GameAction) => void;
  onTitle: () => void;
  onSettings: () => void;
}) {
  const cmds = listCommands(state);
  const people = npcsHere(state);
  const focusNpc = state.log.slice().reverse().find((e) => e.speakerId)?.speakerId ?? people[0];
  const portraitRace = state.player.race;
  const guiding = !state.flags.tutorial_graduated && !state.flags.tutorial_skipped;

  return (
    <div className="hud">
      <div className="hud-left">
        <div className="menu-bar">
          <button type="button" className="btn ghost" onClick={onTitle}>
            标题
          </button>
          <button type="button" className="btn ghost" onClick={onSettings}>
            设定
          </button>
        </div>
        <PortraitSlot
          race={portraitRace}
          name={focusNpc && people.includes(focusNpc) ? presentHint(focusNpc).split("　")[0]! : state.player.name}
          role={
            focusNpc && people.includes(focusNpc)
              ? presentHint(focusNpc).split("　")[1]
              : originName(state.player.origin)
          }
          npcId={focusNpc && people.includes(focusNpc) ? focusNpc : null}
        />
        <ObjectiveStrip state={state} />
      </div>
      <NarrativeLog state={state} />
      <div className="hud-right">
        <StatusPanel state={state} />
        <MiniMap state={state} />
        <div className="panel people">
          <div style={{ color: "var(--gold)", letterSpacing: "0.16em", fontSize: "0.78rem" }}>在场人物</div>
          {people.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>这一刻没人在你旁边。</p>
          ) : (
            <ul>
              {people.map((id) => (
                <li key={id}>{presentHint(id)}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="hud-bottom">
        {guiding ? (
          <div className="cmd-hint-banner">入门中：下方只显示当前相关指令 · 黄色按钮 = 建议下一步</div>
        ) : null}
        <CommandMenu commands={cmds} onAction={onAction} />
      </div>
    </div>
  );
}
