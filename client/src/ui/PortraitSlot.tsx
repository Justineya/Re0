import caitUrl from "@portraits/placeholders/cait_sith.svg?url";
import sylphUrl from "@portraits/placeholders/sylph.svg?url";
import { raceById } from "../sim/content";
import { npcById } from "../sim/content";

type Props = {
  race: string;
  name: string;
  role?: string;
  npcId?: string | null;
};

function Placeholder({ race, label }: { race: string; label: string }) {
  const rec = raceById(race);
  const p = rec?.palette.primary ?? "#E6A23C";
  const s = rec?.palette.secondary ?? "#1A2214";
  return (
    <svg viewBox="0 0 256 320" role="img" aria-label={label}>
      <rect width="256" height="320" fill={p} />
      <rect x="16" y="16" width="224" height="288" fill={s} rx="8" />
      <circle cx="128" cy="118" r="44" fill={p} />
      <ellipse cx="48" cy="168" rx="30" ry="54" fill={p} opacity="0.75" />
      <ellipse cx="208" cy="168" rx="30" ry="54" fill={p} opacity="0.75" />
      <rect x="108" y="168" width="40" height="78" rx="8" fill={p} />
      <text x="128" y="300" textAnchor="middle" fill="#F5E6C8" fontSize="16">
        {rec?.name_zh ?? label}
      </text>
    </svg>
  );
}

export function PortraitSlot({ race, name, role, npcId }: Props) {
  const npc = npcId ? npcById(npcId) : undefined;
  const r = npc?.race ?? race;
  const url = r === "cait_sith" ? caitUrl : r === "sylph" ? sylphUrl : null;
  return (
    <div className="panel portrait-slot">
      {url ? <img src={url} alt={name} /> : <Placeholder race={r} label={name} />}
      <div className="portrait-name">{name}</div>
      <div className="portrait-meta">
        {raceById(r)?.name_zh}
        {role ? ` · ${role}` : ""}
      </div>
    </div>
  );
}
