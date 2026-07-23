import type { ProviderId } from './types';

export interface ProviderMetadata { id: string; name: string; enabled: boolean; matches: readonly RegExp[] }
export const PROVIDERS: readonly ProviderMetadata[] = [
  { id: 'chatgpt', name: 'ChatGPT', enabled: true, matches: [/^https:\/\/chatgpt\.com(?:\/|$)/i, /^https:\/\/chat\.openai\.com(?:\/|$)/i] },
  { id: 'gemini', name: 'Gemini', enabled: false, matches: [/^https:\/\/gemini\.google\.com(?:\/|$)/i] },
  { id: 'qwen', name: 'Qwen', enabled: false, matches: [/^https:\/\/chat\.qwen\.ai(?:\/|$)/i] },
  { id: 'claude', name: 'Claude', enabled: false, matches: [/^https:\/\/claude\.ai(?:\/|$)/i] },
  { id: 'grok', name: 'Grok', enabled: false, matches: [/^https:\/\/grok\.com(?:\/|$)/i] },
  { id: 'kimi', name: 'Kimi', enabled: false, matches: [/^https:\/\/kimi\.(?:com|moonshot\.cn)(?:\/|$)/i] },
  { id: 'perplexity', name: 'Perplexity', enabled: false, matches: [/^https:\/\/(?:www\.)?perplexity\.ai(?:\/|$)/i] },
  { id: 'zai', name: 'Z.ai', enabled: false, matches: [/^https:\/\/chat\.z\.ai(?:\/|$)/i] },
  { id: 'minimax', name: 'MiniMax AI', enabled: false, matches: [/^https:\/\/(?:www\.)?minimax\.io(?:\/|$)/i] },
  { id: 'huggingchat', name: 'HuggingChat', enabled: false, matches: [/^https:\/\/huggingface\.co\/chat(?:\/|$)/i] },
  { id: 'aristotle', name: 'Aristotle.science', enabled: false, matches: [/^https:\/\/(?:www\.)?aristotle\.science(?:\/|$)/i] },
  { id: 'mistral', name: 'Mistral', enabled: false, matches: [/^https:\/\/chat\.mistral\.ai(?:\/|$)/i] },
  { id: 'meta', name: 'Meta AI', enabled: false, matches: [/^https:\/\/(?:www\.)?meta\.ai(?:\/|$)/i] },
  { id: 'sakana', name: 'Sakana Chat', enabled: false, matches: [/^https:\/\/(?:www\.)?sakana\.ai(?:\/|$)/i] },
  { id: 'longcat', name: 'LongCat AI', enabled: false, matches: [/^https:\/\/(?:www\.)?longcat\.chat(?:\/|$)/i] },
];
export function providerForUrl(url?: string): ProviderMetadata | null { if (!url) return null; return PROVIDERS.find((provider) => provider.matches.some((pattern) => pattern.test(url))) ?? null; }
export function enabledProviderForUrl(url?: string): ProviderMetadata & { id: ProviderId } | null { const provider = providerForUrl(url); return provider?.enabled ? provider as ProviderMetadata & { id: ProviderId } : null; }
export function queueScope(providerId: ProviderId, conversationKey: string): string { return `${providerId}:${conversationKey}`; }
