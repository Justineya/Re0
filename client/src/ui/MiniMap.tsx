import { ADJACENT, DISTRICT_META, districtName } from "../sim/content";
import type { GameState } from "../sim/types";

const CITY = [
  "wing_yard",
  "grass_inn",
  "reed_market",
  "amber_gate_north",
  "tamer_row",
  "forge_clamp",
  "clinic_mirror",
  "south_moss_gate",
  "watch_keep",
  "night_well_alley",
];
const WILD = ["wild_plain", "broken_wing", "oar_bay", "moss_edge", "canal_mouth"];

export function MiniMap({ state }: { state: GameState }) {
  const here = state.world.districtId;
  const adj = new Set(ADJACENT[here] ?? []);
  const render = (ids: string[]) => (
    <ul>
      {ids.map((id) => {
        const cls = id === here ? "here" : adj.has(id) ? "adj" : "";
        return (
          <li key={id} className={cls}>
            {districtName(id)}
            {DISTRICT_META[id]?.locationId !== "loc_amber_crossing" ? " ▹" : ""}
          </li>
        );
      })}
    </ul>
  );
  return (
    <div className="panel minimap">
      <h3 className="status" style={{ padding: 0, margin: 0 }}>
        <span style={{ letterSpacing: "0.16em", color: "var(--gold)", fontSize: "0.78rem" }}>MAP</span>
      </h3>
      <div style={{ marginTop: "0.45rem", color: "var(--muted)", fontSize: "0.72rem" }}>弗莉莉亚</div>
      {render(CITY)}
      <div style={{ marginTop: "0.45rem", color: "var(--muted)", fontSize: "0.72rem" }}>郊外</div>
      {render(WILD)}
    </div>
  );
}
