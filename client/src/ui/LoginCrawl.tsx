import { LOGIN_CRAWL } from "../sim/narrative";

export function LoginCrawl({ onFinish, onSkip }: { onFinish: () => void; onSkip: () => void }) {
  return (
    <div className="screen-center">
      <div className="panel crawl">
        <p className="crawl-kicker">登录前请读完 · 30 秒</p>
        <h2 className="crawl-title">你会先搞清楚三件事</h2>
        <ol className="crawl-list">
          {LOGIN_CRAWL.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <p className="crawl-next">
          点「开始入门」后进入试飞场。屏幕下方会出现<strong>黄色高亮按钮</strong>——先点它。左侧「现在该做什么」会告诉你下一步。
        </p>
        <div className="ops">
          <button type="button" className="btn primary" onClick={onFinish}>
            开始入门
          </button>
          <button type="button" className="btn ghost" onClick={onSkip}>
            跳过入门，直接玩
          </button>
        </div>
      </div>
    </div>
  );
}
