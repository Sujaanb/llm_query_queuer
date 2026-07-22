import { DEFAULT_SETTINGS } from './constants';
import type { QueueItem, Settings, StorageState } from './types';

export async function readStorage(): Promise<StorageState> {
  const raw = await chrome.storage.local.get(['schemaVersion', 'settings', 'queuesByConversation', 'pausedByConversation']);
  return {
    schemaVersion: 1,
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings ?? {}) },
    queuesByConversation: (raw.queuesByConversation ?? {}) as StorageState['queuesByConversation'],
    pausedByConversation: (raw.pausedByConversation ?? {}) as StorageState['pausedByConversation'],
  };
}

export async function updateQueue(key: string, updater: (items: QueueItem[]) => QueueItem[]): Promise<QueueItem[]> {
  const state = await readStorage();
  const next = updater(state.queuesByConversation[key] ?? []);
  await chrome.storage.local.set({ queuesByConversation: { ...state.queuesByConversation, [key]: next } });
  return next;
}

export async function setPaused(key: string, paused: boolean): Promise<void> {
  const state = await readStorage();
  await chrome.storage.local.set({ pausedByConversation: { ...state.pausedByConversation, [key]: paused } });
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const state = await readStorage();
  await chrome.storage.local.set({ settings: { ...state.settings, ...patch } });
}

export async function migrateQueue(from: string, to: string): Promise<void> {
  if (from === to) return;
  const state = await readStorage();
  const source = state.queuesByConversation[from] ?? [];
  if (!source.length) return;
  const target = state.queuesByConversation[to] ?? [];
  const seen = new Set(target.map((item) => item.id));
  const merged = [...target, ...source.filter((item) => !seen.has(item.id))];
  const queues = { ...state.queuesByConversation, [to]: merged };
  delete queues[from];
  const paused = { ...state.pausedByConversation };
  paused[to] = Boolean(paused[to] || paused[from]);
  delete paused[from];
  await chrome.storage.local.set({ queuesByConversation: queues, pausedByConversation: paused });
}
