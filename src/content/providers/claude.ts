import type { Settings } from '../../lib/types'; import type { DebugLog } from '../debug'; import { ConfiguredProviderAdapter, type ProviderAdapterConfig } from './base';
export function claudeConversationId(value: string): string | null { try { return new URL(value).pathname.match(/^\/chat\/([^/?#]+)/)?.[1] ?? null; } catch { return null; } }
const config: ProviderAdapterConfig = {
  id: 'claude', name: 'Claude', matches: ['https://claude.ai/*', 'https://www.claude.ai/*'], detect: (value) => /^https:\/\/(?:www\.)?claude\.ai(?:\/|$)/i.test(value), conversationId: claudeConversationId,
  selectors: {
    composer: ['[data-testid*="composer" i][contenteditable="true"]', 'div[contenteditable="true"][aria-label*="Message" i]', '[role="textbox"][contenteditable="true"]', 'textarea[placeholder*="message" i]', 'form textarea'],
    send: ['button[data-testid*="send" i]', 'button[aria-label*="Send" i]', 'form button[type="submit"]'], stop: ['button[data-testid*="stop" i]', 'button[aria-label*="Stop" i]', 'button[aria-label*="Cancel" i]'],
    complete: ['button[aria-label*="Retry" i]', 'button[aria-label*="Copy" i]', '[data-testid*="copy" i]'], assistant: ['[data-testid*="assistant" i]', '[data-is-streaming]', '[data-role="assistant"]', 'main article'],
    status: ['main [role="status"]', 'main [aria-busy="true"]', '[data-testid*="thinking" i]', '[data-testid*="tool" i]', '[data-testid*="search" i]', 'main [aria-live="polite"]'],
    errors: ['main [role="alert"]', '[data-testid*="error" i]', '[data-testid*="usage" i]', '[data-testid*="login" i]', 'main [aria-live="assertive"]'],
  },
  busyPatterns: [[/searching|reading/i, 'searching', 'searching'], [/tool|artifact|code execution|running/i, 'analyzing', 'tool-or-artifact-work'], [/analyzing|working/i, 'analyzing', 'analyzing'], [/reasoning/i, 'reasoning', 'reasoning'], [/thinking/i, 'thinking', 'thinking']],
  errorPattern: /rate limit|limit reached|usage limit|message limit|quota|try again later|sign in|log in|captcha|cloudflare|unavailable|something went wrong|network error/i,
};
export class ClaudeAdapter extends ConfiguredProviderAdapter { constructor(key: string, settings: () => Settings, debug: DebugLog) { super(config, key, settings, debug); } }
