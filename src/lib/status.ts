export function normalizeStatusText(value: string): string { return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase(); }
export function statusPatternMatch(value: string, patterns: readonly RegExp[]): RegExp | null {
  const normalized = normalizeStatusText(value);
  for (const pattern of patterns) { pattern.lastIndex = 0; if (pattern.test(normalized)) return pattern; }
  return null;
}
