import type { Settings, StorageState } from './types';

export const SCHEMA_VERSION = 2 as const;

export const DEFAULT_SETTINGS: Settings = {
  sendDelayMs: 3000,
  stabilityMs: 2000,
  fallbackReadyTimeoutMs: 15000,
  alwaysQueue: false,
  showToasts: true,
  pauseOnStop: true,
  pauseOnError: true,
  debugMode: false,
};

export const DEFAULT_STORAGE: StorageState = {
  schemaVersion: SCHEMA_VERSION,
  settings: DEFAULT_SETTINGS,
  queuesByProvider: { chatgpt: {} },
  pausedByProvider: { chatgpt: {} },
};

export const LEADER_HEARTBEAT_MS = 2000;
export const LEADER_STALE_MS = 6000;
