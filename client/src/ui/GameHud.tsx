import { ORIGINS } from "../sim/content";
import { npcsHere, presentHint } from "../sim/npcs";
import { listCommands } from "../sim/commands";
import type { GameAction, GameState } from "../sim/types";
import { CommandMenu } from "./CommandMenu";
import { MiniMap } from "./MiniMap";
import { NarrativeLog } from "./NarrativeLog";
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
  const checks = [
    { ok: Boolean(state.flags.sta_warned), lab: "理解 STA 警告" },
    { ok: Boolean(state.flags.paid_food || state.flags.paid_repair), lab: "付过一次食物或修理" },
    { ok: Boolean(state.flags.bought_mobei_rumor), lab: "至少一条传闻标签的情报" },
    { ok: Boolean(state.flags.skipped_fight || state.flags.combat_resolved), lab: "知道战斗可跳" },
  ];

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
        <div className="panel obj">
          <div style={{ color: "var(--gold)", letterSpacing: "0.12em", marginBottom: 6 }}>OPTIONAL</div>
          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
            {checks.map((c) => (
              <li key={c.lab} className={c.ok ? "done" : ""}>
                {c.ok ? "☑" : "☐"} {c.lab}
              </li>
            ))}
          </ul>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.72rem" }}>全部可选。完成度 0 也可以存档。</p>
        </div>
      </div>
      <NarrativeLog state={state} />
      <div className="hud-right">
        <StatusPanel state={state} />
        <MiniMap state={state} />
        <div className="panel people">
          <div style={{ color: "var(--gold)", letterSpacing: "0.16em", fontSize: "0.78rem" }}>PEOPLE</div>
          {people.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>这一刻没人在你旁边。世界仍在别处忙。</p>
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
        <CommandMenu commands={cmds} onAction={onAction} />
      </div>
    </div>
  );
}
