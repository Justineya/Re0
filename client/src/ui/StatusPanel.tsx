import { calendarLabel, clockLabel, todFromHour, TOD_ZH } from "../sim/time";
import { districtName, locationName, raceById } from "../sim/content";
import { weatherZh } from "../sim/narrative";
import type { GameState } from "../sim/types";

function Bar({
  cls,
  lab,
  v,
  max,
}: {
  cls: string;
  lab: string;
  v: number;
  max: number;
}) {
  const pct = Math.max(0, Math.min(100, (v / max) * 100));
  return (
    <div className={`bar ${cls}`}>
      <span className="lab">{lab}</span>
      <div className="track">
        <i style={{ width: `${pct}%` }} />
      </div>
      <span className="num">{Math.round(v)}</span>
    </div>
  );
}

export function StatusPanel({ state }: { state: GameState }) {
  const p = state.player;
  const w = state.world;
  const race = raceById(p.race);
  const staWarn = p.sta <= 20;
  const staCrit = p.sta <= 5;
  return (
    <div className="panel status">
      <h3>STATUS</h3>
      <div className="stat-kv">
        <span>时间</span>
        <b>
          {calendarLabel(w)} {clockLabel(w)}
        </b>
      </div>
      <div className="stat-kv">
        <span>地点</span>
        <b>
          {locationName(w.locationId)} · {districtName(w.districtId)}
        </b>
      </div>
      <div className="stat-kv">
        <span>时段 / 天气</span>
        <b>
          {TOD_ZH[todFromHour(w.hourOfDay)]} · {weatherZh(w.weather)}
        </b>
      </div>
      <div className="stat-kv">
        <span>种族 / 身份</span>
        <b>
          {race?.name_zh} · {p.origin}
        </b>
      </div>
      <Bar cls="hp" lab="HP" v={p.hp} max={p.hpMax} />
      <Bar cls="mp" lab="MP" v={p.mp} max={p.mpMax} />
      <Bar cls="sta" lab="STA" v={p.sta} max={p.staMax} />
      <Bar cls="sat" lab="SAT" v={p.sat} max={p.satMax} />
      <Bar cls="dur" lab="DUR" v={p.dur} max={100} />
      <div className="stat-kv">
        <span>Yrd</span>
        <b>{p.yrd}</b>
      </div>
      <div className="stat-kv">
        <span>危险度</span>
        <b>{w.danger}</b>
      </div>
      <div className="stat-kv">
        <span>价格指数</span>
        <b>{w.priceIndex.toFixed(2)}</b>
      </div>
      <div className="stat-kv">
        <span>情报权限</span>
        <b>本地</b>
      </div>
      {staWarn && <div className="warn-line">精力 ≤20%　强制降落协议将在 0% 启动</div>}
      {staCrit && <div className="warn-line">视野边缘发暗。落地。现在。</div>}
      {p.flying && (
        <div className="stat-kv">
          <span>高度</span>
          <b>{Math.round(p.heightFt)} 尺 · {p.flightMode}</b>
        </div>
      )}
    </div>
  );
}
