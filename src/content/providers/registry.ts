import { providerForUrl, runtimeProvider } from '../../lib/providers';
import type { Settings } from '../../lib/types';
import type { DebugLog } from '../debug';
import { ChatGptAdapter } from './chatgpt'; import { ClaudeAdapter } from './claude'; import { GrokAdapter } from './grok'; import { HuggingChatAdapter } from './huggingchat';
import { KimiAdapter } from './kimi'; import { LongCatAdapter } from './longcat'; import { MistralAdapter } from './mistral'; import { PerplexityAdapter } from './perplexity';
import { QwenAdapter } from './qwen'; import { SakanaAdapter } from './sakana'; import { ZaiAdapter } from './zai';
import type { ProviderAdapter } from './types';
export function createProviderAdapter(url: string, temporaryKey: string, settings: () => Settings, debug: DebugLog): ProviderAdapter | null {
  const metadata = providerForUrl(url); const provider = metadata ? runtimeProvider(metadata.id) : null; if (!provider) return null;
  if (provider.id === 'chatgpt') return new ChatGptAdapter(temporaryKey, settings, debug);
  if (provider.id === 'claude') return new ClaudeAdapter(temporaryKey, settings, debug);
  if (provider.id === 'qwen') return new QwenAdapter(temporaryKey, settings, debug);
  if (provider.id === 'mistral') return new MistralAdapter(temporaryKey, settings, debug);
  if (provider.id === 'huggingchat') return new HuggingChatAdapter(temporaryKey, settings, debug);
  if (provider.id === 'grok') return new GrokAdapter(temporaryKey, settings, debug);
  if (provider.id === 'kimi') return new KimiAdapter(temporaryKey, settings, debug);
  if (provider.id === 'perplexity') return new PerplexityAdapter(temporaryKey, settings, debug);
  if (provider.id === 'zai') return new ZaiAdapter(temporaryKey, settings, debug);
  if (provider.id === 'sakana') return new SakanaAdapter(temporaryKey, settings, debug);
  if (provider.id === 'longcat') return new LongCatAdapter(temporaryKey, settings, debug);
  return null;
}
