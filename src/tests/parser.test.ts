import { describe, expect, it } from 'vitest';
import { parsePrompts } from '../lib/parser';

describe('safe prompt parser', () => {
  it('handles empty and whitespace input', () => { expect(parsePrompts('')).toEqual({ prompts: [], warnings: [] }); expect(parsePrompts(' \r\n ')).toEqual({ prompts: [], warnings: [] }); });
  it('parses JSON and Python double-quote lists', () => expect(parsePrompts('["A", "B"]').prompts).toEqual(['A', 'B']));
  it('parses Python single-quote lists', () => expect(parsePrompts("['A', 'B']").prompts).toEqual(['A', 'B']));
  it('allows multiline formatting and trailing commas', () => expect(parsePrompts('[\n "A",\n "B",\n]').prompts).toEqual(['A', 'B']));
  it('handles escaped quotes', () => expect(parsePrompts('["A \\"quote\\"", \'B\\\'s\']').prompts).toEqual(['A "quote"', "B's"]));
  it('preserves commas inside strings', () => expect(parsePrompts('["A, one", "B"]').prompts).toEqual(['A, one', 'B']));
  it('concatenates adjacent Python literals', () => expect(parsePrompts('["Food, " "stage 6", \'Next\']').prompts).toEqual(['Food, stage 6', 'Next']));
  it('preserves triple-quoted multiline and boundary blank lines', () => expect(parsePrompts('["""\r\nFirst\r\n\r\nSecond\r\n"""]').prompts).toEqual(['\nFirst\n\nSecond\n']));
  it('uses line-by-line fallback and normalizes CRLF', () => expect(parsePrompts('A\r\n\r\n B\rC').prompts).toEqual(['A', 'B', 'C']));
  it('skips non-string values with a warning', () => expect(parsePrompts('["A", 42, true]')).toMatchObject({ prompts: ['A'], warnings: ['Skipped 2 non-string items.'] }));
  it('reports malformed and unterminated lists', () => { expect(parsePrompts('["A"').error).toBeTruthy(); expect(parsePrompts('["A]').error).toBe('Unterminated quoted string'); });
  it('never executes input', () => expect(parsePrompts('[globalThis.hacked = true]').prompts).toEqual([]));
});
