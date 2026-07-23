import type { Settings } from '../lib/types';

export type ToastType = 'info' | 'success' | 'warning' | 'error';
const HOST_ID = 'lm-query-queuer-toasts';
const MAX_VISIBLE = 3;

export class Toasts {
  private host: HTMLElement | null = null;
  private stack: HTMLElement | null = null;
  private timers = new Map<HTMLElement, number>();
  constructor(private settings: () => Settings) {}

  private ensureStack(): HTMLElement {
    if (this.stack?.isConnected) return this.stack;
    document.getElementById(HOST_ID)?.remove();
    this.host = document.createElement('div');
    this.host.id = HOST_ID;
    this.host.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:2147483647;pointer-events:none';
    document.documentElement.append(this.host);
    const root = this.host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = `.stack{display:flex;flex-direction:column;gap:8px;align-items:flex-end}.toast{pointer-events:auto;max-width:330px;padding:10px 12px;border:1px solid #ffffff20;border-radius:10px;color:#fff;background:#202123;box-shadow:0 8px 30px #0004;font:13px/1.4 system-ui;display:flex;gap:10px;align-items:center;white-space:pre-wrap}.warning{border-left:3px solid #f59e0b}.error{border-left:3px solid #ef4444}.success{border-left:3px solid #22c55e}button{border:0;background:none;color:#aaa;cursor:pointer;font-size:17px}`;
    this.stack = document.createElement('div');
    this.stack.className = 'stack';
    root.append(style, this.stack);
    return this.stack;
  }

  private remove(toast: HTMLElement): void {
    const timer = this.timers.get(toast);
    if (timer !== undefined) clearTimeout(timer);
    this.timers.delete(toast);
    toast.remove();
  }

  show(message: string, type: ToastType = 'info'): void {
    if (!this.settings().showToasts) return;
    const stack = this.ensureStack();
    while (stack.children.length >= MAX_VISIBLE) this.remove(stack.firstElementChild as HTMLElement);
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const text = document.createElement('span');
    text.textContent = message;
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '?';
    close.ariaLabel = 'Dismiss';
    close.addEventListener('click', () => this.remove(toast), { once: true });
    toast.append(text, close);
    stack.append(toast);
    this.timers.set(toast, window.setTimeout(() => this.remove(toast), type === 'error' ? 5000 : 3000));
  }

  dispose(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.host?.remove();
    this.host = null;
    this.stack = null;
  }
}
