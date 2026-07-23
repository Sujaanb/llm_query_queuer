import { describe, expect, it } from 'vitest';
import { hasPromptContent, normalizePromptText, promptTextMatches } from '../lib/text';

describe('multiline utilities', () => {
  it('normalizes CRLF, CR, and Unicode separators to LF', () => expect(normalizePromptText('one\r\ntwo\rthree\u2028four\u2029five')).toBe('one\ntwo\nthree\nfour\nfive'));
  it('preserves intentional newlines and boundary blank lines', () => expect(normalizePromptText('\r\nfirst\r\n\r\nsecond\r\n')).toBe('\nfirst\n\nsecond\n'));
  it('detects whitespace-only and non-empty prompts', () => { expect(hasPromptContent(' \n\t')).toBe(false); expect(hasPromptContent('\n code\n')).toBe(true); });
  it('accepts equivalent CRLF/LF composer text', () => expect(promptTextMatches('first\nsecond', 'first\r\nsecond')).toBe(true));
  it('normalizes only known editor artifacts', () => expect(promptTextMatches('first\u00a0line\u200b', 'first line')).toBe(true));
  it('does not collapse paragraph, indentation, or boundary whitespace', () => { expect(promptTextMatches('first\n\nsecond', 'first\nsecond')).toBe(false); expect(promptTextMatches(' code', 'code')).toBe(false); expect(promptTextMatches('\ncode', 'code')).toBe(false); });
});
