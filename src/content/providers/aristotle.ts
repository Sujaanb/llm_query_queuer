import type { SelectorOverrides, Settings } from '../../lib/types'; import type { DebugLog } from '../debug'; import { ConfiguredProviderAdapter, type ProviderAdapterConfig } from './base';
export function aristotleConversationId(value: string): string | null { try { return new URL(value).pathname.match(/^\/(?:chat|conversation|thread|research)\/([^/?#]+)/)?.[1] ?? null; } catch { return null; } }
const config: ProviderAdapterConfig = {
  id: 'aristotle', name: 'Aristotle', matches: ['https://aristotle.science/*', 'https://www.aristotle.science/*', 'https://*.aristotle.science/*'], detect: (value) => /^https:\/\/(?:[a-z0-9-]+\.)*aristotle\.science(?:\/|$)/i.test(value), conversationId: aristotleConversationId,
  experimental: true, pauseOnUncertain: true, defaultStabilityMs: 3500, defaultFallbackReadyTimeoutMs: 30000,
  selectors: {
    composer: ['[data-testid*="composer" i][contenteditable="true"]', '[data-testid*="prompt" i] textarea', '[role="textbox"][contenteditable="true"]', 'textarea[placeholder*="message" i]', 'textarea[placeholder*="ask" i]', 'form textarea'],
    send: ['button[data-testid*="send" i]', 'button[aria-label*="send" i]', 'button[aria-label*="ask" i]', 'form button[type="submit"]'], stop: ['button[data-testid*="stop" i]', 'button[aria-label*="stop" i]', 'button[aria-label*="cancel" i]'],
    complete: ['button[aria-label*="regenerate" i]', 'button[aria-label*="retry" i]', 'button[aria-label*="copy" i]', '[data-testid*="regenerate" i]'], assistant: ['[data-testid*="assistant" i]', '[data-role="assistant"]', '[class*="answer" i]', '[class*="response" i]', 'main article'],
    status: ['main [role="status"]', 'main [aria-busy="true"]', '[data-testid*="research-progress" i]', '[data-testid*="thinking" i]', '[data-testid*="tool-progress" i]'],
    errors: ['main [role="alert"]', '[data-testid*="error" i]', '[data-testid*="access" i]', '[data-testid*="invite" i]', '[data-testid*="verification" i]', '[data-testid*="login" i]', 'main [aria-live="assertive"]'],
    citations: ['[data-testid*="citation" i]', '[data-testid*="source" i]', '[class*="citation" i]', '[class*="reference" i]'], thinking: ['[data-testid*="thinking" i]', '[class*="reasoning" i]', '[class*="thinking" i]'],
    tools: ['[data-testid*="tool" i]', '[data-testid*="document" i]', '[data-testid*="file" i]', '[class*="tool-call" i]'], terminal: ['[data-testid*="output" i]', '[data-testid*="terminal" i]'], auxiliary: ['[data-testid*="research-progress" i]', '[data-testid*="document-progress" i]'],
  },
  busyPatterns: [[/searching|reading documents?|citing sources|browsing/iu, 'searching', 'researching'], [/running tools?|executing|working/iu, 'analyzing', 'tool-work'], [/analyzing|processing files?/iu, 'analyzing', 'analyzing'], [/reasoning/iu, 'reasoning', 'reasoning'], [/generating/iu, 'streaming', 'generating'], [/thinking/iu, 'thinking', 'thinking']],
  errorPattern: /rate limit|limit reached|usage limit|message limit|quota|try again later|sign in|log in|authentication required|invite required|verification required|verified researcher|access restricted|access denied|captcha|verify human|regional restriction|unavailable|something went wrong|network error/iu,
};
export class AristotleAdapter extends ConfiguredProviderAdapter { constructor(key: string, settings: () => Settings, debug: DebugLog, overrides: SelectorOverrides = {}) { super(config, key, settings, debug, overrides); } }
