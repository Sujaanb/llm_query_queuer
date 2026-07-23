import type { SelectorOverrideKey, SelectorOverrides } from './types';

export const SELECTOR_OVERRIDE_KEYS: readonly SelectorOverrideKey[] = ['composer', 'send', 'stop', 'regenerate', 'assistant', 'status', 'errors', 'citations', 'thinking', 'tools', 'terminal', 'auxiliary'];
export interface SelectorValidationResult { ok: boolean; value: SelectorOverrides; errors: string[] }
const forbidden = /(?:javascript\s*:|https?\s*:|data\s*:|url\s*\(|<\s*script|[\u0000\r\n])/iu;
export function isSafeSelector(value: string): boolean { const selector = value.trim(); return selector.length > 0 && selector.length <= 500 && !forbidden.test(selector); }
export function validateSelectorOverrides(input: unknown, syntaxCheck: (selector: string) => boolean = () => true): SelectorValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, value: {}, errors: ['Overrides must be a JSON object.'] };
  const record = input as Record<string, unknown>; const value: SelectorOverrides = {}; const errors: string[] = [];
  for (const [key, raw] of Object.entries(record)) {
    if (!SELECTOR_OVERRIDE_KEYS.includes(key as SelectorOverrideKey)) { errors.push('Unknown selector key: ' + key); continue; }
    const selectors = typeof raw === 'string' ? [raw] : Array.isArray(raw) && raw.every((entry) => typeof entry === 'string') ? raw as string[] : null;
    if (!selectors) { errors.push(key + ' must be a string or an array of strings.'); continue; }
    const accepted: string[] = [];
    for (const selector of selectors) {
      const trimmed = selector.trim();
      if (!isSafeSelector(trimmed)) { errors.push(key + ' contains an unsafe or empty selector.'); continue; }
      let valid = false; try { valid = syntaxCheck(trimmed); } catch { valid = false; }
      if (!valid) { errors.push(key + ' contains an invalid CSS selector: ' + trimmed.slice(0, 80)); continue; }
      if (!accepted.includes(trimmed)) accepted.push(trimmed);
    }
    if (accepted.length) value[key as SelectorOverrideKey] = accepted;
  }
  return { ok: errors.length === 0, value, errors };
}
export function parseSelectorOverridesJson(json: string, syntaxCheck?: (selector: string) => boolean): SelectorValidationResult {
  try { return validateSelectorOverrides(JSON.parse(json), syntaxCheck); } catch { return { ok: false, value: {}, errors: ['Overrides must be valid JSON.'] }; }
}
export function mergeSelectorList(defaults: readonly string[], overrides?: readonly string[]): string[] { return [...new Set([...(overrides ?? []), ...defaults])]; }
export function selectorOverrideKeys(overrides?: SelectorOverrides): SelectorOverrideKey[] { return SELECTOR_OVERRIDE_KEYS.filter((key) => Boolean(overrides?.[key]?.length)); }
