import { LOGIN_CRAWL } from "../sim/narrative";

export function LoginCrawl({ onFinish, onSkip }: { onFinish: () => void; onSkip: () => void }) {
  return (
    <div className="screen-center">
      <div className="panel crawl">
        {LOGIN_CRAWL.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <div className="ops">
          <button type="button" className="btn primary" onClick={onFinish}>
            落地
          </button>
          <button type="button" className="btn ghost" onClick={onSkip}>
            跳过
          </button>
        </div>
      </div>
    </div>
  );
}
