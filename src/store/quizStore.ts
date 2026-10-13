/**
 * 答题状态（§12.4）
 * 使用 Zustand；进度与最新结果持久化到 localStorage，历史结果最多保留 10 条。
 */
import { create } from 'zustand';
import { calculateResult } from '../../engine/scoring.mjs';
import { versions, STORAGE_KEYS, HISTORY_LIMIT } from '../../engine/versions.mjs';
import { questions } from '../../engine/questions.mjs';
import { readJson, writeJson, removeKey } from '../lib/storage';

export interface AnswerEntry {
  optionIndex: number;
  answeredAt: number;
  durationMs: number;
  revisionCount: number;
}

export interface StoredProgress {
  currentQuestionIndex: number;
  answers: Record<number, AnswerEntry>;
  startedAt: number;
  updatedAt: number;
  testVersion: string;
}

export interface StoredResultSummary {
  resultId: string;
  mbti: string;
  product: string;
  title: string;
  compatibility: number;
  hiddenName: string | null;
  completedAt: string;
}

interface QuizState {
  currentQuestionIndex: number;
  answers: Record<number, AnswerEntry>;
  startedAt: number;
  hasProgress: boolean;
  latestResult: any | null;
  history: StoredResultSummary[];

  answer: (questionIndex: number, optionIndex: number, durationMs: number) => void;
  goTo: (questionIndex: number) => void;
  prev: () => void;
  reset: () => void;
  computeResult: () => any;
  persistResult: (result: any) => void;
  loadLatest: () => any | null;
  clearHistory: () => void;
}

const emptyProgress = (): StoredProgress => ({
  currentQuestionIndex: 0,
  answers: {},
  startedAt: Date.now(),
  updatedAt: Date.now(),
  testVersion: versions.testVersion,
});

function loadProgress(): StoredProgress {
  const stored = readJson<StoredProgress | null>(STORAGE_KEYS.progress, null);
  if (!stored || stored.testVersion !== versions.testVersion) return emptyProgress();
  return stored;
}

function saveProgress(state: Pick<QuizState, 'currentQuestionIndex' | 'answers' | 'startedAt'>) {
  const payload: StoredProgress = {
    currentQuestionIndex: state.currentQuestionIndex,
    answers: state.answers,
    startedAt: state.startedAt,
    updatedAt: Date.now(),
    testVersion: versions.testVersion,
  };
  writeJson(STORAGE_KEYS.progress, payload);
}

/** 把内部答案结构转换成引擎可消费的形式（保持题序） */
export function toEngineAnswers(answers: Record<number, AnswerEntry>) {
  return questions.map((_, index) => {
    const entry = answers[index];
    if (!entry) return null;
    return {
      questionIndex: index,
      optionIndex: entry.optionIndex,
      durationMs: entry.durationMs,
      revisionCount: entry.revisionCount,
    };
  });
}

const initial = loadProgress();

export const useQuizStore = create<QuizState>((set, get) => ({
  currentQuestionIndex: initial.currentQuestionIndex,
  answers: initial.answers,
  startedAt: initial.startedAt,
  hasProgress: Object.keys(initial.answers).length > 0,
  latestResult: readJson<any | null>(STORAGE_KEYS.latestResult, null),
  history: readJson<StoredResultSummary[]>(STORAGE_KEYS.history, []),

  answer: (questionIndex, optionIndex, durationMs) => {
    const state = get();
    const previous = state.answers[questionIndex];
    const nextAnswers = {
      ...state.answers,
      [questionIndex]: {
        optionIndex,
        answeredAt: Date.now(),
        durationMs: Math.max(0, Math.round(durationMs)),
        revisionCount: previous ? previous.revisionCount + 1 : 0,
      },
    };
    const nextIndex = Math.min(questions.length - 1, questionIndex + 1);
    const isLast = questionIndex === questions.length - 1;

    set({
      answers: nextAnswers,
      currentQuestionIndex: isLast ? questionIndex : nextIndex,
      hasProgress: true,
    });

    saveProgress({
      currentQuestionIndex: isLast ? questionIndex : nextIndex,
      answers: nextAnswers,
      startedAt: state.startedAt,
    });
  },

  goTo: (questionIndex) => {
    const state = get();
    const clamped = Math.max(0, Math.min(questions.length - 1, questionIndex));
    set({ currentQuestionIndex: clamped });
    saveProgress({ ...state, currentQuestionIndex: clamped });
  },

  prev: () => {
    const state = get();
    const clamped = Math.max(0, state.currentQuestionIndex - 1);
    set({ currentQuestionIndex: clamped });
    saveProgress({ ...state, currentQuestionIndex: clamped });
  },

  reset: () => {
    removeKey(STORAGE_KEYS.progress);
    const fresh = emptyProgress();
    set({
      currentQuestionIndex: 0,
      answers: {},
      startedAt: fresh.startedAt,
      hasProgress: false,
    });
  },

  computeResult: () => calculateResult(toEngineAnswers(get().answers)),

  persistResult: (result) => {
    const summary: StoredResultSummary = {
      resultId: result.resultId,
      mbti: result.mbti,
      product: result.personality.product,
      title: result.personality.title,
      compatibility: result.compatibility,
      hiddenName: result.hiddenPersonality ? result.hiddenPersonality.name : null,
      completedAt: result.completedAt,
    };
    const history = [summary, ...get().history.filter((h) => h.resultId !== summary.resultId)].slice(0, HISTORY_LIMIT);
    writeJson(STORAGE_KEYS.latestResult, result);
    writeJson(STORAGE_KEYS.history, history);
    removeKey(STORAGE_KEYS.progress);
    set({ latestResult: result, history, hasProgress: false });
  },

  loadLatest: () => get().latestResult,

  clearHistory: () => {
    removeKey(STORAGE_KEYS.history);
    set({ history: [] });
  },
}));
