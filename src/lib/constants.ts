import type { Settings, StorageState } from './types';

export const DEFAULT_SETTINGS: Settings = {
  sendDelayMs: 3000,
  stabilityMs: 2000,
  fallbackReadyTimeoutMs: 15000,
  alwaysQueue: false,
  showToasts: true,
  pauseOnStop: true,
  pauseOnError: true,
};

export const DEFAULT_STORAGE: StorageState = {
  schemaVersion: 1,
  settings: DEFAULT_SETTINGS,
  queuesByConversation: {},
  pausedByConversation: {},
};

export const CHATGPT_URL = /^https:\/\/(chatgpt\.com|chat\.openai\.com)\//i;
