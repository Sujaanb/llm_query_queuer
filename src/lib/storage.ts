import { DEFAULT_PROVIDER_ENABLEMENT, DEFAULT_SETTINGS, DEFAULT_STORAGE, OPTIONAL_PROVIDER_IDS, RUNTIME_PROVIDER_IDS, SCHEMA_VERSION } from './constants';
import { createId } from './id';
import { hasPromptContent, normalizePromptText } from './text';
import { validateSelectorOverrides } from './selectors';
import type { OptionalProviderId, ProviderId, QueueItem, QueueItemSource, QueueItemStatus, SelectorOverrides, Settings, StorageState } from './types';

type UnknownRecord = Record<string, unknown>;
export interface MigrationResult { state: StorageState; changed: boolean; backup?: unknown }
const isRecord = (value: unknown): value is UnknownRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function queueItem(value: unknown, now: number): QueueItem | null {
  if (typeof value === 'string') return hasPromptContent(value) ? { id: createId(), text: normalizePromptText(value), source: 'manual', status: 'queued', createdAt: now, updatedAt: now } : null;
  if (!isRecord(value) || typeof value.text !== 'string' || !hasPromptContent(value.text)) return null;
  const sources: QueueItemSource[] = ['enter', 'import', 'manual', 'duplicate', 'edit'];
  const statuses: QueueItemStatus[] = ['queued', 'sending', 'failed'];
  return {
    id: typeof value.id === 'string' && value.id ? value.id : createId(), text: normalizePromptText(value.text),
    source: sources.includes(value.source as QueueItemSource) ? value.source as QueueItemSource : 'manual',
    status: statuses.includes(value.status as QueueItemStatus) ? value.status as QueueItemStatus : 'queued',
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : now, updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : now,
  };
}
function queueMap(value: unknown, now: number): Record<string, QueueItem[]> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, items]) => Array.isArray(items)).map(([key, items]) => [key, (items as unknown[]).map((item) => queueItem(item, now)).filter((item): item is QueueItem => Boolean(item))]));
}
function pauseMap(value: unknown): Record<string, boolean> { return isRecord(value) ? Object.fromEntries(Object.entries(value).map(([key, paused]) => [key, Boolean(paused)])) : {}; }
function providerQueueMaps(value: unknown, now: number): StorageState['queuesByProvider'] {
  const source = isRecord(value) ? value : {};
  return Object.fromEntries(RUNTIME_PROVIDER_IDS.map((id) => [id, queueMap(source[id], now)])) as StorageState['queuesByProvider'];
}
function providerPauseMaps(value: unknown): StorageState['pausedByProvider'] {
  const source = isRecord(value) ? value : {};
  return Object.fromEntries(RUNTIME_PROVIDER_IDS.map((id) => [id, pauseMap(source[id])])) as StorageState['pausedByProvider'];
}
function enablementMap(value: unknown): StorageState['providerEnablement'] {
  const source = isRecord(value) ? value : {};
  return Object.fromEntries(OPTIONAL_PROVIDER_IDS.map((id) => [id, source[id] === true])) as StorageState['providerEnablement'];
}
function selectorOverridesMap(value: unknown): StorageState['selectorOverridesByProvider'] {
  const source = isRecord(value) ? value : {}; const result: Partial<Record<ProviderId, SelectorOverrides>> = {};
  for (const id of RUNTIME_PROVIDER_IDS) { const validated = validateSelectorOverrides(source[id]); if (validated.ok && Object.keys(validated.value).length) result[id] = validated.value; }
  return result;
}

