import { DEFAULT_SETTINGS, EXPERIMENTAL_FALLBACK_READY_TIMEOUT_MS, EXPERIMENTAL_SEND_DELAY_MS, EXPERIMENTAL_STABILITY_MS, OPTIONAL_PROVIDER_IDS } from './constants';
import type { OptionalProviderId, ProviderId, ProviderStatus, Settings } from './types';

export interface ProviderMetadata {
  id: string; name: string; phase: number; builtIn: boolean; enabledByDefault: boolean; optionalOrigins: readonly string[]; matches: readonly string[]; description: string; status: ProviderStatus;
  experimental?: boolean; accessDependent?: boolean; defaultSendDelayMs?: number; defaultStabilityMs?: number; defaultFallbackReadyTimeoutMs?: number; pauseOnUncertain?: boolean;
}
const experimental = { experimental: true, defaultSendDelayMs: EXPERIMENTAL_SEND_DELAY_MS, defaultStabilityMs: EXPERIMENTAL_STABILITY_MS, defaultFallbackReadyTimeoutMs: EXPERIMENTAL_FALLBACK_READY_TIMEOUT_MS, pauseOnUncertain: true } as const;
export const PROVIDERS: readonly ProviderMetadata[] = [
  { id: 'chatgpt', name: 'ChatGPT', phase: 1, builtIn: true, enabledByDefault: true, optionalOrigins: [], matches: ['https://chatgpt.com/*', 'https://chat.openai.com/*'], description: 'Built-in ChatGPT queue support.', status: 'stable' },
  { id: 'claude', name: 'Claude', phase: 2, builtIn: false, enabledByDefault: false, optionalOrigins: ['https://claude.ai/*', 'https://www.claude.ai/*'], matches: ['https://claude.ai/*', 'https://www.claude.ai/*'], description: 'Optional Claude chat support.', status: 'beta' },
  { id: 'qwen', name: 'Qwen', phase: 2, builtIn: false, enabledByDefault: false, optionalOrigins: ['https://chat.qwen.ai/*'], matches: ['https://chat.qwen.ai/*'], description: 'Optional Qwen chat support.', status: 'beta' },
  { id: 'mistral', name: 'Mistral', phase: 2, builtIn: false, enabledByDefault: false, optionalOrigins: ['https://chat.mistral.ai/*'], matches: ['https://chat.mistral.ai/*'], description: 'Optional Mistral/Vibe chat support.', status: 'beta' },
  { id: 'huggingchat', name: 'HuggingChat', phase: 2, builtIn: false, enabledByDefault: false, optionalOrigins: ['https://huggingface.co/chat/*'], matches: ['https://huggingface.co/chat/*'], description: 'Optional HuggingChat support.', status: 'beta' },
  { id: 'grok', name: 'Grok', phase: 3, builtIn: false, enabledByDefault: false, optionalOrigins: ['https://grok.com/*', 'https://www.grok.com/*'], matches: ['https://grok.com/*', 'https://www.grok.com/*'], description: 'Optional Grok chat, search, citation, and image-result support.', status: 'beta' },
  { id: 'kimi', name: 'Kimi', phase: 3, builtIn: false, enabledByDefault: false, optionalOrigins: ['https://kimi.com/*', 'https://www.kimi.com/*'], matches: ['https://kimi.com/*', 'https://www.kimi.com/*'], description: 'Optional Kimi long-context, search, and file-analysis support.', status: 'beta' },
  { id: 'perplexity', name: 'Perplexity', phase: 3, builtIn: false, enabledByDefault: false, optionalOrigins: ['https://perplexity.ai/*', 'https://www.perplexity.ai/*'], matches: ['https://perplexity.ai/*', 'https://www.perplexity.ai/*'], description: 'Optional Perplexity answer-engine and source stability support.', status: 'beta' },
  { id: 'zai', name: 'Z.ai', phase: 3, builtIn: false, enabledByDefault: false, optionalOrigins: ['https://chat.z.ai/*', 'https://z.ai/*', 'https://www.z.ai/*'], matches: ['https://chat.z.ai/*', 'https://z.ai/*', 'https://www.z.ai/*'], description: 'Optional Z.ai tools, search, code, and multi-step support.', status: 'beta' },
  { id: 'sakana', name: 'Sakana Chat', phase: 3, builtIn: false, enabledByDefault: false, optionalOrigins: ['https://chat.sakana.ai/*'], matches: ['https://chat.sakana.ai/*'], description: 'Optional Sakana Chat support with English and Japanese status detection.', status: 'beta' },
  { id: 'longcat', name: 'LongCat AI', phase: 3, builtIn: false, enabledByDefault: false, optionalOrigins: ['https://longcat.ai/*', 'https://www.longcat.ai/*', 'https://longcat.chat/*', 'https://www.longcat.chat/*'], matches: ['https://longcat.ai/*', 'https://www.longcat.ai/*', 'https://longcat.chat/*', 'https://www.longcat.chat/*'], description: 'Optional LongCat coding-agent, terminal, and task-progress support.', status: 'beta' },
  { id: 'gemini', name: 'Gemini', phase: 4, builtIn: false, enabledByDefault: false, optionalOrigins: ['https://gemini.google.com/*'], matches: ['https://gemini.google.com/*'], description: 'Experimental Gemini support; selectors may require tuning.', status: 'experimental', ...experimental },
  { id: 'metaai', name: 'Meta AI', phase: 4, builtIn: false, enabledByDefault: false, optionalOrigins: ['https://meta.ai/*', 'https://www.meta.ai/*'], matches: ['https://meta.ai/*', 'https://www.meta.ai/*'], description: 'Experimental Meta AI support; availability is region and account dependent.', status: 'experimental', ...experimental },
  { id: 'minimax', name: 'MiniMax AI', phase: 4, builtIn: false, enabledByDefault: false, optionalOrigins: ['https://minimax.io/*', 'https://www.minimax.io/*', 'https://agent.minimax.io/*', 'https://www.agent.minimax.io/*'], matches: ['https://minimax.io/*', 'https://www.minimax.io/*', 'https://agent.minimax.io/*', 'https://www.agent.minimax.io/*'], description: 'Experimental MiniMax agent/task support.', status: 'experimental', ...experimental },
  { id: 'aristotle', name: 'Aristotle', phase: 4, builtIn: false, enabledByDefault: false, optionalOrigins: ['https://aristotle.science/*', 'https://www.aristotle.science/*', 'https://*.aristotle.science/*'], matches: ['https://aristotle.science/*', 'https://www.aristotle.science/*', 'https://*.aristotle.science/*'], description: 'Experimental, access-dependent Aristotle scientific assistant support.', status: 'experimental', accessDependent: true, ...experimental },
];
function matchPattern(url: URL, pattern: string): boolean {
  const candidate = new URL(pattern.replace(/\*$/, '')); const wildcardHost = candidate.hostname.startsWith('*.');
  const host = wildcardHost ? url.hostname.endsWith('.' + candidate.hostname.slice(2)) : url.hostname === candidate.hostname;
  const pathMatches = candidate.pathname === '/' || url.pathname.startsWith(candidate.pathname) || (candidate.pathname.endsWith('/') && url.pathname === candidate.pathname.slice(0, -1));
  return url.protocol === candidate.protocol && host && pathMatches;
}
export function providerForUrl(value?: string): ProviderMetadata | null { if (!value) return null; try { const url = new URL(value); return PROVIDERS.find((provider) => provider.matches.some((pattern) => matchPattern(url, pattern))) ?? null; } catch { return null; } }
export function runtimeProvider(id: string): (ProviderMetadata & { id: ProviderId }) | null { const provider = PROVIDERS.find((entry) => entry.id === id && ['stable', 'beta', 'experimental'].includes(entry.status)); return provider ? provider as ProviderMetadata & { id: ProviderId } : null; }
export function optionalProvider(id: string): (ProviderMetadata & { id: OptionalProviderId }) | null { const provider = runtimeProvider(id); return provider && OPTIONAL_PROVIDER_IDS.includes(provider.id as OptionalProviderId) ? provider as ProviderMetadata & { id: OptionalProviderId } : null; }
export function isProviderEnabled(id: ProviderId, enablement: Record<OptionalProviderId, boolean>): boolean { return id === 'chatgpt' || Boolean(enablement[id]); }
export function queueScope(providerId: ProviderId, conversationKey: string): string { return providerId + ':' + conversationKey; }
export function effectiveProviderSettings(providerId: ProviderId, settings: Settings): Settings {
  const provider = runtimeProvider(providerId); if (!provider?.experimental) return settings;
  return {
    ...settings,
    sendDelayMs: settings.sendDelayMs === DEFAULT_SETTINGS.sendDelayMs ? provider.defaultSendDelayMs ?? settings.sendDelayMs : settings.sendDelayMs,
    stabilityMs: settings.stabilityMs === DEFAULT_SETTINGS.stabilityMs ? provider.defaultStabilityMs ?? settings.stabilityMs : settings.stabilityMs,
    fallbackReadyTimeoutMs: settings.fallbackReadyTimeoutMs === DEFAULT_SETTINGS.fallbackReadyTimeoutMs ? provider.defaultFallbackReadyTimeoutMs ?? settings.fallbackReadyTimeoutMs : settings.fallbackReadyTimeoutMs,
  };
}
