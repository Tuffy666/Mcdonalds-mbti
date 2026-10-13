import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '../components/common';
import { CALCULATION_STEPS } from '../config/copy';
import { useQuizStore } from '../store/quizStore';
import { questions } from '../../engine/questions.mjs';

const STEP_MS = 440; // 4 步 × 440ms ≈ 1.76s，落在 1.5～2 秒区间（§3.3）
const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

export default function CalculatingPage() {
  const navigate = useNavigate();
  const answeredCount = useQuizStore((s) => Object.keys(s.answers).length);
  const computeResult = useQuizStore((s) => s.computeResult);
  const persistResult = useQuizStore((s) => s.persistResult);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // 未答完不能生成结果（§16）
    if (answeredCount < questions.length) {
      navigate('/quiz', { replace: true });
      return undefined;
    }

    if (prefersReducedMotion) {
      const result = computeResult();
      persistResult(result);
      navigate('/result', { replace: true });
      return undefined;
    }

    const timers: number[] = [];
    CALCULATION_STEPS.forEach((_, i) => {
      timers.push(window.setTimeout(() => setStep(i), i * STEP_MS));
    });
    timers.push(
      window.setTimeout(() => {
        const result = computeResult();
        persistResult(result);
        navigate('/result', { replace: true });
      }, CALCULATION_STEPS.length * STEP_MS),
    );

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [answeredCount, computeResult, persistResult, navigate]);

  return (
    <Page>
      <div className="calc" aria-live="polite">
        <div className="calc-spinner" aria-hidden="true" />
        <ul className="calc-steps">
          {CALCULATION_STEPS.map((text, i) => (
            <li key={text} className={i <= step ? 'is-active' : ''}>
              {text}
            </li>
          ))}
        </ul>
        <p className="muted">结果仅供娱乐，不作为心理测评依据。</p>
      </div>
    </Page>
  );
}
