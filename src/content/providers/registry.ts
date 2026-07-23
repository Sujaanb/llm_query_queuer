import { enabledProviderForUrl } from '../../lib/providers';
import type { Settings } from '../../lib/types';
import type { DebugLog } from '../debug';
import { ChatGptAdapter } from './chatgpt';
import type { ProviderAdapter } from './types';

export function createProviderAdapter(url: string, temporaryKey: string, settings: () => Settings, debug: DebugLog): ProviderAdapter | null {
  const metadata = enabledProviderForUrl(url);
  if (!metadata) return null;
  if (metadata.id === 'chatgpt') return new ChatGptAdapter(temporaryKey, settings, debug);
  return null;
}
