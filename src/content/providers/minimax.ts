import type { SelectorOverrides, Settings } from '../../lib/types'; import type { DebugLog } from '../debug'; import { ConfiguredProviderAdapter, type ProviderAdapterConfig } from './base';
export function miniMaxConversationId(value: string): string | null { try { return new URL(value).pathname.match(/^\/(?:chat|agent|task)\/([^/?#]+)/)?.[1] ?? null; } catch { return null; } }
const config: ProviderAdapterConfig = {
  id: 'minimax', name: 'MiniMax AI', matches: ['https://minimax.io/*', 'https://www.minimax.io/*', 'https://agent.minimax.io/*', 'https://www.agent.minimax.io/*'], detect: (value) => /^https:\/\/(?:www\.agent\.|agent\.|www\.)?minimax\.io(?:\/|$)/i.test(value), conversationId: miniMaxConversationId,
  experimental: true, pauseOnUncertain: true, defaultStabilityMs: 3500, defaultFallbackReadyTimeoutMs: 30000,
  selectors: {
    composer: ['[data-testid*="composer" i][contenteditable="true"]', '[data-testid*="prompt" i] textarea', '[role="textbox"][contenteditable="true"]', 'textarea[placeholder*="message" i]', 'textarea[placeholder*="ask" i]', 'form textarea'],
    send: ['button[data-testid*="send" i]', 'button[aria-label*="send" i]', 'button[aria-label*="发送" i]', 'form button[type="submit"]'], stop: ['button[data-testid*="stop" i]', 'button[aria-label*="stop" i]', 'button[aria-label*="停止" i]', 'button[aria-label*="cancel" i]'],
    complete: ['button[aria-label*="regenerate" i]', 'button[aria-label*="retry" i]', 'button[aria-label*="copy" i]', '[data-testid*="regenerate" i]'], assistant: ['[data-testid*="assistant" i]', '[data-role="assistant"]', '[class*="assistant-message" i]', '[class*="answer" i]', 'main article'],
    status: ['main [role="status"]', 'main [aria-busy="true"]', '[data-testid*="planning" i]', '[data-testid*="task-progress" i]', '[data-testid*="thinking" i]'],
    errors: ['main [role="alert"]', '[data-testid*="error" i]', '[data-testid*="limit" i]', '[data-testid*="login" i]', 'main [aria-live="assertive"]'],
    citations: ['[data-testid*="citation" i]', '[data-testid*="source" i]', '[class*="citation" i]'], thinking: ['[data-testid*="thinking" i]', '[data-testid*="planning" i]', '[class*="reasoning" i]'],
    tools: ['[data-testid*="tool" i]', '[data-testid*="task" i]', '[data-testid*="file" i]', '[class*="tool-call" i]', '[class*="task-progress" i]'], terminal: ['[data-testid*="terminal" i]', '[data-testid*="output" i]', '[class*="terminal" i]'], auxiliary: ['[data-testid*="file-progress" i]'],
  },
  busyPatterns: [[/searching|browsing|搜索中|正在搜索/iu, 'searching', 'searching'], [/planning|规划中|正在规划/iu, 'reasoning', 'planning'], [/executing|running|执行中|正在执行|调用工具/iu, 'analyzing', 'executing'], [/analyzing|processing file|分析中|文件处理中/iu, 'analyzing', 'analyzing'], [/generating|生成中|正在生成/iu, 'streaming', 'generating'], [/working|thinking|思考中|正在思考/iu, 'thinking', 'thinking']],
  errorPattern: /rate limit|limit reached|usage limit|message limit|quota|try again later|sign in|log in|请登录|登录|频率限制|次数已用完|验证码|captcha|verify human|verification required|access denied|unavailable|tool failed|task failed|network error|出错|网络错误/iu,
};
export class MiniMaxAdapter extends ConfiguredProviderAdapter { constructor(key: string, settings: () => Settings, debug: DebugLog, overrides: SelectorOverrides = {}) { super(config, key, settings, debug, overrides); } }
