import type { Settings } from '../../lib/types'; import type { DebugLog } from '../debug'; import { ConfiguredProviderAdapter, type ProviderAdapterConfig } from './base';
export function zaiConversationId(value: string): string | null { try { return new URL(value).pathname.match(/^\/(?:chat|c)\/([^/?#]+)/)?.[1] ?? null; } catch { return null; } }
const config: ProviderAdapterConfig = {
  id: 'zai', name: 'Z.ai', matches: ['https://chat.z.ai/*', 'https://z.ai/*', 'https://www.z.ai/*'], detect: (value) => /^https:\/\/(?:chat\.|www\.)?z\.ai(?:\/|$)/i.test(value), conversationId: zaiConversationId,
  selectors: {
    composer: ['[data-testid*="composer" i][contenteditable="true"]', '[role="textbox"][contenteditable="true"]', 'textarea[placeholder*="message" i]', 'textarea[placeholder*="ask" i]', 'form textarea'],
    send: ['button[data-testid*="send" i]', 'button[aria-label*="send" i]', 'button[aria-label*="发送" i]', 'form button[type="submit"]'], stop: ['button[data-testid*="stop" i]', 'button[aria-label*="stop" i]', 'button[aria-label*="停止" i]', 'button[aria-label*="cancel" i]'],
    complete: ['button[aria-label*="copy" i]', 'button[aria-label*="复制" i]', '[data-testid*="copy" i]', 'button[aria-label*="regenerate" i]'], assistant: ['[data-testid*="assistant" i]', '[data-role="assistant"]', '[class*="assistant-message" i]', 'main article'],
    status: ['main [role="status"]', 'main [aria-busy="true"]', '[data-testid*="thinking" i]', '[data-testid*="tool" i]', '[data-testid*="progress" i]'],
    errors: ['main [role="alert"]', '[data-testid*="error" i]', '[data-testid*="limit" i]', '[data-testid*="login" i]', 'main [aria-live="assertive"]'],
    citations: ['[data-testid*="citation" i]', '[data-testid*="source" i]', '[class*="citation" i]', '[class*="search-result" i]'],
    thinking: ['[data-testid*="thinking" i]', '[class*="thinking" i]', '[class*="reasoning" i]'],
    tools: ['[data-testid*="tool" i]', '[data-testid*="task" i]', '[data-testid*="code" i]', '[class*="tool-call" i]', '[class*="task-progress" i]'],
  },
  busyPatterns: [[/searching|browsing|搜索中|正在搜索/iu, 'searching', 'searching'], [/running tool|using tool|tool call|执行工具|调用工具/iu, 'analyzing', 'tool-work'], [/analyzing|processing|分析中|正在分析/iu, 'analyzing', 'analyzing'], [/generating|生成中|正在生成/iu, 'streaming', 'generating'], [/reasoning|thinking|思考中|正在思考/iu, 'reasoning', 'reasoning']],
  errorPattern: /rate limit|usage limit|quota|try again later|sign in|log in|请登录|登录|频率限制|验证码|verify human|captcha|access denied|unavailable|出错|网络错误/iu,
};
export class ZaiAdapter extends ConfiguredProviderAdapter { constructor(key: string, settings: () => Settings, debug: DebugLog) { super(config, key, settings, debug); } }
