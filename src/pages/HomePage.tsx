import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Page, DisclaimerModal } from '../components/common';
import { APP_LEAD, APP_NAME, APP_SUBTITLE, DISCLAIMER_TEXT } from '../config/copy';
import { assetUrl } from '../lib/misc';
import { useQuizStore } from '../store/quizStore';
import { questions } from '../../engine/questions.mjs';

export default function HomePage() {
  const navigate = useNavigate();
  const hasProgress = useQuizStore((s) => s.hasProgress);
  const reset = useQuizStore((s) => s.reset);
  const answeredCount = useQuizStore((s) => Object.keys(s.answers).length);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  const startFresh = () => {
    reset();
    navigate('/quiz');
  };

  return (
    <Page modifier="home">
      <p className="eyebrow">{APP_NAME}</p>
      <h1>
        {APP_SUBTITLE}
      </h1>
      <p className="lead" style={{ marginTop: 12 }}>
        {APP_LEAD}
      </p>

      <img
        className="hero-art"
        src={assetUrl('assets/hero.svg')}
        alt="麦门人格研究所原创主视觉插画"
        width={520}
        height={320}
      />

      <ul className="chips">
        <li className="chip">约 2～3 分钟</li>
        <li className="chip">无需登录</li>
        <li className="chip">结果仅供娱乐</li>
      </ul>

      {hasProgress ? (
        <>
          <button type="button" className="btn" onClick={() => navigate('/quiz')}>
            继续上次测试（已完成 {answeredCount} / {questions.length}）
          </button>
          <div className="btn-row">
            <button type="button" className="btn btn--ghost" onClick={startFresh}>
              重新开始
            </button>
          </div>
        </>
      ) : (
        <>
          <button type="button" className="btn" onClick={startFresh}>
            开始测试
          </button>
          <div className="btn-row">
            <Link className="btn btn--ghost" to="/gallery" style={{ textDecoration: 'none' }}>
              看看 16 型人格
            </Link>
          </div>
        </>
      )}

      <p className="disclaimer">
        {DISCLAIMER_TEXT}
        <br />
        <button type="button" className="inline-link" onClick={() => setDisclaimerOpen(true)}>
          查看完整说明
        </button>
        {' · '}
        <Link className="inline-link" to="/about">
          测试说明
        </Link>
      </p>

      <DisclaimerModal open={disclaimerOpen} onClose={() => setDisclaimerOpen(false)} />
    </Page>
  );
}
