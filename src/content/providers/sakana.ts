import type { Settings } from '../../lib/types'; import type { DebugLog } from '../debug'; import { ConfiguredProviderAdapter, type ProviderAdapterConfig } from './base';
export function sakanaConversationId(value: string): string | null { try { return new URL(value).pathname.match(/^\/chat\/([^/?#]+)/)?.[1] ?? null; } catch { return null; } }
const config: ProviderAdapterConfig = {
  id: 'sakana', name: 'Sakana Chat', matches: ['https://chat.sakana.ai/*'], detect: (value) => /^https:\/\/chat\.sakana\.ai(?:\/|$)/i.test(value), conversationId: sakanaConversationId,
  selectors: {
    composer: ['[data-testid*="composer" i][contenteditable="true"]', '[role="textbox"][contenteditable="true"]', 'textarea[placeholder*="message" i]', 'textarea[placeholder*="質問" i]', 'form textarea'],
    send: ['button[data-testid*="send" i]', 'button[aria-label*="send" i]', 'button[aria-label*="送信" i]', 'form button[type="submit"]'], stop: ['button[data-testid*="stop" i]', 'button[aria-label*="stop" i]', 'button[aria-label*="停止" i]', 'button[aria-label*="cancel" i]'],
    complete: ['button[aria-label*="copy" i]', 'button[aria-label*="コピー" i]', '[data-testid*="copy" i]', 'button[aria-label*="regenerate" i]'], assistant: ['[data-testid*="assistant" i]', '[data-role="assistant"]', '[class*="assistant-message" i]', 'main article'],
    status: ['main [role="status"]', 'main [aria-busy="true"]', '[data-testid*="thinking" i]', '[data-testid*="search" i]', '[data-testid*="progress" i]'],
    errors: ['main [role="alert"]', '[data-testid*="error" i]', '[data-testid*="limit" i]', '[data-testid*="login" i]', 'main [aria-live="assertive"]'],
    citations: ['[data-testid*="citation" i]', '[data-testid*="source" i]', '[class*="citation" i]'],
    thinking: ['[data-testid*="thinking" i]', '[class*="thinking" i]', '[class*="reasoning" i]'],
    tools: ['[data-testid*="tool" i]', '[data-testid*="task" i]', '[class*="tool-call" i]'],
  },
  busyPatterns: [[/searching|browsing|検索中|検索しています/iu, 'searching', 'searching'], [/analyzing|processing|分析中|分析しています/iu, 'analyzing', 'analyzing'], [/generating|生成中|回答中|生成しています/iu, 'streaming', 'generating'], [/reasoning|thinking|考え中|思考中|考えています/iu, 'thinking', 'thinking']],
  errorPattern: /rate limit|usage limit|quota|try again later|sign in|log in|ログイン|利用上限|認証|verify human|captcha|access denied|unavailable|エラー|ネットワーク/iu,
};
export class SakanaAdapter extends ConfiguredProviderAdapter { constructor(key: string, settings: () => Settings, debug: DebugLog) { super(config, key, settings, debug); } }
