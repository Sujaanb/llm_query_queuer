import { normalizePromptText, promptTextMatches } from '../../lib/text';
import { findVisible } from './dom';
import type { ComposerInsertionResult } from './types';

const INSERT_WAIT_MS = 500;
export function readComposer(composer: HTMLElement | null): string { return normalizePromptText(composer instanceof HTMLTextAreaElement ? composer.value : composer?.innerText || composer?.textContent || ''); }
function selectContents(element: HTMLElement): void { const selection = getSelection(); const range = document.createRange(); range.selectNodeContents(element); selection?.removeAllRanges(); selection?.addRange(range); }
function setTextarea(element: HTMLTextAreaElement, value: string): void { const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set; if (!setter) throw new Error('Native textarea setter unavailable'); setter.call(element, value); element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value })); element.dispatchEvent(new Event('change', { bubbles: true })); }
function directText(element: HTMLElement, value: string): void { element.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: value })); element.replaceChildren(document.createTextNode(value)); element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value })); }
export async function waitUntil(predicate: () => boolean, timeoutMs: number, intervalMs = 50): Promise<boolean> { const deadline = Date.now() + timeoutMs; do { if (predicate()) return true; await new Promise((resolve) => setTimeout(resolve, intervalMs)); } while (Date.now() < deadline); return predicate(); }
export async function insertComposerText(composer: HTMLElement, text: string): Promise<ComposerInsertionResult> {
  const expected = normalizePromptText(text); const verify = () => promptTextMatches(readComposer(composer), expected); composer.focus();
  if (composer instanceof HTMLTextAreaElement) { try { setTextarea(composer, expected); const ok = await waitUntil(verify, INSERT_WAIT_MS); return { ok, strategy: ok ? 'native-textarea-setter' : null }; } catch { return { ok: false, strategy: null }; } }
  const strategies: Array<[string, () => void]> = [
    ['execCommand-insertText', () => { selectContents(composer); document.execCommand('insertText', false, expected); }],
    ['synthetic-text-paste', () => { selectContents(composer); const data = new DataTransfer(); data.setData('text/plain', expected); composer.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data })); }],
    ['plain-text-input-events', () => directText(composer, expected)],
  ];
  for (const [strategy, insert] of strategies) { selectContents(composer); document.execCommand('delete', false); if (readComposer(composer)) directText(composer, ''); insert(); if (await waitUntil(verify, INSERT_WAIT_MS)) return { ok: true, strategy }; }
  return { ok: false, strategy: null };
}
export async function clearComposerText(composer: HTMLElement | null): Promise<void> { if (!composer) return; if (composer instanceof HTMLTextAreaElement) setTextarea(composer, ''); else { composer.focus(); selectContents(composer); const deleted = document.execCommand('delete', false); if (!deleted || readComposer(composer)) directText(composer, ''); } }
export async function clickSend(selectors: readonly string[], accepted: () => boolean): Promise<boolean> { for (let attempt = 0; attempt < 10; attempt++) { const button = findVisible(selectors); if (button) { button.click(); return waitUntil(accepted, 3000, 75); } await new Promise((resolve) => setTimeout(resolve, 100)); } return false; }
