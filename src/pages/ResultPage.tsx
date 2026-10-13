import { useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DimensionBars,
  DisclaimerModal,
  Page,
  ProductArt,
  Toast,
} from '../components/common';
import { DISCLAIMER_SHORT } from '../config/copy';
import { buildClipboardPayload } from '../../engine/profile.mjs';
import { buildShareText } from '../../engine/scoring.mjs';
import {
  POSTER_EXPORT,
  canWebShare,
  copyText,
  downloadDataUrl,
  exportNodeToPng,
  shareText,
} from '../lib/exportImage';
import { posterFileName } from '../lib/misc';
import { useQuizStore } from '../store/quizStore';
import { assetUrl } from '../lib/misc';

export default function ResultPage() {
  const navigate = useNavigate();
  const result = useQuizStore((s) => s.latestResult);
  const reset = useQuizStore((s) => s.reset);
  const [toast, setToast] = useState('');
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fallbackCopy, setFallbackCopy] = useState<string | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  const profile = useMemo(() => (result ? buildClipboardPayload(result as any) : null), [result]);

  if (!result) {
    return (
      <Page>
        <p className="eyebrow">还没有结果</p>
        <h1>先完成测试吧</h1>
        <p className="lead" style={{ marginTop: 12 }}>
          直接访问结果页时，本地没有可用的结果记录。
        </p>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => navigate('/', { replace: true })}>
            回到首页
          </button>
        </div>
      </Page>
    );
  }

  const p = result.personality;
  const theme = p.themeColor;
  const shareTextA = buildShareText(result, 'A');
  const shareTextB = result.hiddenPersonality ? buildShareText(result, 'B') : '';
  const shareTextC = buildShareText(result, 'C');

  const onSavePoster = async () => {
    if (!posterRef.current) return;
    setBusy(true);
    const res = await exportNodeToPng(posterRef.current, {
      pixelRatio: POSTER_EXPORT.pixelRatio,
      width: POSTER_EXPORT.width,
      height: POSTER_EXPORT.height,
      style: {
        width: `${POSTER_EXPORT.width}px`,
        minHeight: `${POSTER_EXPORT.height}px`,
        maxWidth: 'none',
      },
    });
    setBusy(false);
    if (res.ok && res.dataUrl) {
      downloadDataUrl(res.dataUrl, posterFileName(result.mbti));
      setToast('结果卡已保存为 PNG（1080 × 1440）');
    } else {
      setToast('图片导出失败，可以先用浏览器截图，或复制分享文案');
    }
  };

  const onCopy = async (text: string, label: string) => {
    const ok = await copyText(text);
    if (ok) {
      setToast(`${label}已复制`);
    } else {
      // 自动复制被 WebView/浏览器拒绝时，弹出手动复制面板（内容自动全选）
      setFallbackCopy(text);
    }
  };

  const onShare = async () => {
    const ok = await shareText(`${shareTextA}\n\n${DISCLAIMER_SHORT}`, '麦门人格研究所');
    if (!ok) setToast('当前浏览器不支持原生分享，已为你准备复制按钮');
  };

  const onRetest = () => {
    reset();
    navigate('/quiz');
  };

  return (
    <Page theme={theme} modifier="result">
      <div className="poster" ref={posterRef} style={{ '--theme': theme } as CSSProperties}>
        <div className="poster-head">
          <p className="eyebrow" style={{ margin: 0 }}>
            麦门人格研究所
          </p>
          <span className="rarity">非官方·趣味测试</span>
        </div>

        {/* 1. 产品图与 MBTI 字母 */}
        <ProductArt
          image={p.image}
          productImage={p.productImage}
          alt={`${p.product}（${p.title}）官方产品图，加载失败时显示原创拟人插画`}
          product={p.product}
          theme={theme}
        />

        <h1>
          {result.mbti}｜{p.product}
        </h1>
        {/* 2. 人格标题与宣言 */}
        <h2>{p.title}</h2>
        <blockquote>{p.declaration}</blockquote>

        {/* 3. 麦门契合度 */}
        <div className="score">
          <strong>{result.compatibility}%</strong>
          <span>麦门契合度</span>
        </div>

        {/* 4. 四维倾向 */}
        <DimensionBars dimensions={result.dimensions} />

        {/* 9. 隐藏人格卡 */}
        {result.hiddenPersonality ? (
          <div className="hidden-card">
            <span className="rarity">
              隐藏人格 · 彩蛋稀有度 {result.hiddenPersonality.rarityLabel}
            </span>
            <h3>{result.hiddenPersonality.name}</h3>
            <p style={{ fontSize: 13.5, marginTop: 4 }}>{result.hiddenPersonality.declaration}</p>
            <p style={{ fontSize: 12.5, marginTop: 8, color: 'var(--c-muted)' }}>
              彩蛋稀有度是娱乐化设定，并非真实用户统计结果。
            </p>
          </div>
        ) : null}

        {/* 11. 分享金句 */}
        <div className="callout" style={{ background: 'rgba(255,255,255,.78)', borderLeftColor: theme }}>
          「{p.shareQuote}」
        </div>

        <footer>
          非官方趣味测试，仅供娱乐。{DISCLAIMER_SHORT}
        </footer>
      </div>

      {/* 5. 完整人格解读 */}
      <h3 className="section-title">完整人格解读</h3>
      <div className="prose">
        <p>{p.description}</p>
      </div>

      {/* 6. 麦门日常 */}
      <h3 className="section-title">麦门日常</h3>
      <div className="prose">
        <ul>
          {p.dailyTraits.map((t: string) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      {/* 7. 隐藏软肋与被误解 */}
      <h3 className="section-title">隐藏软肋</h3>
      <div className="prose">
        <p>{p.weakness}</p>
      </div>
      <h3 className="section-title">大家容易误解你</h3>
      <div className="prose">
        <p>{p.misunderstood}</p>
      </div>

      {/* 8. 最佳饭搭子 */}
      <h3 className="section-title">最佳饭搭子</h3>
      <div className="prose">
        <p>{p.bestMatchText}</p>
        <p style={{ marginTop: 8 }}>
          <Link to={`/gallery/${p.bestMatchType}`}>看看 TA 的完整人格 →</Link>
        </p>
      </div>

      {/* 9/10. 隐藏人格与反差解释 */}
      {result.hiddenPersonality ? (
        <>
          <h3 className="section-title">隐藏人格：{result.hiddenPersonality.name}</h3>
          <div className="prose">
            <p>{result.hiddenPersonality.description}</p>
            <p style={{ marginTop: 8 }}>
              <strong>关键词：</strong>
              {result.hiddenPersonality.keywords}
            </p>
            <p style={{ marginTop: 8 }}>
              <strong>麦门表现：</strong>
              {result.hiddenPersonality.storeScene}
            </p>
            <p style={{ marginTop: 8 }}>
              <strong>隐藏软肋：</strong>
              {result.hiddenPersonality.weakness}
            </p>
          </div>
          <div className="callout">
            <strong>反差解释：</strong>
            {result.contrastText}
          </div>
        </>
      ) : (
        <>
          <h3 className="section-title">隐藏人格</h3>
          <div className="prose">
            <p>
              这次没有触发任何隐藏彩蛋。隐藏人格只在特定答案组合下解锁，没解锁也很正常 ——
              它更像是一个“麦门时刻”的彩蛋，而不是对你本人的评价。
            </p>
            {result.hint ? <p style={{ marginTop: 8 }}>{result.hint}</p> : null}
          </div>
        </>
      )}

      {/* 今日人格套餐（麦当劳 MCP 联动） */}
      <h3 className="section-title">今日人格套餐</h3>
      <div className="prose">
        <p>
          把人格档案复制到已连接麦当劳 MCP 的 WorkBuddy，就能基于<strong>你附近门店的实时菜单</strong>
          生成一份“今日人格套餐”：先给无券价格，你点头之后才会去查优惠券。
        </p>
      </div>

      {/* 12. 操作区 */}
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => profile && onCopy(profile, '人格档案')}>
          复制人格档案 · 生成今日人格套餐
        </button>
        <button type="button" className="btn btn--ghost" disabled={busy} onClick={onSavePoster}>
          {busy ? '正在生成图片…' : '保存结果卡（1080 × 1440 PNG）'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => onCopy(shareTextA, '分享文案')}>
          复制分享文案
        </button>
        {result.hiddenPersonality ? (
          <button type="button" className="btn btn--ghost" onClick={() => onCopy(shareTextB, '彩蛋文案')}>
            复制彩蛋文案
          </button>
        ) : null}
        <button type="button" className="btn btn--ghost" onClick={() => onCopy(shareTextC, '四维文案')}>
          复制四维总结文案
        </button>
        {canWebShare() ? (
          <button type="button" className="btn btn--ghost" onClick={onShare}>
            分享给朋友
          </button>
        ) : null}
        <Link className="btn btn--ghost" to="/gallery" style={{ textDecoration: 'none' }}>
          查看 16 型人格图鉴
        </Link>
        <button type="button" className="btn btn--ghost" onClick={onRetest}>
          重新测试
        </button>
      </div>

      <p className="disclaimer" style={{ marginTop: 24 }}>
        {DISCLAIMER_SHORT}
        <button type="button" className="inline-link" onClick={() => setDisclaimerOpen(true)}>
          查看完整免责声明
        </button>
      </p>

      <img src={assetUrl('assets/hero.svg')} alt="" aria-hidden="true" style={{ display: 'none' }} />

      <DisclaimerModal open={disclaimerOpen} onClose={() => setDisclaimerOpen(false)} />

      {fallbackCopy !== null ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="手动复制">
          <div className="modal">
            <h2>请手动复制</h2>
            <p>
              当前浏览器环境限制了自动复制。内容已为你全选 —— 手机长按文字选择「拷贝」，
              电脑按 <strong>Ctrl+C</strong>（Mac 为 ⌘C）即可。
            </p>
            <textarea
              className="copy-area"
              readOnly
              value={fallbackCopy}
              autoFocus
              onFocus={(e) => e.currentTarget.select()}
              rows={8}
            />
            <div className="btn-row" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  const ok = await copyText(fallbackCopy);
                  if (ok) {
                    setFallbackCopy(null);
                    setToast('已复制');
                  }
                }}
              >
                再试一次自动复制
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setFallbackCopy(null)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <Toast text={toast} onDone={() => setToast('')} /> : null}
    </Page>
  );
}
