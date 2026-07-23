import type { OptionalProviderId, ProviderId, Settings, StorageState } from './types';

export const SCHEMA_VERSION = 4 as const;
export const RUNTIME_PROVIDER_IDS: readonly ProviderId[] = ['chatgpt', 'claude', 'qwen', 'mistral', 'huggingchat', 'grok', 'kimi', 'perplexity', 'zai', 'sakana', 'longcat'];
export const OPTIONAL_PROVIDER_IDS: readonly OptionalProviderId[] = ['claude', 'qwen', 'mistral', 'huggingchat', 'grok', 'kimi', 'perplexity', 'zai', 'sakana', 'longcat'];
export const DEFAULT_SETTINGS: Settings = { sendDelayMs: 3000, stabilityMs: 2000, fallbackReadyTimeoutMs: 15000, alwaysQueue: false, showToasts: true, pauseOnStop: true, pauseOnError: true, debugMode: false };
export const DEFAULT_PROVIDER_ENABLEMENT: Record<OptionalProviderId, boolean> = { claude: false, qwen: false, mistral: false, huggingchat: false, grok: false, kimi: false, perplexity: false, zai: false, sakana: false, longcat: false };
export const DEFAULT_STORAGE: StorageState = {
  schemaVersion: SCHEMA_VERSION, settings: DEFAULT_SETTINGS, providerEnablement: DEFAULT_PROVIDER_ENABLEMENT,
  queuesByProvider: { chatgpt: {}, claude: {}, qwen: {}, mistral: {}, huggingchat: {}, grok: {}, kimi: {}, perplexity: {}, zai: {}, sakana: {}, longcat: {} },
  pausedByProvider: { chatgpt: {}, claude: {}, qwen: {}, mistral: {}, huggingchat: {}, grok: {}, kimi: {}, perplexity: {}, zai: {}, sakana: {}, longcat: {} },
};
export const LEADER_HEARTBEAT_MS = 2000;
export const LEADER_STALE_MS = 6000;
export const MIGRATION_LOCK_STALE_MS = 10000;
