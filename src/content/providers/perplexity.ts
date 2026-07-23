import type { Settings } from '../../lib/types'; import type { DebugLog } from '../debug'; import { ConfiguredProviderAdapter, type ProviderAdapterConfig } from './base';
export function perplexityConversationId(value: string): string | null { try { return new URL(value).pathname.match(/^\/(?:search|page)\/([^/?#]+)/)?.[1] ?? null; } catch { return null; } }
const config: ProviderAdapterConfig = {
  id: 'perplexity', name: 'Perplexity', matches: ['https://perplexity.ai/*', 'https://www.perplexity.ai/*'], detect: (value) => /^https:\/\/(?:www\.)?perplexity\.ai(?:\/|$)/i.test(value), conversationId: perplexityConversationId,
  selectors: {
    composer: ['textarea[placeholder*="ask" i]', 'textarea[placeholder*="follow" i]', '[data-testid*="composer" i] textarea', '[role="textbox"][contenteditable="true"]', 'form textarea'],
    send: ['button[data-testid*="submit" i]', 'button[data-testid*="send" i]', 'button[aria-label*="submit" i]', 'button[aria-label*="send" i]', 'form button[type="submit"]'], stop: ['button[data-testid*="stop" i]', 'button[aria-label*="stop" i]', 'button[aria-label*="cancel" i]'],
    complete: ['button[aria-label*="copy" i]', '[data-testid*="copy" i]', 'button[aria-label*="rewrite" i]'], assistant: ['[data-testid*="answer" i]', '[data-role="assistant"]', '[class*="answer" i]', 'main article'],
    status: ['main [role="status"]', 'main [aria-busy="true"]', '[data-testid*="loading" i]', '[data-testid*="search" i]', '[data-testid*="progress" i]'],
    errors: ['main [role="alert"]', '[data-testid*="error" i]', '[data-testid*="limit" i]', '[data-testid*="login" i]', 'main [aria-live="assertive"]'],
    citations: ['[data-testid*="citation" i]', '[data-testid*="source" i]', '[class*="citation" i]', '[class*="source-card" i]', 'a[href][data-citation]'],
    thinking: ['[data-testid*="thinking" i]', '[class*="reasoning" i]', 'details[class*="thinking" i]'],
    tools: ['[data-testid*="search-result" i]', '[class*="search-result" i]', '[data-testid*="tool" i]'],
  },
  busyPatterns: [[/searching|browsing|finding sources|reading sources/iu, 'searching', 'searching-sources'], [/analyzing|synthesizing|processing/iu, 'analyzing', 'analyzing'], [/reasoning/iu, 'reasoning', 'reasoning'], [/thinking/iu, 'thinking', 'thinking'], [/generating|writing answer/iu, 'streaming', 'generating']],
  errorPattern: /pro limit|rate limit|usage limit|quota|try again later|sign in|log in|verify human|captcha|access denied|unavailable|something went wrong|network error/iu,
};
export class PerplexityAdapter extends ConfiguredProviderAdapter { constructor(key: string, settings: () => Settings, debug: DebugLog) { super(config, key, settings, debug); } }
