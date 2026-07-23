import { describe, expect, it } from 'vitest';
import { claudeConversationId } from '../content/providers/claude'; import { qwenConversationId } from '../content/providers/qwen'; import { mistralConversationId } from '../content/providers/mistral'; import { huggingChatConversationId } from '../content/providers/huggingchat';
import { grokConversationId } from '../content/providers/grok'; import { kimiConversationId } from '../content/providers/kimi'; import { perplexityConversationId } from '../content/providers/perplexity';
import { zaiConversationId } from '../content/providers/zai'; import { sakanaConversationId } from '../content/providers/sakana'; import { longcatConversationId } from '../content/providers/longcat';
describe('provider conversation ID extraction', () => {
  it('preserves Phase 2 extraction', () => { expect(claudeConversationId('https://claude.ai/chat/claude-1')).toBe('claude-1'); expect(qwenConversationId('https://chat.qwen.ai/chat/qwen-1')).toBe('qwen-1'); expect(mistralConversationId('https://chat.mistral.ai/chat/mistral-1')).toBe('mistral-1'); expect(huggingChatConversationId('https://huggingface.co/chat/hug-1')).toBe('hug-1'); });
  it('extracts Grok and Kimi chat IDs', () => { expect(grokConversationId('https://www.grok.com/chat/g-1')).toBe('g-1'); expect(kimiConversationId('https://kimi.com/chat/k-1')).toBe('k-1'); });
  it('extracts Perplexity search and page IDs', () => { expect(perplexityConversationId('https://www.perplexity.ai/search/p-1')).toBe('p-1'); expect(perplexityConversationId('https://perplexity.ai/page/p-2')).toBe('p-2'); });
  it('extracts both Z.ai route forms', () => { expect(zaiConversationId('https://chat.z.ai/chat/z-1')).toBe('z-1'); expect(zaiConversationId('https://z.ai/c/z-2')).toBe('z-2'); });
  it('extracts Sakana and LongCat chat IDs', () => { expect(sakanaConversationId('https://chat.sakana.ai/chat/s-1')).toBe('s-1'); expect(longcatConversationId('https://www.longcat.ai/chat/l-1')).toBe('l-1'); });
  it('treats new/root routes as temporary', () => { for (const value of [grokConversationId('https://grok.com/'), kimiConversationId('https://kimi.com/chat'), perplexityConversationId('https://perplexity.ai/'), zaiConversationId('https://z.ai/chat'), sakanaConversationId('https://chat.sakana.ai/'), longcatConversationId('https://longcat.chat/')]) expect(value).toBeNull(); });
});
