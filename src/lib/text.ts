export function normalizePromptText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[\u2028\u2029]/g, '\n');
}

function normalizeVisualText(text: string): string {
  return normalizePromptText(text)
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b\ufeff]/g, '');
}

export function promptTextMatches(actual: string, expected: string): boolean {
  const left = normalizeVisualText(actual).trim();
  const right = normalizeVisualText(expected).trim();
  if (left === right) return true;

  // Rich text editors may represent paragraph boundaries as one or two line
  // breaks. This comparison is only an acceptance check; the inserted DOM is
  // still plain text and retains the original normalized line endings.
  const collapseVisualWhitespace = (value: string) => value.replace(/\s+/gu, ' ').trim();
  return collapseVisualWhitespace(left) === collapseVisualWhitespace(right);
}