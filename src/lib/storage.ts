/**
 * 本地存储封装（§12.4 / §16）
 * localStorage 不可用时降级为内存模式，并向上抛出可用性标记，由 UI 提示“刷新后进度不会保留”。
 */

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STORAGE_AVAILABLE = (() => {
  try {
    const probe = '__maimen_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
})();

const memory = new Map<string, string>();

const memoryStorage: StorageLike = {
  getItem: (key) => (memory.has(key) ? (memory.get(key) as string) : null),
  setItem: (key, value) => {
    memory.set(key, value);
  },
  removeItem: (key) => {
    memory.delete(key);
  },
};

export const storage: StorageLike = STORAGE_AVAILABLE ? window.localStorage : memoryStorage;

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* 存储写入失败不应中断主流程 */
  }
}

export function removeKey(key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    /* noop */
  }
}
