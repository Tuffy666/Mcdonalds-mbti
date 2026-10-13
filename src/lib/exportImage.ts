/**
 * 结果卡导出（§10.2 / §16）
 * 使用 html-to-image 导出指定 DOM 为 PNG，失败时给出降级提示。
 */
import { toPng } from 'html-to-image';

export interface ExportResult {
  ok: boolean;
  dataUrl?: string;
  reason?: string;
}

export interface ExportOptions {
  pixelRatio?: number;
  width?: number;
  height?: number;
  style?: Partial<CSSStyleDeclaration>;
}

/** 竖版结果卡目标尺寸 1080 × 1440（§10.2），导出时以 540 × 720 逻辑尺寸 × 2 倍像素比实现 */
export const POSTER_EXPORT = {
  width: 540,
  height: 720,
  pixelRatio: 2,
};

export async function exportNodeToPng(node: HTMLElement, options: ExportOptions = {}): Promise<ExportResult> {
  const { pixelRatio = 2, width, height, style } = options;
  try {
    const dataUrl = await toPng(node, {
      pixelRatio,
      cacheBust: true,
      backgroundColor: '#FFF8E7',
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
      ...(style ? { style: style as Record<string, string> } : {}),
    });
    return { ok: true, dataUrl };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

export function downloadDataUrl(dataUrl: string, fileName: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function canWebShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export async function shareText(text: string, title: string): Promise<boolean> {
  if (!canWebShare()) return false;
  try {
    await navigator.share({ title, text });
    return true;
  } catch {
    return false;
  }
}

/**
 * 多级降级的文本复制。
 * 1) Async Clipboard API —— 需要安全上下文 + 用户激活，部分 WebView 会拒绝；
 * 2) 隐藏 textarea + execCommand —— iOS Safari / 部分 WebView 不复制完全透明
 *    的元素，因此 opacity 用 0.01，并显式 focus + setSelectionRange；
 * 3) 仍失败时返回 false，由调用方弹出手动复制弹窗（ResultPage）。
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 降级到 execCommand */
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.contentEditable = 'true';
    area.style.position = 'fixed';
    area.style.top = '0';
    area.style.left = '0';
    area.style.width = '2em';
    area.style.height = '2em';
    area.style.padding = '0';
    area.style.border = 'none';
    area.style.outline = 'none';
    area.style.boxShadow = 'none';
    area.style.background = 'transparent';
    area.style.opacity = '0.01';
    document.body.appendChild(area);

    // 保留用户当前选区，复制完成后恢复
    const selection = document.getSelection();
    const savedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');

    area.remove();
    if (savedRange && selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
    if (ok) return true;
  } catch {
    /* 落到手动复制 */
  }

  return false;
}
