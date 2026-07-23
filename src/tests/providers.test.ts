import { describe, expect, it } from 'vitest'; import { effectiveProviderSettings, PROVIDERS, providerForUrl, runtimeProvider } from '../lib/providers'; import { DEFAULT_SETTINGS } from '../lib/constants';
describe('Phase 4 provider registry', () => {
  it('contains exactly the final 15-provider list', () => expect(PROVIDERS.map((provider) => provider.id)).toEqual(['chatgpt','claude','qwen','mistral','huggingchat','grok','kimi','perplexity','zai','sakana','longcat','gemini','metaai','minimax','aristotle']));
  it('keeps ChatGPT built in and stable', () => expect(runtimeProvider('chatgpt')).toMatchObject({ builtIn: true, enabledByDefault: true, phase: 1, status: 'stable' }));
  it.each(['claude','qwen','mistral','huggingchat'])('%s remains optional Phase 2 beta', (id) => expect(runtimeProvider(id)).toMatchObject({ builtIn: false, enabledByDefault: false, phase: 2, status: 'beta' }));
  it.each(['grok','kimi','perplexity','zai','sakana','longcat'])('%s remains optional Phase 3 beta', (id) => expect(runtimeProvider(id)).toMatchObject({ builtIn: false, enabledByDefault: false, phase: 3, status: 'beta' }));
  it.each(['gemini','metaai','minimax','aristotle'])('%s is optional experimental and disabled by default', (id) => expect(runtimeProvider(id)).toMatchObject({ builtIn: false, enabledByDefault: false, phase: 4, status: 'experimental', experimental: true, pauseOnUncertain: true }));
  it('marks Aristotle access-dependent', () => expect(runtimeProvider('aristotle')?.accessDependent).toBe(true));
  it('uses conservative defaults until the user changes global timing', () => expect(effectiveProviderSettings('gemini', DEFAULT_SETTINGS)).toMatchObject({ sendDelayMs: 5000, stabilityMs: 3500, fallbackReadyTimeoutMs: 30000 }));
  it('respects explicit user timing overrides', () => expect(effectiveProviderSettings('gemini', { ...DEFAULT_SETTINGS, stabilityMs: 4200 })).toMatchObject({ stabilityMs: 4200 }));
  it.each([['https://gemini.google.com/app/a','gemini'],['https://meta.ai/chat/a','metaai'],['https://agent.minimax.io/task/a','minimax'],['https://app.aristotle.science/research/a','aristotle']])('matches %s to %s', (url,id) => expect(providerForUrl(url)?.id).toBe(id));
  it('does not match insecure or lookalike hosts', () => { expect(providerForUrl('http://gemini.google.com/app/a')).toBeNull(); expect(providerForUrl('https://notmeta.ai/chat/a')).toBeNull(); });
});
