import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, ProgressBar } from '../components/common';
import { useQuizStore } from '../store/quizStore';
import { questions } from '../../engine/questions.mjs';

const ADVANCE_DELAY_MS = 260; // 选择后 220～320ms 自动进入下一题（§3.3）
const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizPage() {
  const navigate = useNavigate();
  const index = useQuizStore((s) => s.currentQuestionIndex);
  const answers = useQuizStore((s) => s.answers);
  const answer = useQuizStore((s) => s.answer);
  const goTo = useQuizStore((s) => s.goTo);

  const question = questions[index];
  const total = questions.length;

  const startRef = useRef<number>(Date.now());
  const hiddenAtRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // 切题时重置计时；页面切到后台的时间不计入答题时长（§13 / §16）
  useEffect(() => {
    startRef.current = Date.now();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
      } else if (hiddenAtRef.current) {
        startRef.current += Date.now() - hiddenAtRef.current;
        hiddenAtRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [index]);

  const choose = (optionIndex: number) => {
    const duration = Date.now() - startRef.current;
    answer(index, optionIndex, duration);

    if (index === total - 1) return; // 最后一题停在原地，等待点击“生成我的麦门人格”
    timerRef.current = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, ADVANCE_DELAY_MS);
  };

  const selected = answers[index]?.optionIndex;
  const isLast = index === total - 1;

  return (
    <Page>
      <div className="quiz-header">
        <button
          type="button"
          className="back"
          aria-label="返回上一题"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
        >
          ←
        </button>
        <b aria-live="polite">
          {index + 1} / {total}
        </b>
        <span style={{ width: 44 }} aria-hidden="true" />
      </div>

      <ProgressBar value={index + 1} max={total} />

      <section className="question" aria-labelledby="question-title">
        <p className="eyebrow">麦门情境题</p>
        <h2 id="question-title">{question.prompt}</h2>

        <div className="options" role="radiogroup" aria-labelledby="question-title">
          {question.options.map((option: any, i: number) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected === i}
              className={`option${selected === i ? ' is-selected' : ''}`}
              onClick={() => choose(i)}
            >
              <em aria-hidden="true">{LETTERS[i]}</em>
              <span>{option.text}</span>
            </button>
          ))}
        </div>
      </section>

      {isLast ? (
        <div className="btn-row">
          <button
            type="button"
            className="btn"
            disabled={selected === undefined}
            onClick={() => navigate('/calculating')}
          >
            生成我的麦门人格
          </button>
          <p className="muted" style={{ textAlign: 'center' }}>
            还可以用左上角返回按钮修改前面的答案。
          </p>
        </div>
      ) : null}
    </Page>
  );
}
