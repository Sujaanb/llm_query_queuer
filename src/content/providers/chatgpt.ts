import { normalizePromptText, promptTextMatches } from '../../lib/text';
import type { ChatState, Settings } from '../../lib/types';
import type { DebugLog } from '../debug';
import type { ComposerInsertionResult, ProviderAdapter, ProviderSnapshot } from './types';

const SELECTORS = {
  composer: ['#prompt-textarea', 'textarea[placeholder]', 'form textarea', 'div[contenteditable="true"][role="textbox"]', '[role="textbox"][contenteditable="true"]'],
  send: ['button[data-testid*="send" i]', 'button[aria-label*="Send" i]', 'form button[type="submit"]'],
  stop: ['button[data-testid*="stop" i]', 'button[aria-label*="Stop" i]'],
  complete: ['button[data-testid*="regenerate" i]', 'button[aria-label*="Regenerate" i]', 'button[aria-label*="Copy" i]', '[data-testid*="copy" i]'],
  assistant: ['[data-message-author-role="assistant"]', '.agent-turn', 'article'],
  status: ['[role="status"]', '[aria-busy="true"]', '[aria-live="polite"]', '[aria-live="assertive"]'],
  errors: ['[role="alert"]', '[data-testid*="error" i]', '[aria-live="assertive"]'],
} as const;

const BUSY_PATTERNS: Array<[RegExp, ChatState, string]> = [
  [/searching|reading/i, 'searching', 'searching'],
  [/browsing/i, 'browsing', 'browsing'],
  [/analyzing|working/i, 'analyzing', 'analyzing'],
  [/reasoning/i, 'reasoning', 'reasoning'],
  [/thinking/i, 'thinking', 'thinking'],
];
const ERROR_PATTERN = /error|rate limit|too many requests|failed|something went wrong|try again later/i;
const INSERT_WAIT_MS = 500;
const SEND_ACCEPT_WAIT_MS = 3000;

function visible(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement) || element.getAttribute('aria-hidden') === 'true') return false;
  const style = getComputedStyle(element);
  return style.visibility !== 'hidden' && style.display !== 'none' && element.getClientRects().length > 0;
}

function findVisible(selectors: readonly string[]): HTMLElement | null {
  for (const selector of selectors) {
    for (const element of document.querySelectorAll(selector)) if (visible(element)) return element;
  }
  return null;
}

function recentVisible(selectors: readonly string[], limit = 4): HTMLElement[] {
  const result: HTMLElement[] = [];
  for (const selector of selectors) {
    const nodes = document.querySelectorAll(selector);
    let count = 0;
    for (let index = nodes.length - 1; index >= 0 && count < limit; index--) {
      if (visible(nodes[index])) { result.push(nodes[index] as HTMLElement); count++; }
    }
  }
  return result;
}

function boundedText(element: Element, limit = 800): string {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let result = '';
  let node: Node | null;
  while (result.length < limit && (node = walker.nextNode())) result += `${node.nodeValue ?? ''} `;
  return result.slice(0, limit);
}

function composerText(composer: HTMLElement): string {
  return normalizePromptText(composer instanceof HTMLTextAreaElement ? composer.value : composer.innerText || composer.textContent || '');
}

function composerEnabled(composer: HTMLElement | null): boolean {
  if (!composer) return false;
  if (composer instanceof HTMLTextAreaElement) return !composer.disabled && !composer.readOnly;
  return composer.getAttribute('aria-disabled') !== 'true' && composer.contentEditable !== 'false';
}

