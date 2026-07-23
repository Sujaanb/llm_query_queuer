import type { Settings } from '../../lib/types'; import type { DebugLog } from '../debug'; import { ConfiguredProviderAdapter, type ProviderAdapterConfig } from './base';
export function huggingChatConversationId(value: string): string | null { try { return new URL(value).pathname.match(/^\/chat\/([^/?#]+)/)?.[1] ?? null; } catch { return null; } }
const config: ProviderAdapterConfig = {
  id: 'huggingchat', name: 'HuggingChat', matches: ['https://huggingface.co/chat/*'], detect: (value) => /^https:\/\/huggingface\.co\/chat(?:\/|$)/i.test(value), conversationId: huggingChatConversationId,
  selectors: {
    composer: ['#prompt-input', '#chat-input', 'textarea[name="prompt"]', 'textarea[placeholder*="message" i]', 'textarea[placeholder*="ask" i]', 'form textarea', '[role="textbox"][contenteditable="true"]'], send: ['button[data-testid*="send" i]', 'button[aria-label*="Send" i]', 'form button[type="submit"]'], stop: ['button[data-testid*="stop" i]', 'button[aria-label*="Stop" i]', 'button[title*="Stop" i]', 'button[aria-label*="Cancel" i]'],
    complete: ['button[aria-label*="Regenerate" i]', 'button[aria-label*="Retry" i]', 'button[title*="Retry" i]', 'button[aria-label*="Copy" i]'], assistant: ['[data-message-author-role="assistant"]', '[data-testid*="assistant" i]', '[data-role="assistant"]', '[class*="assistant" i]', '.prose', 'main article'],
    status: ['[role="status"]', '[aria-busy="true"]', '[data-testid*="generating" i]', '[aria-live="polite"]'], errors: ['[role="alert"]', '[data-testid*="error" i]', '[data-testid*="login" i]', '[aria-live="assertive"]'],
  },
  busyPatterns: [[/searching|reading/i, 'searching', 'searching'], [/working|running/i, 'analyzing', 'working'], [/thinking|generating/i, 'thinking', 'generating']], errorPattern: /rate limit|limit reached|usage limit|message limit|quota|try again later|sign in|log in|captcha|cloudflare|unavailable|something went wrong|network error/i,
  capabilities: { usesContentEditable: true, usesTextArea: true },
};
export class HuggingChatAdapter extends ConfiguredProviderAdapter { constructor(key: string, settings: () => Settings, debug: DebugLog) { super(config, key, settings, debug); } }
