import type { ChatState, Settings } from '../lib/types';
import { composerEnabled, findVisible, hasError, latestText, SELECTORS, statusText } from './chatgpt-dom';

const BUSY: Array<[RegExp, ChatState]> = [
  [/searching|reading/, 'searching'], [/browsing/, 'browsing'], [/analyzing|working/, 'analyzing'], [/reasoning/, 'reasoning'], [/thinking/, 'thinking'],
];

export class StateDetector {
  private state: ChatState = 'unknown';
  private lastAssistant = '';
  private lastChangeAt = Date.now();
  private observer?: MutationObserver;
  private interval?: number;
  private scheduled = false;
  private listeners = new Set<(state: ChatState, previous: ChatState) => void>();

  constructor(private settings: () => Settings) {}
  get current() { return this.state; }
  onChange(fn: (state: ChatState, previous: ChatState) => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  start() {
    this.observer = new MutationObserver(() => this.schedule());
    const observationRoot = document.querySelector('main') ?? document.body;
    this.observer.observe(observationRoot, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-busy', 'aria-disabled', 'disabled'] });
    this.interval = window.setInterval(() => this.evaluate(), 1500);
    this.evaluate();
  }
  stop() { this.observer?.disconnect(); if (this.interval) clearInterval(this.interval); }
  private schedule() {
    if (this.scheduled) return;
    this.scheduled = true;
    setTimeout(() => { this.scheduled = false; this.evaluate(); }, 250);
  }
  private evaluate() {
    const now = Date.now();
    const assistant = latestText(SELECTORS.assistant);
    if (assistant !== this.lastAssistant) { this.lastAssistant = assistant; this.lastChangeAt = now; }
    const text = statusText();
    let next: ChatState;
    if (hasError()) next = 'error';
    else if (findVisible(SELECTORS.stop)) next = BUSY.find(([pattern]) => pattern.test(text))?.[1] ?? 'streaming';
    else {
      const named = BUSY.find(([pattern]) => pattern.test(text));
      if (named) next = named[1];
      else if (assistant && now - this.lastChangeAt < this.settings().stabilityMs) next = 'streaming';
      else if (composerEnabled() && (Boolean(findVisible(SELECTORS.regenerate)) || !assistant || now - this.lastChangeAt >= this.settings().stabilityMs)) next = assistant ? 'ready' : 'idle';
      else if (composerEnabled() && now - this.lastChangeAt >= this.settings().fallbackReadyTimeoutMs) next = 'ready';
      else next = 'unknown';
    }
    if (next !== this.state) {
      const previous = this.state;
      this.state = next;
      this.listeners.forEach((listener) => listener(next, previous));
    }
  }
}
