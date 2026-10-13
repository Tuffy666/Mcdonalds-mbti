/**
 * 版本信息（§12.5）
 * 修改题目、选项或题序 → 更新 testVersion
 * 修改权重与决胜规则   → 更新 scoringVersion
 * 修改人格映射或文案   → 更新 personalityVersion
 */
export const versions = {
  testVersion: '1.0.0',
  scoringVersion: '1.0.0',
  personalityVersion: '1.0.0',
};

/** 人格档案（交给 WorkBuddy + 麦当劳 MCP 消费）的 schema 版本 */
export const PROFILE_SCHEMA_VERSION = '1.0.0';

export const STORAGE_KEYS = {
  progress: 'maimen.quiz.progress.v1',
  latestResult: 'maimen.quiz.latestResult.v1',
  history: 'maimen.quiz.history.v1',
  preferences: 'maimen.preferences.v1',
};

export const HISTORY_LIMIT = 10;
