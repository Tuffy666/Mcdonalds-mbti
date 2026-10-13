import { Link, useParams } from 'react-router-dom';
import { Page, ProductArt } from '../components/common';
import { GROUP_DESC } from '../config/copy';
import { personalities, GROUP_ORDER, GROUP_THEME } from '../../engine/personalities.mjs';

export function GalleryPage() {
  return (
    <Page>
      <p className="eyebrow">16 型人格图鉴</p>
      <h1 style={{ fontSize: 24 }}>你想成为哪一款？</h1>
      <p className="lead" style={{ marginTop: 12 }}>
        图鉴只负责介绍，不负责剧透 —— 你的结果仍然由那 20 道题决定。
      </p>

      {(GROUP_ORDER as string[]).map((group) => {
        const theme = (GROUP_THEME as Record<string, { label: string; color: string; accent: string }>)[group];
        const list = Object.values(personalities).filter((p: any) => p.group === group);
        return (
          <section className="group-block" key={group}>
            <div className="group-head">
              <span className="group-dot" style={{ background: theme.color }} />
              <span>{theme.label}</span>
            </div>
            <p className="muted" style={{ marginBottom: 12 }}>
              {GROUP_DESC[group]}
            </p>
            <div className="gallery-grid">
              {list.map((p: any) => (
                <Link className="gallery-card" to={`/gallery/${p.type}`} key={p.type}>
                  <ProductArt
                    image={p.image}
                    productImage={p.productImage}
                    alt={`${p.product}（${p.title}）官方产品图，加载失败时显示原创拟人插画`}
                    product={p.product}
                    theme={p.themeColor}
                    className="gallery-art"
                  />
                  <strong>{p.product}</strong>
                  <small>
                    {p.type} · {p.title}
                  </small>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <div className="btn-row" style={{ marginTop: 24 }}>
        <Link className="btn" to="/quiz" style={{ textDecoration: 'none' }}>
          开始我的测试
        </Link>
        <Link className="btn btn--ghost" to="/" style={{ textDecoration: 'none' }}>
          回到首页
        </Link>
      </div>
    </Page>
  );
}

export function PersonalityDetailPage() {
  const { type } = useParams<{ type: string }>();
  const p = type ? (personalities as any)[type.toUpperCase()] : null;

  if (!p) {
    return (
      <Page>
        <p className="eyebrow">未找到</p>
        <h1>没有这个人格型号</h1>
        <div className="btn-row">
          <Link className="btn" to="/gallery" style={{ textDecoration: 'none' }}>
            返回图鉴
          </Link>
        </div>
      </Page>
    );
  }

  const theme = GROUP_THEME[p.group as keyof typeof GROUP_THEME];
  const best = (personalities as any)[p.bestMatchType];

  return (
    <Page theme={p.themeColor}>
      <p className="eyebrow">{theme.label}</p>
      <h1 style={{ fontSize: 26 }}>
        {p.product}型 · {p.title}
      </h1>
      <p className="muted" style={{ marginTop: 6 }}>
        {p.type}
      </p>

      <ProductArt
        image={p.image}
        productImage={p.productImage}
        alt={`${p.product}（${p.title}）官方产品图，加载失败时显示原创拟人插画`}
        product={p.product}
        theme={p.themeColor}
        className="poster-art"
      />

      <blockquote
        style={{
          margin: '0 0 16px',
          padding: '12px 16px',
          borderLeft: `4px solid ${p.themeColor}`,
          background: 'rgba(255,255,255,.7)',
          borderRadius: '0 16px 16px 0',
          fontWeight: 600,
        }}
      >
        {p.declaration}
      </blockquote>

      <h3 className="section-title">核心解读</h3>
      <div className="prose">
        <p>{p.description}</p>
      </div>

      <h3 className="section-title">麦门日常</h3>
      <div className="prose">
        <ul>
          {p.dailyTraits.map((t: string) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <h3 className="section-title">隐藏软肋</h3>
      <div className="prose">
        <p>{p.weakness}</p>
      </div>

      <h3 className="section-title">大家容易误解你</h3>
      <div className="prose">
        <p>{p.misunderstood}</p>
      </div>

      <h3 className="section-title">最佳饭搭子</h3>
      <div className="prose">
        <p>{p.bestMatchText}</p>
        {best ? (
          <p style={{ marginTop: 8 }}>
            <Link to={`/gallery/${best.type}`}>查看 {best.product}型 →</Link>
          </p>
        ) : null}
      </div>

      <h3 className="section-title">分享金句</h3>
      <div className="prose">
        <p>「{p.shareQuote}」</p>
      </div>

      <div className="btn-row">
        <Link className="btn" to="/quiz" style={{ textDecoration: 'none' }}>
          开始我的测试
        </Link>
        <Link className="btn btn--ghost" to="/gallery" style={{ textDecoration: 'none' }}>
          返回图鉴
        </Link>
      </div>
    </Page>
  );
}
