import type { Settings } from '../lib/types';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export class Toasts {
  private root: ShadowRoot | null = null;
  constructor(private settings: () => Settings) {}

  show(message: string, type: ToastType = 'info') {
    if (!this.settings().showToasts) return;
    if (!this.root) {
      const host = document.createElement('div');
      host.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:2147483647;pointer-events:none';
      document.documentElement.append(host);
      this.root = host.attachShadow({ mode: 'closed' });
      const style = document.createElement('style');
      style.textContent = `.stack{display:flex;flex-direction:column;gap:8px;align-items:flex-end}.toast{pointer-events:auto;max-width:330px;padding:10px 12px;border:1px solid #ffffff20;border-radius:10px;color:#fff;background:#202123;box-shadow:0 8px 30px #0004;font:13px/1.4 system-ui;display:flex;gap:10px;align-items:center;animation:in .15s ease-out}.warning{border-left:3px solid #f59e0b}.error{border-left:3px solid #ef4444}.success{border-left:3px solid #22c55e}button{border:0;background:none;color:#aaa;cursor:pointer;font-size:17px}@keyframes in{from{opacity:0;transform:translateY(6px)}}`;
      this.root.append(style);
      const stack = document.createElement('div');
      stack.className = 'stack';
      this.root.append(stack);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const text = document.createElement('span');
    text.textContent = message;
    const close = document.createElement('button');
    close.textContent = '×';
    close.ariaLabel = 'Dismiss';
    close.onclick = () => toast.remove();
    toast.append(text, close);
    this.root.querySelector('.stack')?.append(toast);
    setTimeout(() => toast.remove(), type === 'error' ? 4000 : 3000);
  }
}
