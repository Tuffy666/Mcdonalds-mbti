/** 资源路径：兼容部署在子路径下的情况 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const clean = path.replace(/^\/+/, '');
  return `${base}${base.endsWith('/') ? '' : '/'}${clean}`;
}

/** 题号 → 中文序号，用于进度文案 */
export function formatQuestionNo(index: number, total: number): string {
  return `${index + 1} / ${total}`;
}

/** 结果卡文件名 */
export function posterFileName(mbti: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `麦门人格-${mbti}-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.png`;
}
