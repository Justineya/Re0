import type { CommandDef, GameAction } from "../sim/types";

const GROUP_ZH: Record<CommandDef["group"], string> = {
  combat: "战斗",
  move: "移动",
  talk: "交谈",
  act: "行动",
  wait: "等待",
  meta: "其他",
};

const ORDER: CommandDef["group"][] = ["combat", "act", "talk", "move", "wait", "meta"];

export function CommandMenu({
  commands,
  onAction,
}: {
  commands: CommandDef[];
  onAction: (a: GameAction) => void;
}) {
  const groups = ORDER.map((g) => ({ g, items: commands.filter((c) => c.group === g) })).filter(
    (x) => x.items.length,
  );
  return (
    <div className="panel cmd">
      <div className="cmd-head">
        <span>COMMAND</span>
        <span style={{ color: "var(--muted)", letterSpacing: "0.04em" }}>选择行动 · 不是聊天框</span>
      </div>
      <div className="cmd-groups">
        {groups.map(({ g, items }) => (
          <div key={g} className="cmd-row">
            <div className="group-lab">{GROUP_ZH[g]}</div>
            {items.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`btn ${c.warn ? "warn" : ""} ${c.accent ? "primary" : ""}`}
                title={c.hint}
                onClick={() => onAction(c.action)}
              >
                {c.label}
                {c.hint ? <span style={{ opacity: 0.65, marginLeft: 6, fontSize: "0.72rem" }}>{c.hint}</span> : null}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
