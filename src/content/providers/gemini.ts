import type { SelectorOverrides, Settings } from '../../lib/types'; import type { DebugLog } from '../debug'; import { ConfiguredProviderAdapter, type ProviderAdapterConfig } from './base';
export function geminiConversationId(value: string): string | null { try { const path = new URL(value).pathname; return path.match(/^\/u\/\d+\/app\/([^/?#]+)/)?.[1] ?? path.match(/^\/(?:app|chat)\/([^/?#]+)/)?.[1] ?? null; } catch { return null; } }
const config: ProviderAdapterConfig = {
  id: 'gemini', name: 'Gemini', matches: ['https://gemini.google.com/*'], detect: (value) => /^https:\/\/gemini\.google\.com(?:\/|$)/i.test(value), conversationId: geminiConversationId,
  experimental: true, pauseOnUncertain: true, defaultStabilityMs: 3500, defaultFallbackReadyTimeoutMs: 30000,
  selectors: {
    composer: ['rich-textarea div[contenteditable="true"]', '.ql-editor[contenteditable="true"]', '[data-testid*="composer" i][contenteditable="true"]', '[role="textbox"][contenteditable="true"]', 'textarea[placeholder*="prompt" i]', 'textarea[placeholder*="ask" i]'],
    send: ['button[aria-label*="send message" i]', 'button[data-testid*="send" i]', 'button[aria-label*="send" i]', 'form button[type="submit"]'], stop: ['button[aria-label*="stop" i]', 'button[data-testid*="stop" i]', 'button[aria-label*="cancel" i]'],
    complete: ['button[aria-label*="regenerate" i]', 'button[aria-label*="retry" i]', 'button[aria-label*="copy" i]', '[data-testid*="regenerate" i]'], assistant: ['message-content', '[data-test-id*="model-response" i]', '[data-testid*="assistant" i]', '[data-role="assistant"]', '.model-response-text'],
    status: ['main [role="status"]', 'main [aria-busy="true"]', '[data-testid*="thinking" i]', '[data-testid*="search" i][data-state="active"]', '[data-testid*="progress" i]'],
    errors: ['main [role="alert"]', '[data-testid*="error" i]', '[data-testid*="login" i]', '[data-testid*="consent" i]', '[data-testid*="account-chooser" i]', 'main [aria-live="assertive"]'],
    citations: ['[data-testid*="citation" i]', '[data-testid*="source" i]', '[class*="citation" i]', '[class*="source-card" i]'], thinking: ['[data-testid*="thinking" i]', '[class*="thinking" i]', 'details[class*="reasoning" i]'],
    tools: ['[data-testid*="extension" i]', '[data-testid*="tool" i]', '[data-testid*="image" i]', '[class*="tool-call" i]'], terminal: ['[data-testid*="output" i][aria-busy="true"]'], auxiliary: ['[data-testid*="workspace" i][aria-busy="true"]'],
  },
  busyPatterns: [[/searching|browsing|reading/iu, 'searching', 'searching'], [/using extensions?|running tools?|creating image|creating/iu, 'analyzing', 'extension-or-tool-work'], [/analyzing|working|running/iu, 'analyzing', 'working'], [/generating|responding/iu, 'streaming', 'generating'], [/reasoning|thinking/iu, 'thinking', 'thinking']],
  errorPattern: /rate limit|limit reached|usage limit|message limit|quota|try again later|sign in|log in|account chooser|consent|captcha|verify (?:you are|that you are) human|verification required|access denied|region|unavailable|something went wrong|network error/iu,
};
export class GeminiAdapter extends ConfiguredProviderAdapter { constructor(key: string, settings: () => Settings, debug: DebugLog, overrides: SelectorOverrides = {}) { super(config, key, settings, debug, overrides); } }
