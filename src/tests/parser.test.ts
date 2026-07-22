import { describe, expect, it } from 'vitest';
import { parsePrompts } from '../lib/parser';

describe('parsePrompts', () => {
  it('parses JSON and Python double quoted lists', () => expect(parsePrompts('["A", "B"]')).toMatchObject({ prompts: ['A', 'B'] }));
  it('parses single quoted lists', () => expect(parsePrompts("['A', 'B']").prompts).toEqual(['A', 'B']));
  it('allows trailing commas and multiline formatting', () => expect(parsePrompts('[\n "A",\n "B",\n]').prompts).toEqual(['A', 'B']));
  it('concatenates adjacent Python string literals into one list item', () => {
    const input = `[
      "Food, Restaurants — Stage 6E: "
      "Define discovery, dietary constraints, "
      "allergies, hygiene, and reservations.",

      "Shopping — Stage "
      "6F: Define pricing and authenticity.",

      "Documentation: Stage 2 covered "
      "feasibility and permits."
    ]`;
    expect(parsePrompts(input)).toMatchObject({
      prompts: [
        'Food, Restaurants — Stage 6E: Define discovery, dietary constraints, allergies, hygiene, and reservations.',
        'Shopping — Stage 6F: Define pricing and authenticity.',
        'Documentation: Stage 2 covered feasibility and permits.',
      ],
      warnings: [],
    });
  });
  it('concatenates adjacent mixed and triple-quoted literals', () => {
    expect(parsePrompts(`["A" 'B' """C\nD"""]`).prompts).toEqual(['ABC\nD']);
  });
  it('handles escaped quotes', () => expect(parsePrompts('["A \\"quote\\"", \'B \\’ no\']').prompts).toEqual(['A "quote"', 'B ’ no']));
  it('keeps commas inside strings', () => expect(parsePrompts('["A, one", "B"]')).toMatchObject({ prompts: ['A, one', 'B'] }));
  it('parses triple quoted strings', () => expect(parsePrompts('["""\nFirst\nSecond\n""", \'\'\'Other\nline\'\'\']').prompts).toEqual(['First\nSecond', 'Other\nline']));
  it('falls back to lines', () => expect(parsePrompts('A\n\n B\nC').prompts).toEqual(['A', 'B', 'C']));
  it('returns no prompts for empty input', () => expect(parsePrompts('   ')).toEqual({ prompts: [], warnings: [] }));
  it('reports malformed brackets', () => expect(parsePrompts('["A"').error).toBeTruthy());
  it('reports unterminated strings', () => expect(parsePrompts('["A]')).toMatchObject({ prompts: [], error: 'Unterminated quoted string' }));
  it('warns and skips non-string values', () => expect(parsePrompts('["A", 42, true]')).toMatchObject({ prompts: ['A'], warnings: ['Skipped 2 non-string items.'] }));
});
