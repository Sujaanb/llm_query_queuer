import { hasPromptContent, normalizePromptText } from './text';

export interface ParseResult { prompts: string[]; warnings: string[]; error?: string }
type Token = { kind: 'string'; value: string } | { kind: 'other'; value: string };

function parseQuoted(input: string, start: number): { value: string; end: number } {
  const quote = input[start];
  const triple = input.slice(start, start + 3) === quote.repeat(3);
  const delimiter = triple ? quote.repeat(3) : quote;
  let index = start + delimiter.length;
  let value = '';
  while (index < input.length) {
    if (input.slice(index, index + delimiter.length) === delimiter) return { value: normalizePromptText(value), end: index + delimiter.length };
    if (input[index] !== '\\') { value += input[index++]; continue; }
    const next = input[index + 1];
    if (next === undefined) throw new Error('Unterminated escape sequence');
    const escapes: Record<string, string> = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '\\': '\\', '"': '"', "'": "'" };
    value += escapes[next] ?? `\\${next}`;
    index += 2;
  }
  throw new Error('Unterminated quoted string');
}

function parseList(input: string): ParseResult {
  const inner = input.slice(1, -1);
  const tokens: Token[] = [];
  let index = 0;
  while (index < inner.length) {
    while (index < inner.length && /[\s,]/u.test(inner[index])) index++;
    if (index >= inner.length) break;
    if (inner[index] === '"' || inner[index] === "'") {
      let value = '';
      while (index < inner.length && (inner[index] === '"' || inner[index] === "'")) {
        const parsed = parseQuoted(inner, index);
        value += parsed.value;
        index = parsed.end;
        while (index < inner.length && /\s/u.test(inner[index])) index++;
      }
      tokens.push({ kind: 'string', value });
      if (index < inner.length && inner[index] !== ',') throw new Error(`Expected a comma near position ${index + 1}`);
    } else {
      const comma = inner.indexOf(',', index);
      tokens.push({ kind: 'other', value: inner.slice(index, comma < 0 ? inner.length : comma).trim() });
      index = comma < 0 ? inner.length : comma;
    }
  }
  const prompts = tokens.filter((token): token is Extract<Token, { kind: 'string' }> => token.kind === 'string').map((token) => normalizePromptText(token.value)).filter(hasPromptContent);
  const skipped = tokens.filter((token) => token.kind === 'other' && token.value);
  return { prompts, warnings: skipped.length ? [`Skipped ${skipped.length} non-string item${skipped.length === 1 ? '' : 's'}.`] : [] };
}

export function parsePrompts(input: string): ParseResult {
  const normalized = normalizePromptText(input);
  const trimmed = normalized.trim();
  if (!trimmed) return { prompts: [], warnings: [] };
  if (trimmed.startsWith('[') || trimmed.endsWith(']')) {
    if (!(trimmed.startsWith('[') && trimmed.endsWith(']'))) return { prompts: [], warnings: [], error: 'List input must start with [ and end with ].' };
    try {
      const result = parseList(trimmed);
      return result.prompts.length ? result : { ...result, error: 'No string prompts were found.' };
    } catch (error) {
      return { prompts: [], warnings: [], error: error instanceof Error ? error.message : 'Could not parse prompt list.' };
    }
  }
  return { prompts: normalized.split('\n').map((line) => line.trim()).filter(Boolean), warnings: [] };
}
