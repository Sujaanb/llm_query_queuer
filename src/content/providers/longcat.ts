import type { Settings } from '../../lib/types'; import type { DebugLog } from '../debug'; import { ConfiguredProviderAdapter, type ProviderAdapterConfig } from './base';
export function longcatConversationId(value: string): string | null { try { return new URL(value).pathname.match(/^\/chat\/([^/?#]+)/)?.[1] ?? null; } catch { return null; } }
const config: ProviderAdapterConfig = {
  id: 'longcat', name: 'LongCat AI', matches: ['https://longcat.ai/*', 'https://www.longcat.ai/*', 'https://longcat.chat/*', 'https://www.longcat.chat/*'], detect: (value) => /^https:\/\/(?:www\.)?longcat\.(?:ai|chat)(?:\/|$)/i.test(value), conversationId: longcatConversationId,
  selectors: {
    composer: ['[data-testid*="composer" i][contenteditable="true"]', '[role="textbox"][contenteditable="true"]', 'textarea[placeholder*="message" i]', 'textarea[placeholder*="ask" i]', 'form textarea'],
    send: ['button[data-testid*="send" i]', 'button[aria-label*="send" i]', 'form button[type="submit"]'], stop: ['button[data-testid*="stop" i]', 'button[aria-label*="stop" i]', 'button[aria-label*="cancel" i]'],
    complete: ['button[aria-label*="copy" i]', '[data-testid*="copy" i]', 'button[aria-label*="regenerate" i]'], assistant: ['[data-testid*="assistant" i]', '[data-role="assistant"]', '[class*="assistant-message" i]', 'main article'],
    status: ['main [role="status"]', 'main [aria-busy="true"]', '[data-testid*="thinking" i]', '[data-testid*="tool" i]', '[data-testid*="task-progress" i]'],
    errors: ['main [role="alert"]', '[data-testid*="error" i]', '[data-testid*="limit" i]', '[data-testid*="login" i]', 'main [aria-live="assertive"]'],
    citations: ['[data-testid*="citation" i]', '[data-testid*="source" i]', '[class*="citation" i]'],
    thinking: ['[data-testid*="thinking" i]', '[class*="thinking" i]', '[class*="reasoning" i]'],
    tools: ['[data-testid*="tool" i]', '[data-testid*="task" i]', '[data-testid*="terminal" i]', '[data-testid*="code" i]', '[class*="tool-call" i]', '[class*="task-progress" i]', '[class*="terminal" i]'],
  },
  busyPatterns: [[/running tool|using tool|tool call|executing|terminal|coding/iu, 'analyzing', 'tool-or-terminal-work'], [/task in progress|working on task|step \d+/iu, 'analyzing', 'task-progress'], [/searching|browsing/iu, 'searching', 'searching'], [/analyzing|processing/iu, 'analyzing', 'analyzing'], [/reasoning|thinking/iu, 'reasoning', 'reasoning'], [/generating|writing/iu, 'streaming', 'generating']],
  errorPattern: /rate limit|usage limit|quota|try again later|sign in|log in|verify human|captcha|access denied|unavailable|tool failed|terminal error|something went wrong|network error/iu,
};
export class LongCatAdapter extends ConfiguredProviderAdapter { constructor(key: string, settings: () => Settings, debug: DebugLog) { super(config, key, settings, debug); } }
