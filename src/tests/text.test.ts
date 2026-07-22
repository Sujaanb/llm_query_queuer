import { describe, expect, it } from 'vitest';
import { normalizePromptText, promptTextMatches } from '../lib/text';

 describe('prompt text normalization', () => {
  it('normalizes Windows and legacy carriage-return line endings', () => {
    expect(normalizePromptText('one\r\ntwo\rthree')).toBe('one\ntwo\nthree');
  });

  it('normalizes Unicode line and paragraph separators', () => {
    expect(normalizePromptText('one\u2028two\u2029three')).toBe('one\ntwo\nthree');
  });

  it('matches CRLF input with LF composer output', () => {
    expect(promptTextMatches('first\nsecond', 'first\r\nsecond')).toBe(true);
  });

  it('matches contenteditable paragraph-boundary normalization', () => {
    expect(promptTextMatches('first\n\nsecond', 'first\nsecond')).toBe(true);
  });

  it('matches non-breaking spaces and ignores editor marker characters', () => {
    expect(promptTextMatches('first\u00a0line\u200b', 'first line')).toBe(true);
  });

  it('does not match different prompt content', () => {
    expect(promptTextMatches('first line', 'different line')).toBe(false);
  });
});