function selectContents(element: HTMLElement): void {
  const selection = getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

async function waitUntil(predicate: () => boolean, timeoutMs: number, intervalMs = 50): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  do {
    if (predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  } while (Date.now() < deadline);
  return predicate();
}

export class ChatGptAdapter implements ProviderAdapter {
  readonly id = 'chatgpt' as const;
  readonly name = 'ChatGPT';
  readonly enabled = true;
  readonly matches = ['https://chatgpt.com/*', 'https://chat.openai.com/*'];
  readonly capabilities = {
    supportsMultiline: true,
    usesContentEditable: true,
    usesTextArea: true,
    usesShadowDom: false,
    hasStopButton: true,
    hasRegenerateButton: true,
    hasThinkingIndicator: true,
    hasSearchIndicator: true,
    requiresPasteFallback: true,
  };

  private observer: MutationObserver | null = null;
  private fallbackTimer: number | null = null;
  private debounceTimer: number | null = null;
  private listeners = new Set<() => void>();
  private disposed = false;
  private lastAssistantSignature = '';
  private lastAssistantChangeAt = Date.now();
  private noBusySince = Date.now();
  private snapshot: ProviderSnapshot = { state: 'unknown', busy: false, ready: false, errorReason: null, signals: [] };

  constructor(private temporaryKey: string, private settings: () => Settings, private debug: DebugLog) {}

  detect(): boolean { return /^https:\/\/(chatgpt\.com|chat\.openai\.com)(?:\/|$)/i.test(location.href); }
  getConversationId(): string | null { return location.pathname.match(/^\/c\/([^/?#]+)/)?.[1] ?? null; }
  getTemporaryConversationKey(): string { return this.temporaryKey; }
  getComposer(): HTMLElement | null { return findVisible(SELECTORS.composer); }
  readComposerText(): string { const composer = this.getComposer(); return composer ? composerText(composer) : ''; }
  verifyComposerText(expectedText: string): boolean { return promptTextMatches(this.readComposerText(), normalizePromptText(expectedText)); }
  isComposerEventTarget(target: EventTarget | null): boolean { const composer = this.getComposer(); return target instanceof Node && Boolean(composer?.contains(target)); }

  classifyControlAction(target: EventTarget | null): 'send' | 'stop' | null {
    const button = target instanceof Element ? target.closest('button') : null;
    if (!button) return null;
    const stop = findVisible(SELECTORS.stop);
    if (stop && (button === stop || stop.contains(button))) return 'stop';
    const send = findVisible(SELECTORS.send);
    if (send && (button === send || send.contains(button))) return 'send';
    return null;
  }

  private setTextarea(element: HTMLTextAreaElement, value: string): void {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (!setter) throw new Error('Native textarea setter unavailable');
    setter.call(element, value);
    element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private directPlainText(element: HTMLElement, value: string): void {
    element.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: value }));
    element.replaceChildren(document.createTextNode(value));
    element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
  }

  private async verifyAfter(expected: string): Promise<boolean> {
    return waitUntil(() => this.verifyComposerText(expected), INSERT_WAIT_MS);
  }

  async setComposerText(text: string): Promise<ComposerInsertionResult> {
    const composer = this.getComposer();
    if (!composer) return { ok: false, strategy: null };
    const normalized = normalizePromptText(text);
    composer.focus();

    if (composer instanceof HTMLTextAreaElement) {
      try {
        this.setTextarea(composer, normalized);
        const ok = await this.verifyAfter(normalized);
        this.debug.add('composer-insertion', { strategy: 'native-textarea-setter', verified: ok, length: normalized.length, lines: normalized.split('\n').length });
        return { ok, strategy: ok ? 'native-textarea-setter' : null };
      } catch { return { ok: false, strategy: null }; }
    }

    const strategies: Array<[string, () => void]> = [
      ['execCommand-insertText', () => { selectContents(composer); document.execCommand('insertText', false, normalized); }],
      ['synthetic-text-paste', () => {
        selectContents(composer);
        const data = new DataTransfer();
        data.setData('text/plain', normalized);
        composer.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data }));
      }],
      ['plain-text-input-events', () => this.directPlainText(composer, normalized)],
    ];

    for (const [strategy, insert] of strategies) {
      selectContents(composer);
      document.execCommand('delete', false);
      if (composerText(composer)) this.directPlainText(composer, '');
      insert();
      const ok = await this.verifyAfter(normalized);
      this.debug.add('composer-insertion', { strategy, verified: ok, length: normalized.length, lines: normalized.split('\n').length });
      if (ok) return { ok: true, strategy };
    }
    return { ok: false, strategy: null };
  }

  async clearComposer(): Promise<void> {
    const composer = this.getComposer();
    if (!composer) return;
    if (composer instanceof HTMLTextAreaElement) this.setTextarea(composer, '');
    else {
      composer.focus();
      selectContents(composer);
      const deleted = document.execCommand('delete', false);
      if (!deleted || composerText(composer)) this.directPlainText(composer, '');
    }
  }

  canSend(): boolean {
    const button = findVisible(SELECTORS.send);
    return composerEnabled(this.getComposer()) && Boolean(button) && (!(button instanceof HTMLButtonElement) || !button.disabled);
  }

  async clickSend(): Promise<boolean> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const button = findVisible(SELECTORS.send);
      if (button && (!(button instanceof HTMLButtonElement) || !button.disabled)) {
        button.click();
        return waitUntil(() => !this.readComposerText() || Boolean(findVisible(SELECTORS.stop)), SEND_ACCEPT_WAIT_MS, 75);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return false;
  }

  private assistantSignature(): string {
    for (const selector of SELECTORS.assistant) {
      const nodes = document.querySelectorAll(selector);
      for (let index = nodes.length - 1; index >= 0; index--) {
        if (!visible(nodes[index])) continue;
        const text = nodes[index].textContent ?? '';
        return `${text.length}:${text.slice(-4000)}`;
      }
    }
    return '';
  }

  private evaluate(): void {
    if (this.disposed) return;
    const now = Date.now();
    const signature = this.assistantSignature();
    if (signature !== this.lastAssistantSignature) { this.lastAssistantSignature = signature; this.lastAssistantChangeAt = now; }
    const statusText = recentVisible(SELECTORS.status).map((element) => boundedText(element)).join(' ');
    const errorText = recentVisible(SELECTORS.errors).map((element) => boundedText(element, 1000)).find((text) => ERROR_PATTERN.test(text));
    const named = BUSY_PATTERNS.find(([pattern]) => pattern.test(statusText));
    const stopVisible = Boolean(findVisible(SELECTORS.stop));
    const textChanging = Boolean(signature) && now - this.lastAssistantChangeAt < this.settings().stabilityMs;
    const busy = stopVisible || Boolean(named) || textChanging;
    if (busy) this.noBusySince = now;
    const composer = this.getComposer();
    const enabled = composerEnabled(composer);
    const stableFor = now - this.lastAssistantChangeAt;
    const completedControl = Boolean(findVisible(SELECTORS.complete));
    const fallbackReady = !busy && enabled && !errorText && Boolean(signature) && stableFor >= this.settings().stabilityMs && now - this.noBusySince >= this.settings().fallbackReadyTimeoutMs;
    const ready = !busy && enabled && !errorText && (!signature || (stableFor >= this.settings().stabilityMs && completedControl) || fallbackReady);
    let state: ChatState = 'unknown';
    if (errorText) state = 'error';
    else if (named) state = named[1];
    else if (busy) state = 'streaming';
    else if (ready) state = signature ? 'ready' : 'idle';
    const signals = [stopVisible ? 'stop-button' : '', named?.[2] ?? '', textChanging ? 'assistant-text-changing' : '', completedControl ? 'completion-control' : '', enabled ? 'composer-enabled' : '', fallbackReady ? 'fallback-ready' : ''].filter(Boolean);
    const previous = this.snapshot;
    this.snapshot = { state, busy, ready, errorReason: errorText ? errorText.slice(0, 160) : null, signals };
    if (previous.state !== state || previous.busy !== busy || previous.ready !== ready || previous.errorReason !== this.snapshot.errorReason) {
      this.debug.add('provider-state', { provider: this.id, state, busy, ready, signals });
      this.listeners.forEach((listener) => listener());
    }
  }

  private scheduleEvaluate(): void {
    if (this.debounceTimer !== null) return;
    this.debounceTimer = window.setTimeout(() => { this.debounceTimer = null; this.evaluate(); }, 250);
  }

  observe(callback: () => void): () => void {
    this.listeners.add(callback);
    if (!this.observer) {
      this.observer = new MutationObserver(() => this.scheduleEvaluate());
      this.observer.observe(document.querySelector('main') ?? document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-busy', 'aria-disabled', 'disabled'] });
      this.fallbackTimer = window.setInterval(() => this.evaluate(), 1500);
      this.evaluate();
    }
    return () => this.listeners.delete(callback);
  }

  getSnapshot(): ProviderSnapshot { return this.snapshot; }
  isBusy(): boolean { return this.snapshot.busy; }
  isReadyForNextMessage(): boolean { return this.snapshot.ready; }
  hasError(): boolean { return Boolean(this.snapshot.errorReason); }
  getErrorReason(): string | null { return this.snapshot.errorReason; }

  dispose(): void {
    this.disposed = true;
    this.observer?.disconnect();
    this.observer = null;
    if (this.fallbackTimer !== null) clearInterval(this.fallbackTimer);
    if (this.debounceTimer !== null) clearTimeout(this.debounceTimer);
    this.fallbackTimer = null;
    this.debounceTimer = null;
    this.listeners.clear();
  }
}
