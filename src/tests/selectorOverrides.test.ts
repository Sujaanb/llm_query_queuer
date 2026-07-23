import { describe, expect, it } from 'vitest'; import { mergeSelectorList, parseSelectorOverridesJson, validateSelectorOverrides } from '../lib/selectors';
describe('selector overrides', () => {
  it('accepts string and string-array JSON values', () => expect(parseSelectorOverridesJson('{"composer":"textarea","send":["button.send"]}')).toMatchObject({ ok: true, value: { composer: ['textarea'], send: ['button.send'] } }));
  it('rejects invalid JSON and non-string values', () => { expect(parseSelectorOverridesJson('{bad')).toMatchObject({ ok: false }); expect(validateSelectorOverrides({ composer: [12] })).toMatchObject({ ok: false, value: {} }); });
  it('rejects code and remote URLs', () => { expect(validateSelectorOverrides({ composer: ['javascript:alert(1)'] }).ok).toBe(false); expect(validateSelectorOverrides({ assistant: ['https://example.com'] }).ok).toBe(false); });
  it('puts overrides before defaults and de-duplicates', () => expect(mergeSelectorList(['textarea','form textarea'], ['.custom','textarea'])).toEqual(['.custom','textarea','form textarea']));
  it('allows reset to restore defaults', () => expect(mergeSelectorList(['textarea'], undefined)).toEqual(['textarea']));
  it('rejects selectors that fail syntax validation', () => expect(validateSelectorOverrides({ composer: ['[broken'] }, () => false).ok).toBe(false));
});
