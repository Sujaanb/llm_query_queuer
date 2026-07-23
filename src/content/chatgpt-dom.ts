export const SELECTORS = {
  composer: ['#prompt-textarea', 'textarea[placeholder]', 'form textarea', 'div[contenteditable="true"][role="textbox"]', '[role="textbox"][contenteditable="true"]'],
  send: ['button[data-testid*="send" i]', 'button[aria-label*="Send" i]', 'form button[type="submit"]'],
  stop: ['button[data-testid*="stop" i]', 'button[aria-label*="Stop" i]'],
  regenerate: ['button[data-testid*="regenerate" i]', 'button[aria-label*="Regenerate" i]'],
  assistant: ['[data-message-author-role="assistant"]', '.agent-turn', 'article'],
  user: ['[data-message-author-role="user"]'],
  status: ['[role="status"]', '[aria-busy="true"]', '[aria-live="polite"]', '[aria-live="assertive"]'],
  errors: ['[role="alert"]', '[data-testid*="error" i]', '[aria-live="assertive"]'],
} as const;

export function visible(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement) || element.getAttribute('aria-hidden') === 'true') return false;
  const style = getComputedStyle(element);
  return style.visibility !== 'hidden' && style.display !== 'none' && element.getClientRects().length > 0;
}

export function findVisible(selectors: readonly string[]): HTMLElement | null {
  for (const selector of selectors) {
    for (const found of document.querySelectorAll(selector)) {
      if (visible(found)) return found;
    }
  }
  return null;
}

export function findComposer(): HTMLTextAreaElement | HTMLElement | null {
  return findVisible(SELECTORS.composer);
}

export function latestText(selectors: readonly string[]): string {
  for (const selector of selectors) {
    const nodes = document.querySelectorAll(selector);
    for (let index = nodes.length - 1; index >= 0; index--) {
      const node = nodes[index];
      if (!visible(node)) continue;
      const text = node.textContent ?? '';
      if (!text) return '';
      // Length plus the tail detects continued streaming without retaining a
      // complete copy of very large assistant messages.
      return text.length > 12_000 ? `${text.length}:${text.slice(-4_000)}` : text.trim();
    }
  }
  return '';
}

function boundedText(element: Element, limit = 600): string {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let result = '';
  let node: Node | null;
  while (result.length < limit && (node = walker.nextNode())) result += `${node.nodeValue ?? ''} `;
  return result.slice(0, limit);
}

function recentVisibleElements(selectors: readonly string[], perSelector = 4): HTMLElement[] {
  const result: HTMLElement[] = [];
  for (const selector of selectors) {
    const nodes = document.querySelectorAll(selector);
    let added = 0;
    for (let index = nodes.length - 1; index >= 0 && added < perSelector; index--) {
      if (visible(nodes[index])) { result.push(nodes[index] as HTMLElement); added++; }
    }
  }
  return result;
}

export function statusText(): string {
  return recentVisibleElements(SELECTORS.status).map((node) => boundedText(node)).join(' ').toLowerCase();
}

export function hasError(): boolean {
  const pattern = /error|rate limit|too many requests|failed|something went wrong|try again later/i;
  return recentVisibleElements(SELECTORS.errors).some((node) => pattern.test(boundedText(node, 1_000)));
}

export function composerEnabled(): boolean {
  const composer = findComposer();
  if (!composer) return false;
  if (composer instanceof HTMLTextAreaElement) return !composer.disabled && !composer.readOnly;
  return composer.getAttribute('aria-disabled') !== 'true' && composer.contentEditable !== 'false';
}

export function isInsideComposer(target: EventTarget | null): boolean {
  return target instanceof Node && Boolean(findComposer()?.contains(target));
}