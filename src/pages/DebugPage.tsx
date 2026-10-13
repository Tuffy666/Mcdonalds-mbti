import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../components/common';
import { useQuizStore } from '../store/quizStore';
import { calculateResult, stableHash } from '../../engine/scoring.mjs';
import { buildProfile, buildClipboardPayload } from '../../engine/profile.mjs';
import { buildMealPlan } from '../../engine/meal-plan.mjs';
import { personalities, PERSONALITY_TYPES } from '../../engine/personalities.mjs';
import { hiddenPersonalities } from '../../engine/hidden.mjs';
import { questions } from '../../engine/questions.mjs';
import { validateConfig } from '../../engine/validate.mjs';

/**
 * 开发调试器（§18）
 * 仅当 import.meta.env.DEV 为 true 时注册路由，生产构建不会包含该页面。
 */
export default function DebugPage() {
  const [forceType, setForceType] = useState<string>('');
  const [forceHidden, setForceHidden] = useState<string>('');
  const [out, setOut] = useState<string>('');
  const reset = useQuizStore((s) => s.reset);

  const config = useMemo(() => validateConfig(), []);

  const previewResult = useMemo(() => {
    // 用一个可复现的答案集作为调试底稿
    const base = questions.map((_, i) => (i % 2 === 0 ? 0 : 3));
    const result = calculateResult(base);
    return result;
  }, []);

  const buildForced = () => {
    const result: any = JSON.parse(JSON.stringify(previewResult));
    if (forceType && (personalities as any)[forceType]) {
      result.mbti = forceType;
      result.personality = (personalities as any)[forceType];
    }
    if (forceHidden) {
      const hidden = hiddenPersonalities.find((h) => h.id === forceHidden);
      result.hiddenPersonality = hidden || null;
    } else if (forceHidden === '__none__') {
      result.hiddenPersonality = null;
    }
    return result;
  };

  const dump = (label: string, value: unknown) => {
    setOut(`${label}\n${JSON.stringify(value, null, 2)}`);
  };

  const writeLatest = () => {
    const result = buildForced();
    const store = useQuizStore.getState();
    store.persistResult(result);
    setOut(`已写入本地结果：${result.mbti}${result.hiddenPersonality ? ` + ${result.hiddenPersonality.name}` : ''}`);
  };

  return (
    <Page>
      <p className="eyebrow">开发调试器（仅开发环境）</p>
      <h1 style={{ fontSize: 22 }}>强制预览与自检</h1>

      <h3 className="section-title">配置校验</h3>
      <div className="prose">
        <p>
          {config.ok ? '✅ 配置校验通过' : '❌ 配置校验失败'}
          {config.warnings.length ? `（${config.warnings.length} 条提示）` : ''}
        </p>
      </div>
      <div className="debug-grid" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn--ghost" onClick={() => dump('配置校验报告', config)}>
          查看校验报告
        </button>
      </div>

      <h3 className="section-title">强制主人格（16 型）</h3>
      <div className="debug-grid">
        {PERSONALITY_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setForceType(type);
              dump('强制预览', { mbti: type, product: (personalities as any)[type].product });
            }}
          >
            {type} · {(personalities as any)[type].product}
          </button>
        ))}
      </div>

      <h3 className="section-title">强制隐藏人格（8 种）</h3>
      <div className="debug-grid">
        <button type="button" className="btn btn--ghost" onClick={() => setForceHidden('__none__')}>
          强制无隐藏人格
        </button>
        {hiddenPersonalities.map((h) => (
          <button key={h.id} type="button" className="btn btn--ghost" onClick={() => setForceHidden(h.id)}>
            {h.name} · 彩蛋稀有度 {h.rarityLabel}
          </button>
        ))}
      </div>

      <p className="muted" style={{ marginTop: 12 }}>
        当前强制：主人格 {forceType || '未设置'} / 隐藏人格 {forceHidden || '未设置'}（
        <Link to="/result">打开结果页</Link>）
      </p>

      <div className="btn-row">
        <button type="button" className="btn" onClick={writeLatest}>
          写入本地结果并跳转结果页
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => dump('原始分数与四维百分比', {
            scores: previewResult.rawScores,
            dimensions: previewResult.dimensions,
            percentMap: previewResult.percentMap,
          })}
        >
          查看原始分数与百分比
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => dump('隐藏人格判定明细', previewResult.hiddenEvaluated)}
        >
          查看隐藏人格判定明细
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            const tied = questions.map((q, i) => (i % 2 === 0 ? 0 : 3));
            dump('模拟完全同分', {
              sequence: tied.join(''),
              hash: stableHash(`${tied.join('')}|1.0.0`),
              result: calculateResult(tied).mbti,
            });
          }}
        >
          模拟完全同分
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => dump('人格档案 JSON', buildProfile(previewResult))}
        >
          导出人格档案 JSON
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() =>
            dump('复制给 WorkBuddy 的载荷', buildClipboardPayload(buildProfile(previewResult)))
          }
        >
          查看剪贴板载荷
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => dump('无菜单时的套餐方案', buildMealPlan(buildProfile(previewResult), []))}
        >
          检查套餐方案生成
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            reset();
            setOut('已清空本地进度');
          }}
        >
          清空本地进度
        </button>
      </div>

      {out ? <pre className="debug-out">{out}</pre> : null}
    </Page>
  );
}
