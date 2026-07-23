import type { Settings } from '../../lib/types'; import type { DebugLog } from '../debug'; import { ConfiguredProviderAdapter, type ProviderAdapterConfig } from './base';
export function mistralConversationId(value: string): string | null { try { return new URL(value).pathname.match(/^\/chat\/([^/?#]+)/)?.[1] ?? null; } catch { return null; } }
const config: ProviderAdapterConfig = {
  id: 'mistral', name: 'Mistral', matches: ['https://chat.mistral.ai/*'], detect: (value) => /^https:\/\/chat\.mistral\.ai(?:\/|$)/i.test(value), conversationId: mistralConversationId,
  selectors: {
    composer: ['#prompt-input', '#chat-input', '[data-testid*="composer" i] textarea', 'textarea[placeholder*="message" i]', 'textarea[placeholder*="ask" i]', '[role="textbox"][contenteditable="true"]'], send: ['button[data-testid*="send" i]', 'button[aria-label*="Send" i]', 'form button[type="submit"]'], stop: ['button[data-testid*="stop" i]', 'button[aria-label*="Stop" i]', 'button[aria-label*="Cancel" i]'],
    complete: ['button[aria-label*="Regenerate" i]', 'button[aria-label*="Retry" i]', '[data-testid*="regenerate" i]', 'button[aria-label*="Copy" i]'], assistant: ['[data-message-author-role="assistant"]', '[data-testid*="assistant" i]', '[data-role="assistant"]', '[class*="assistant" i]', 'main article'],
    status: ['[role="status"]', '[aria-busy="true"]', '[data-testid*="thinking" i]', '[data-testid*="agent" i]', '[data-testid*="tool" i]', '[aria-live="polite"]'], errors: ['[role="alert"]', '[data-testid*="error" i]', '[data-testid*="limit" i]', '[aria-live="assertive"]'],
  },
  busyPatterns: [[/searching|reading/i, 'searching', 'searching'], [/agent|tool|code|running|multi-step|working/i, 'analyzing', 'agent-work'], [/reasoning/i, 'reasoning', 'reasoning'], [/thinking|generating/i, 'thinking', 'thinking']],
  errorPattern: /rate limit|limit reached|usage limit|message limit|quota|try again later|sign in|log in|captcha|unavailable|something went wrong|network error/i,
};
export class MistralAdapter extends ConfiguredProviderAdapter { constructor(key: string, settings: () => Settings, debug: DebugLog) { super(config, key, settings, debug); } }
