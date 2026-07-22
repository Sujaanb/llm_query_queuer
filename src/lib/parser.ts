import { normalizePromptText } from './text';

export interface ParseResult { prompts: string[]; warnings: string[]; error?: string }

type Token = { kind: 'string'; value: string } | { kind: 'other'; value: string };

function parseQuoted(input: string, start: number): { value: string; end: number } {
  const quote = input[start];
  const triple = input.slice(start, start + 3) === quote.repeat(3);
  const delimiter = triple ? quote.repeat(3) : quote;
  let i = start + delimiter.length;
  let value = '';
  while (i < input.length) {
    if (input.slice(i, i + delimiter.length) === delimiter) return { value, end: i + delimiter.length };
    if (input[i] === '\\') {
      const next = input[i + 1];
      const escapes: Record<string, string> = { n: '\n', r: '\r', t: '\t', '\\': '\\', '"': '"', "'": "'" };
      if (next === undefined) throw new Error('Unterminated escape sequence');
      value += escapes[next] ?? next;
      i += 2;
    } else {
      value += input[i++];
    }
  }
  throw new Error('Unterminated quoted string');
}

function parseList(input: string): ParseResult {
  const inner = input.slice(1, -1);
  const tokens: Token[] = [];
  let i = 0;
  while (i < inner.length) {
    while (i < inner.length && /[\s,]/.test(inner[i])) i++;
    if (i >= inner.length) break;
    if (inner[i] === '"' || inner[i] === "'") {
      let value = '';
      // Python concatenates adjacent string literals, including across lines.
      // Parse every adjacent quoted fragment as one list item without executing it.
      while (i < inner.length && (inner[i] === '"' || inner[i] === "'")) {
        const parsed = parseQuoted(inner, i);
        value += parsed.value;
        i = parsed.end;
        while (i < inner.length && /\s/.test(inner[i])) i++;
      }
      tokens.push({ kind: 'string', value });
      if (i < inner.length && inner[i] !== ',') throw new Error(`Expected a comma near position ${i + 1}`);
    } else {
      const end = inner.indexOf(',', i);
      tokens.push({ kind: 'other', value: inner.slice(i, end < 0 ? inner.length : end).trim() });
      i = end < 0 ? inner.length : end;
    }
  }
  const prompts = tokens.filter((t): t is Extract<Token, { kind: 'string' }> => t.kind === 'string').map((t) => normalizePromptText(t.value).trim()).filter(Boolean);
  const skipped = tokens.filter((t) => t.kind === 'other' && t.value);
  return { prompts, warnings: skipped.length ? [`Skipped ${skipped.length} non-string item${skipped.length === 1 ? '' : 's'}.`] : [] };
}

export function parsePrompts(input: string): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { prompts: [], warnings: [] };
  if (trimmed.startsWith('[') || trimmed.endsWith(']')) {
    if (!(trimmed.startsWith('[') && trimmed.endsWith(']'))) return { prompts: [], warnings: [], error: 'List input must start with [ and end with ].' };
    try {
      const result = parseList(trimmed);
      if (!result.prompts.length) return { ...result, error: 'No string prompts were found.' };
      return result;
    } catch (error) {
      return { prompts: [], warnings: [], error: error instanceof Error ? error.message : 'Could not parse prompt list.' };
    }
  }
  return { prompts: trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean), warnings: [] };
}
