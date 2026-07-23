import { DEFAULT_SETTINGS, DEFAULT_STORAGE, SCHEMA_VERSION } from './constants';
import { createId } from './id';
import { hasPromptContent, normalizePromptText } from './text';
import type { ProviderId, QueueItem, QueueItemSource, QueueItemStatus, Settings, StorageState } from './types';

type UnknownRecord = Record<string, unknown>;
export interface MigrationResult { state: StorageState; changed: boolean; backup?: unknown }

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function queueItem(value: unknown, now: number): QueueItem | null {
  if (typeof value === 'string') {
    if (!hasPromptContent(value)) return null;
    return { id: createId(), text: normalizePromptText(value), source: 'manual', status: 'queued', createdAt: now, updatedAt: now };
  }
  if (!isRecord(value) || typeof value.text !== 'string' || !hasPromptContent(value.text)) return null;
  const sources: QueueItemSource[] = ['enter', 'import', 'manual', 'duplicate', 'edit'];
  const statuses: QueueItemStatus[] = ['queued', 'sending', 'failed'];
  return {
    id: typeof value.id === 'string' && value.id ? value.id : createId(),
    text: normalizePromptText(value.text),
    source: sources.includes(value.source as QueueItemSource) ? value.source as QueueItemSource : 'manual',
    status: statuses.includes(value.status as QueueItemStatus) ? value.status as QueueItemStatus : 'queued',
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : now,
  };
}

function queueMap(value: unknown, now: number): Record<string, QueueItem[]> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, items]) => Array.isArray(items)).map(([key, items]) => [key, (items as unknown[]).map((item) => queueItem(item, now)).filter((item): item is QueueItem => Boolean(item))]));
}

function pauseMap(value: unknown): Record<string, boolean> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, paused]) => [key, Boolean(paused)]));
}

export function migrateStorageSnapshot(input: unknown, now = Date.now()): MigrationResult {
  const raw = isRecord(input) ? input : {};
  const settings = { ...DEFAULT_SETTINGS, ...(isRecord(raw.settings) ? raw.settings as Partial<Settings> : {}) };
  if (raw.schemaVersion === SCHEMA_VERSION && isRecord(raw.queuesByProvider) && isRecord(raw.pausedByProvider) && isRecord(raw.queuesByProvider.chatgpt) && isRecord(raw.pausedByProvider.chatgpt)) {
    const queues = raw.queuesByProvider as UnknownRecord;
    const paused = raw.pausedByProvider as UnknownRecord;
    return {
      state: { schemaVersion: 2, settings, queuesByProvider: { chatgpt: queueMap(queues.chatgpt, now) }, pausedByProvider: { chatgpt: pauseMap(paused.chatgpt) } },
      changed: false,
    };
  }

  if (typeof raw.schemaVersion === 'number' && raw.schemaVersion > SCHEMA_VERSION) {
    return { state: structuredClone(DEFAULT_STORAGE), changed: true, backup: input };
  }

  const legacyQueues = queueMap(raw.queuesByConversation, now);
  const legacyPaused = pauseMap(raw.pausedByConversation);
  if (Array.isArray(raw.queue)) legacyQueues['legacy:default'] = (raw.queue as unknown[]).map((item) => queueItem(item, now)).filter((item): item is QueueItem => Boolean(item));
  const malformed = (raw.schemaVersion === SCHEMA_VERSION) || (raw.queuesByConversation !== undefined && !isRecord(raw.queuesByConversation));
  return {
    state: { schemaVersion: 2, settings, queuesByProvider: { chatgpt: legacyQueues }, pausedByProvider: { chatgpt: legacyPaused } },
    changed: raw.schemaVersion !== SCHEMA_VERSION || malformed,
    ...(malformed ? { backup: input } : {}),
  };
}

let migrationPromise: Promise<StorageState> | null = null;
export function ensureStorageMigrated(): Promise<StorageState> {
  migrationPromise ??= (async () => {
    const raw = await chrome.storage.local.get(null);
    const result = migrateStorageSnapshot(raw);
    if (result.changed) {
      const patch: UnknownRecord = { ...result.state };
      if (result.backup !== undefined) patch[`migrationBackup:${Date.now()}`] = result.backup;
      await chrome.storage.local.set(patch);
      if (result.state.settings.debugMode) console.info('[LM Query Queuer]', { event: 'storage-migration', schemaVersion: 2, backedUp: Boolean(result.backup) });
    }
    return result.state;
  })().finally(() => { migrationPromise = null; });
  return migrationPromise;
}

export async function readStorage(): Promise<StorageState> {
  await ensureStorageMigrated();
  const raw = await chrome.storage.local.get(['schemaVersion', 'settings', 'queuesByProvider', 'pausedByProvider']);
  return migrateStorageSnapshot(raw).state;
}

export async function updateQueue(providerId: ProviderId, key: string, updater: (items: QueueItem[]) => QueueItem[]): Promise<QueueItem[]> {
  const state = await readStorage();
  const providerQueues = state.queuesByProvider[providerId] ?? {};
  const next = updater(providerQueues[key] ?? []);
  await chrome.storage.local.set({ queuesByProvider: { ...state.queuesByProvider, [providerId]: { ...providerQueues, [key]: next } } });
  return next;
}

export async function setPaused(providerId: ProviderId, key: string, paused: boolean): Promise<void> {
  const state = await readStorage();
  const providerPaused = state.pausedByProvider[providerId] ?? {};
  await chrome.storage.local.set({ pausedByProvider: { ...state.pausedByProvider, [providerId]: { ...providerPaused, [key]: paused } } });
}

let settingsTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSettings: Partial<Settings> = {};
let pendingResolvers: Array<() => void> = [];

export function updateSettings(patch: Partial<Settings>): Promise<void> {
  pendingSettings = { ...pendingSettings, ...patch };
  if (settingsTimer) clearTimeout(settingsTimer);
  return new Promise((resolve) => {
    pendingResolvers.push(resolve);
    settingsTimer = setTimeout(async () => {
      const nextPatch = pendingSettings;
      const resolvers = pendingResolvers;
      pendingSettings = {};
      pendingResolvers = [];
      settingsTimer = null;
      const state = await readStorage();
      await chrome.storage.local.set({ settings: { ...state.settings, ...nextPatch } });
      resolvers.forEach((done) => done());
    }, 200);
  });
}

export async function migrateQueue(providerId: ProviderId, from: string, to: string): Promise<void> {
  if (from === to) return;
  const state = await readStorage();
  const providerQueues = state.queuesByProvider[providerId] ?? {};
  const source = providerQueues[from] ?? [];
  if (!source.length) return;
  const target = providerQueues[to] ?? [];
  const seen = new Set(target.map((item) => item.id));
  const merged = [...target, ...source.filter((item) => !seen.has(item.id))];
  const queues = { ...providerQueues, [to]: merged };
  delete queues[from];
  const providerPaused = { ...(state.pausedByProvider[providerId] ?? {}) };
  providerPaused[to] = Boolean(providerPaused[to] || providerPaused[from]);
  delete providerPaused[from];
  await chrome.storage.local.set({
    queuesByProvider: { ...state.queuesByProvider, [providerId]: queues },
    pausedByProvider: { ...state.pausedByProvider, [providerId]: providerPaused },
  });
}
