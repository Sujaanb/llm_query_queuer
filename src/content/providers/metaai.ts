import type { SelectorOverrides, Settings } from '../../lib/types'; import type { DebugLog } from '../debug'; import { ConfiguredProviderAdapter, type ProviderAdapterConfig } from './base';
export function metaAiConversationId(value: string): string | null { try { return new URL(value).pathname.match(/^\/(?:chat|messages)\/([^/?#]+)/)?.[1] ?? null; } catch { return null; } }
const config: ProviderAdapterConfig = {
  id: 'metaai', name: 'Meta AI', matches: ['https://meta.ai/*', 'https://www.meta.ai/*'], detect: (value) => /^https:\/\/(?:www\.)?meta\.ai(?:\/|$)/i.test(value), conversationId: metaAiConversationId,
  experimental: true, pauseOnUncertain: true, defaultStabilityMs: 3500, defaultFallbackReadyTimeoutMs: 30000,
  selectors: {
    composer: ['[data-testid*="composer" i][contenteditable="true"]', '[role="textbox"][contenteditable="true"]', 'textarea[placeholder*="message" i]', 'textarea[placeholder*="ask" i]', '[aria-label*="message" i][contenteditable="true"]', 'form textarea'],
    send: ['button[data-testid*="send" i]', 'button[aria-label*="send" i]', 'button[aria-label*="submit" i]', 'form button[type="submit"]'], stop: ['button[data-testid*="stop" i]', 'button[aria-label*="stop" i]', 'button[aria-label*="cancel" i]'],
    complete: ['button[aria-label*="regenerate" i]', 'button[aria-label*="retry" i]', 'button[aria-label*="copy" i]', '[data-testid*="regenerate" i]'], assistant: ['[data-testid*="assistant" i]', '[data-role="assistant"]', '[class*="assistant" i]', '[class*="response" i]', 'main article'],
    status: ['main [role="status"]', 'main [aria-busy="true"]', '[data-testid*="thinking" i]', '[data-testid*="search" i][data-state="active"]', '[data-testid*="progress" i]'],
    errors: ['main [role="alert"]', '[data-testid*="error" i]', '[data-testid*="login" i]', '[data-testid*="cookie" i]', '[data-testid*="consent" i]', 'main [aria-live="assertive"]'],
    citations: ['[data-testid*="citation" i]', '[data-testid*="source" i]', '[class*="citation" i]'], thinking: ['[data-testid*="thinking" i]', '[class*="thinking" i]'],
    tools: ['[data-testid*="tool" i]', '[data-testid*="image" i]', '[class*="tool-call" i]'], terminal: ['[data-testid*="output" i][aria-busy="true"]'],
  },
  busyPatterns: [[/searching|browsing|reading/iu, 'searching', 'searching'], [/creating image|creating|using tool/iu, 'analyzing', 'creating-or-tool-work'], [/analyzing|working|running/iu, 'analyzing', 'working'], [/generating|responding/iu, 'streaming', 'responding'], [/reasoning|thinking/iu, 'thinking', 'thinking']],
  errorPattern: /rate limit|limit reached|usage limit|message limit|quota|try again later|sign in|log in|authentication required|account recovery|cookie consent|consent|captcha|verify human|verification required|access denied|not available in your region|regional restriction|unavailable|something went wrong|network error/iu,
};
export class MetaAiAdapter extends ConfiguredProviderAdapter { constructor(key: string, settings: () => Settings, debug: DebugLog, overrides: SelectorOverrides = {}) { super(config, key, settings, debug, overrides); } }
