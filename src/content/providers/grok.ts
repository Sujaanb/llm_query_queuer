import type { Settings } from '../../lib/types'; import type { DebugLog } from '../debug'; import { ConfiguredProviderAdapter, type ProviderAdapterConfig } from './base';
export function grokConversationId(value: string): string | null { try { return new URL(value).pathname.match(/^\/chat\/([^/?#]+)/)?.[1] ?? null; } catch { return null; } }
const config: ProviderAdapterConfig = {
  id: 'grok', name: 'Grok', matches: ['https://grok.com/*', 'https://www.grok.com/*'], detect: (value) => /^https:\/\/(?:www\.)?grok\.com(?:\/|$)/i.test(value), conversationId: grokConversationId,
  selectors: {
    composer: ['textarea[placeholder*="ask" i]', 'textarea[placeholder*="message" i]', '[data-testid*="composer" i] textarea', '[role="textbox"][contenteditable="true"]', 'form textarea'],
    send: ['button[data-testid*="send" i]', 'button[aria-label*="send" i]', 'form button[type="submit"]'], stop: ['button[data-testid*="stop" i]', 'button[aria-label*="stop" i]', 'button[aria-label*="cancel" i]'],
    complete: ['button[aria-label*="copy" i]', '[data-testid*="copy" i]', 'button[aria-label*="regenerate" i]'], assistant: ['[data-testid*="assistant" i]', '[data-role="assistant"]', '[data-message-author-role="assistant"]', 'main article'],
    status: ['main [role="status"]', 'main [aria-busy="true"]', '[data-testid*="thinking" i]', '[data-testid*="search" i]', '[data-testid*="progress" i]'],
    errors: ['main [role="alert"]', '[data-testid*="error" i]', '[data-testid*="rate-limit" i]', '[data-testid*="login" i]', 'main [aria-live="assertive"]'],
    citations: ['[data-testid*="citation" i]', '[data-testid*="source" i]', '[class*="citation" i]', '[class*="source-card" i]', '[data-testid*="result-card" i]'],
    thinking: ['[data-testid*="thinking" i]', '[class*="thinking" i]', 'details[data-testid*="reasoning" i]'],
    tools: ['[data-testid*="image-result" i]', '[data-testid*="tool" i]', '[class*="tool-call" i]'],
  },
  busyPatterns: [[/searching|searching the web|browsing|reading sources/iu, 'searching', 'searching'], [/generating image|creating image/iu, 'analyzing', 'image-generation'], [/analyzing|working|processing/iu, 'analyzing', 'analyzing'], [/reasoning/iu, 'reasoning', 'reasoning'], [/thinking/iu, 'thinking', 'thinking']],
  errorPattern: /rate limit|usage limit|quota|try again later|sign in|log in|verify (?:you are|that you are) human|captcha|access denied|unavailable|something went wrong|network error/iu,
};
export class GrokAdapter extends ConfiguredProviderAdapter { constructor(key: string, settings: () => Settings, debug: DebugLog) { super(config, key, settings, debug); } }
