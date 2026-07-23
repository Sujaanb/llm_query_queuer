import type { Settings } from '../../lib/types';
import type { DebugLog } from '../debug';
import { ConfiguredProviderAdapter, type ProviderAdapterConfig } from './base';
export function chatgptConversationId(value: string): string | null { try { return new URL(value).pathname.match(/^\/c\/([^/?#]+)/)?.[1] ?? null; } catch { return null; } }
const config: ProviderAdapterConfig = {
  id: 'chatgpt', name: 'ChatGPT', matches: ['https://chatgpt.com/*', 'https://chat.openai.com/*'], detect: (value) => /^https:\/\/(chatgpt\.com|chat\.openai\.com)(?:\/|$)/i.test(value), conversationId: chatgptConversationId,
  selectors: {
    composer: ['#prompt-textarea', 'textarea[placeholder]', 'form textarea', 'div[contenteditable="true"][role="textbox"]', '[role="textbox"][contenteditable="true"]'],
    send: ['button[data-testid*="send" i]', 'button[aria-label*="Send" i]', 'form button[type="submit"]'], stop: ['button[data-testid*="stop" i]', 'button[aria-label*="Stop" i]'],
    complete: ['button[data-testid*="regenerate" i]', 'button[aria-label*="Regenerate" i]', 'button[aria-label*="Copy" i]', '[data-testid*="copy" i]'],
    assistant: ['[data-message-author-role="assistant"]', '.agent-turn', 'article'], status: ['[role="status"]', '[aria-busy="true"]', '[aria-live="polite"]', '[aria-live="assertive"]'], errors: ['[role="alert"]', '[data-testid*="error" i]', '[aria-live="assertive"]'],
  },
  busyPatterns: [[/searching|reading/i, 'searching', 'searching'], [/browsing/i, 'browsing', 'browsing'], [/analyzing|working/i, 'analyzing', 'analyzing'], [/reasoning/i, 'reasoning', 'reasoning'], [/thinking/i, 'thinking', 'thinking']],
  errorPattern: /error|rate limit|too many requests|failed|something went wrong|try again later|sign in|log in|captcha|unavailable/i,
};
export class ChatGptAdapter extends ConfiguredProviderAdapter { constructor(key: string, settings: () => Settings, debug: DebugLog) { super(config, key, settings, debug); } }
