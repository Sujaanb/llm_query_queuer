import { describe, expect, it } from 'vitest'; import { normalizeStatusText, statusPatternMatch } from '../lib/status';
describe('localized status matching',()=>{
  it('normalizes Unicode compatibility forms, case, and whitespace',()=>expect(normalizeStatusText('  ＳＥＡＲＣＨＩＮＧ\n  Sources  ')).toBe('searching sources'));
  it.each([['Thinking',/thinking/iu],['思考中',/思考中/iu],['正在搜索',/正在搜索/iu],['规划中',/规划中/iu],['执行中',/执行中/iu],['考え中',/考え中/iu],['生成中',/生成中/iu]])('matches localized small status text %s',(value,pattern)=>expect(statusPatternMatch(value,[pattern])).toBe(pattern));
  it('is case-insensitive',()=>expect(statusPatternMatch('GENERATING',[/generating/iu])).toBeTruthy());
  it('does not infer status from unrelated assistant prose',()=>expect(statusPatternMatch('A completed answer about search methods.',[/^searching$/iu,/^検索中$/iu])).toBeNull());
});
