export const SELECTORS = {
  composer: ['#prompt-textarea', 'textarea[placeholder]', 'form textarea', 'div[contenteditable="true"][role="textbox"]', '[role="textbox"][contenteditable="true"]'],
  send: ['button[data-testid*="send" i]', 'button[aria-label*="Send" i]', 'form button[type="submit"]'],
  stop: ['button[data-testid*="stop" i]', 'button[aria-label*="Stop" i]'],
  regenerate: ['button[data-testid*="regenerate" i]', 'button[aria-label*="Regenerate" i]'],
  assistant: ['[data-message-author-role="assistant"]', '.agent-turn', 'article'],
  user: ['[data-message-author-role="user"]'],
  status: ['[aria-live="polite"]', '[aria-live="assertive"]', '[role="status"]', '[aria-busy="true"]'],
  errors: ['[role="alert"]', '[aria-live="assertive"]'],
} as const;

export function visible(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement) || element.getAttribute('aria-hidden') === 'true') return false;
  const style = getComputedStyle(element);
  return style.visibility !== 'hidden' && style.display !== 'none' && element.getClientRects().length > 0;
}

export function findVisible(selectors: readonly string[]): HTMLElement | null {
  for (const selector of selectors) {
    const found = [...document.querySelectorAll(selector)].find(visible);
    if (found instanceof HTMLElement) return found;
  }
  return null;
}

export function findComposer(): HTMLTextAreaElement | HTMLElement | null {
  return findVisible(SELECTORS.composer);
}

export function latestText(selectors: readonly string[]): string {
  const nodes = selectors.flatMap((selector) => [...document.querySelectorAll(selector)]).filter(visible);
  return (nodes.at(-1)?.textContent ?? '').trim();
}

export function statusText(): string {
  return SELECTORS.status.flatMap((selector) => [...document.querySelectorAll(selector)])
    .filter(visible).map((node) => node.textContent ?? '').join(' ').toLowerCase();
}

export function hasError(): boolean {
  const pattern = /error|rate limit|too many requests|failed|something went wrong|try again later/i;
  return SELECTORS.errors.flatMap((selector) => [...document.querySelectorAll(selector)])
    .filter(visible).some((node) => pattern.test(node.textContent ?? ''));
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
