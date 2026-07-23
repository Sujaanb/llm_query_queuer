export type StyleReader = (element: Element) => Pick<CSSStyleDeclaration, 'display' | 'visibility' | 'opacity' | 'position'>;
export function isElementVisible(element: Element, styleReader: StyleReader = (value) => getComputedStyle(value)): element is HTMLElement {
  if (element.getAttribute('aria-hidden') === 'true' || element.hasAttribute('hidden')) return false;
  const html = element as HTMLElement; if ('disabled' in html && Boolean((html as HTMLButtonElement).disabled)) return false;
  const style = styleReader(element); if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
  return typeof html.getClientRects !== 'function' || html.getClientRects().length > 0;
}
export function queryAllSafe(selector: string, root: ParentNode = document): Element[] { try { return Array.from(root.querySelectorAll(selector)); } catch { return []; } }
export function findVisible(selectors: readonly string[], root: ParentNode = document, predicate: (element: Element) => boolean = isElementVisible): HTMLElement | null {
  for (const selector of selectors) for (const element of queryAllSafe(selector, root)) if (predicate(element)) return element as HTMLElement; return null;
}
export function recentVisible(selectors: readonly string[], limit = 4, root: ParentNode = document): HTMLElement[] {
  const result: HTMLElement[] = [];
  for (const selector of selectors) { const nodes = queryAllSafe(selector, root); let count = 0; for (let index = nodes.length - 1; index >= 0 && count < limit; index--) if (isElementVisible(nodes[index])) { result.push(nodes[index] as HTMLElement); count++; } }
  return result;
}
export function boundedText(element: Element, limit = 800): string { const text = element.textContent ?? ''; return text.length <= limit ? text : text.slice(0, limit); }
export function composerEnabled(composer: HTMLElement | null): boolean {
  if (!composer) return false; if (composer instanceof HTMLTextAreaElement) return !composer.disabled && !composer.readOnly;
  return composer.getAttribute('aria-disabled') !== 'true' && composer.contentEditable !== 'false';
}
export function composerKind(composer: HTMLElement | null): 'textarea' | 'contenteditable' | 'unknown' {
  if (composer instanceof HTMLTextAreaElement) return 'textarea'; if (composer?.isContentEditable || composer?.getAttribute('contenteditable') === 'true') return 'contenteditable'; return 'unknown';
}
export function truncateDiagnosticLabels(values: readonly string[], maxItems = 12, maxLength = 80): string[] { return values.slice(0, maxItems).map((value) => value.slice(0, maxLength)); }
