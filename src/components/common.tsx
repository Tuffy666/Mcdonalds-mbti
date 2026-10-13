import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { assetUrl } from '../lib/misc';
import { DISCLAIMER_TEXT } from '../config/copy';

/* ------------------------------ 产品插画 ------------------------------ */

export function ProductArt({
  image,
  productImage,
  alt,
  product,
  theme,
  className = 'poster-art',
}: {
  image: string;
  /** 麦当劳官方产品实拍图（本地打包，无跨域问题）；缺省或加载失败时回退到原创插画 */
  productImage?: string;
  alt: string;
  product: string;
  theme: string;
  className?: string;
}) {
  // 展示层级：0=官方产品实拍图 → 1=原创几何插画 → 2=色块占位；上一级加载失败自动降级（§16）
  const [stage, setStage] = useState(productImage ? 0 : 1);
  const [prevProduct, setPrevProduct] = useState(productImage);
  if (productImage !== prevProduct) {
    setPrevProduct(productImage);
    setStage(productImage ? 0 : 1);
  }

  if (stage === 2 || (stage === 0 && !productImage)) {
    return (
      <div
        className={className}
        role="img"
        aria-label={`${alt}（占位图）`}
        style={{
          display: 'grid',
          placeItems: 'center',
          borderRadius: 28,
          background: `linear-gradient(140deg, ${theme}, #FFF8E7)`,
        }}
      >
        <span style={{ fontSize: 40, fontWeight: 800, color: '#fff' }}>{product.slice(0, 1)}</span>
      </div>
    );
  }

  const src = assetUrl(stage === 0 && productImage ? productImage : image);
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setStage(stage === 0 ? 1 : 2)}
    />
  );
}

/* ------------------------------ 进度条 ------------------------------ */

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const percent = Math.round((value / max) * 100);
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={`答题进度 ${percent}%`}
    >
      <i style={{ width: `${percent}%` }} />
    </div>
  );
}

/* ------------------------------ 四维倾向 ------------------------------ */

export interface DimensionPair {
  left: string;
  right: string;
  leftPercent: number;
  rightPercent: number;
  winner: string;
  isBalanced: boolean;
}

const PAIR_META: Record<string, { left: string; right: string }> = {
  EI: { left: '热闹派', right: '独享派' },
  SN: { left: '经典派', right: '尝鲜派' },
  TF: { left: '理性派', right: '感受派' },
  JP: { left: '计划派', right: '随心派' },
};

export function DimensionBars({ dimensions }: { dimensions: Record<string, DimensionPair> }) {
  return (
    <div className="dims">
      {Object.entries(dimensions).map(([key, pair]) => {
        const meta = PAIR_META[key] || { left: pair.left, right: pair.right };
        return (
          <div className="dim-row" key={key}>
            <p>
              <span>
                {meta.left} {pair.left} {pair.leftPercent}%
              </span>
              <span>
                {pair.rightPercent}% {pair.right} {meta.right}
              </span>
            </p>
            <div className="dim-track">
              <i style={{ width: `${pair.leftPercent}%` }} />
              <b style={{ width: `${pair.rightPercent}%` }} />
            </div>
            {pair.isBalanced ? <p className="dim-flag">这一维度非常接近中间值，你会灵活切换。</p> : null}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------ 免责声明弹层 ------------------------------ */

export function DisclaimerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="关于测试与免责声明"
        onClick={(event) => event.stopPropagation()}
      >
        <h2>关于测试</h2>
        <p>{DISCLAIMER_TEXT}</p>
        <h2>彩蛋稀有度怎么理解？</h2>
        <p>
          “彩蛋稀有度”是为了让隐藏人格更好玩而设定的娱乐化数值，<strong>不是真实用户获得率的统计结果</strong>
          ，也没有任何科学测量含义。隐藏人格只有在特定答案组合下才会解锁，解锁不了也很正常。
        </p>
        <h2>数据存在哪里？</h2>
        <p>
          答题进度、最近一次结果和历史记录都只保存在你自己的浏览器（localStorage），不会上传到任何服务器。
          你可以随时清除浏览器数据或在首页“重新测试”来删除它们。
        </p>
        <button type="button" className="btn" onClick={onClose} style={{ marginTop: 8 }}>
          我知道了
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ 轻提示 ------------------------------ */

export function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 2400);
    return () => window.clearTimeout(timer);
  }, [text, onDone]);
  return (
    <div className="toast" role="status">
      {text}
    </div>
  );
}

/* ------------------------------ 页面外壳 ------------------------------ */

export function Page({
  children,
  theme,
  modifier = '',
}: {
  children: ReactNode;
  theme?: string;
  modifier?: string;
}) {
  return (
    <main
      className={`page ${modifier}`.trim()}
      style={theme ? ({ '--theme': theme } as CSSProperties) : undefined}
    >
      {children}
    </main>
  );
}
