import { describe, expect, it } from 'vitest';
import { PROVIDERS, providerForUrl, runtimeProvider } from '../lib/providers';
describe('Phase 3 provider registry', () => {
  it('keeps ChatGPT built in and stable', () => expect(runtimeProvider('chatgpt')).toMatchObject({ builtIn: true, enabledByDefault: true, phase: 1, status: 'stable' }));
  it.each(['claude', 'qwen', 'mistral', 'huggingchat'])('%s remains optional Phase 2 beta', (id) => expect(runtimeProvider(id)).toMatchObject({ builtIn: false, enabledByDefault: false, phase: 2, status: 'beta' }));
  it.each(['grok', 'kimi', 'perplexity', 'zai', 'sakana', 'longcat'])('%s is optional Phase 3 beta and disabled by default', (id) => expect(runtimeProvider(id)).toMatchObject({ builtIn: false, enabledByDefault: false, phase: 3, status: 'beta' }));
  it('keeps only Phase 4 providers planned and non-runtime', () => { for (const id of ['gemini', 'meta', 'minimax', 'aristotle']) expect(runtimeProvider(id)).toBeNull(); expect(PROVIDERS.filter((p) => p.status === 'planned').map((p) => p.id)).toEqual(['gemini', 'meta', 'minimax', 'aristotle']); });
  it.each([
    ['https://www.grok.com/chat/a', 'grok'], ['https://kimi.com/chat/a', 'kimi'], ['https://perplexity.ai/search/a', 'perplexity'],
    ['https://www.z.ai/c/a', 'zai'], ['https://chat.sakana.ai/chat/a', 'sakana'], ['https://longcat.chat/chat/a', 'longcat'],
  ])('matches %s to %s', (url, id) => expect(providerForUrl(url)?.id).toBe(id));
  it('does not confuse similarly named or insecure hosts', () => { expect(providerForUrl('https://evilgrok.com/chat/a')).toBeNull(); expect(providerForUrl('http://grok.com/chat/a')).toBeNull(); });
});