export function migrateStorageSnapshot(input: unknown, now = Date.now()): MigrationResult {
  const raw = isRecord(input) ? input : {};
  const settings = { ...DEFAULT_SETTINGS, ...(isRecord(raw.settings) ? raw.settings as Partial<Settings> : {}) };
  const rawQueues = isRecord(raw.queuesByProvider) ? raw.queuesByProvider : null;
  const rawPaused = isRecord(raw.pausedByProvider) ? raw.pausedByProvider : null;
  const selectorOverridesByProvider = selectorOverridesMap(raw.selectorOverridesByProvider);
  if (typeof raw.schemaVersion === 'number' && raw.schemaVersion > SCHEMA_VERSION) return { state: structuredClone(DEFAULT_STORAGE), changed: true, backup: input };
  if (raw.schemaVersion === SCHEMA_VERSION && rawQueues && rawPaused && RUNTIME_PROVIDER_IDS.every((id) => isRecord(rawQueues[id]) && isRecord(rawPaused[id]))) {
    return { state: { schemaVersion: SCHEMA_VERSION, settings, providerEnablement: enablementMap(raw.providerEnablement), queuesByProvider: providerQueueMaps(rawQueues, now), pausedByProvider: providerPauseMaps(rawPaused), selectorOverridesByProvider }, changed: false };
  }
  if (raw.schemaVersion === 4 && rawQueues && rawPaused && ['chatgpt', 'claude', 'qwen', 'mistral', 'huggingchat', 'grok', 'kimi', 'perplexity', 'zai', 'sakana', 'longcat'].every((id) => isRecord(rawQueues[id]) && isRecord(rawPaused[id]))) { return { state: { schemaVersion: SCHEMA_VERSION, settings, providerEnablement: enablementMap(raw.providerEnablement), queuesByProvider: providerQueueMaps(rawQueues, now), pausedByProvider: providerPauseMaps(rawPaused), selectorOverridesByProvider }, changed: true }; }
  if (raw.schemaVersion === 3 && rawQueues && rawPaused && ['chatgpt', 'claude', 'qwen', 'mistral', 'huggingchat'].every((id) => isRecord(rawQueues[id]) && isRecord(rawPaused[id]))) { return { state: { schemaVersion: SCHEMA_VERSION, settings, providerEnablement: enablementMap(raw.providerEnablement), queuesByProvider: providerQueueMaps(rawQueues, now), pausedByProvider: providerPauseMaps(rawPaused), selectorOverridesByProvider: {} }, changed: true }; }
  if (raw.schemaVersion === 2 && rawQueues && rawPaused) {
    return { state: { schemaVersion: SCHEMA_VERSION, settings, providerEnablement: { ...DEFAULT_PROVIDER_ENABLEMENT }, queuesByProvider: providerQueueMaps(rawQueues, now), pausedByProvider: providerPauseMaps(rawPaused), selectorOverridesByProvider: {} }, changed: true };
  }
  const chatgptQueues = queueMap(raw.queuesByConversation, now);
  if (Array.isArray(raw.queue)) chatgptQueues['legacy:default'] = (raw.queue as unknown[]).map((item) => queueItem(item, now)).filter((item): item is QueueItem => Boolean(item));
  const queues = providerQueueMaps({}, now); queues.chatgpt = chatgptQueues;
  const paused = providerPauseMaps({}); paused.chatgpt = pauseMap(raw.pausedByConversation);
  const malformed = raw.schemaVersion === 3 || raw.schemaVersion === 4 || raw.schemaVersion === SCHEMA_VERSION || (raw.queuesByConversation !== undefined && !isRecord(raw.queuesByConversation));
  return { state: { schemaVersion: SCHEMA_VERSION, settings, providerEnablement: { ...DEFAULT_PROVIDER_ENABLEMENT }, queuesByProvider: queues, pausedByProvider: paused, selectorOverridesByProvider: {} }, changed: true, ...(malformed ? { backup: input } : {}) };
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
      if (result.state.settings.debugMode) console.info('[LM Query Queuer]', { event: 'storage-migration', schemaVersion: SCHEMA_VERSION, backedUp: Boolean(result.backup) });
    }
    return result.state;
  })().finally(() => { migrationPromise = null; });
  return migrationPromise;
}
export async function readStorage(): Promise<StorageState> {
  await ensureStorageMigrated();
  const raw = await chrome.storage.local.get(['schemaVersion', 'settings', 'providerEnablement', 'queuesByProvider', 'pausedByProvider', 'selectorOverridesByProvider']);
  return migrateStorageSnapshot(raw).state;
}
export async function updateQueue(providerId: ProviderId, key: string, updater: (items: QueueItem[]) => QueueItem[]): Promise<QueueItem[]> {
  const state = await readStorage(); const providerQueues = state.queuesByProvider[providerId] ?? {}; const next = updater(providerQueues[key] ?? []);
  await chrome.storage.local.set({ queuesByProvider: { ...state.queuesByProvider, [providerId]: { ...providerQueues, [key]: next } } }); return next;
}
export async function setPaused(providerId: ProviderId, key: string, paused: boolean): Promise<void> {
  const state = await readStorage(); const providerPaused = state.pausedByProvider[providerId] ?? {};
  await chrome.storage.local.set({ pausedByProvider: { ...state.pausedByProvider, [providerId]: { ...providerPaused, [key]: paused } } });
}
export async function updateSelectorOverrides(providerId: ProviderId, overrides: SelectorOverrides | null): Promise<void> {
  const state = await readStorage(); const next = { ...state.selectorOverridesByProvider }; if (overrides && Object.keys(overrides).length) next[providerId] = overrides; else delete next[providerId]; await chrome.storage.local.set({ selectorOverridesByProvider: next });
}
export async function setProviderEnabled(providerId: OptionalProviderId, enabled: boolean): Promise<void> {
  const state = await readStorage(); await chrome.storage.local.set({ providerEnablement: { ...state.providerEnablement, [providerId]: enabled } });
}
let settingsTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSettings: Partial<Settings> = {};
let pendingResolvers: Array<() => void> = [];
export function updateSettings(patch: Partial<Settings>): Promise<void> {
  pendingSettings = { ...pendingSettings, ...patch }; if (settingsTimer) clearTimeout(settingsTimer);
  return new Promise((resolve) => { pendingResolvers.push(resolve); settingsTimer = setTimeout(async () => { const nextPatch = pendingSettings; const resolvers = pendingResolvers; pendingSettings = {}; pendingResolvers = []; settingsTimer = null; const state = await readStorage(); await chrome.storage.local.set({ settings: { ...state.settings, ...nextPatch } }); resolvers.forEach((done) => done()); }, 200); });
}
export function mergeQueuesForMigration(target: QueueItem[], source: QueueItem[]): QueueItem[] { const seen = new Set(target.map((item) => item.id)); return [...target, ...source.filter((item) => !seen.has(item.id))]; }
export async function migrateQueue(providerId: ProviderId, from: string, to: string): Promise<void> {
  if (from === to) return; const state = await readStorage(); const providerQueues = state.queuesByProvider[providerId] ?? {}; const source = providerQueues[from] ?? []; if (!source.length) return;
  const queues = { ...providerQueues, [to]: mergeQueuesForMigration(providerQueues[to] ?? [], source) }; delete queues[from];
  const providerPaused = { ...(state.pausedByProvider[providerId] ?? {}) }; providerPaused[to] = Boolean(providerPaused[to] || providerPaused[from]); delete providerPaused[from];
  await chrome.storage.local.set({ queuesByProvider: { ...state.queuesByProvider, [providerId]: queues }, pausedByProvider: { ...state.pausedByProvider, [providerId]: providerPaused } });
}
