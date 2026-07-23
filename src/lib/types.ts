export type ProviderId = 'chatgpt';
export type ChatState =
  | 'idle'
  | 'thinking'
  | 'searching'
  | 'browsing'
  | 'analyzing'
  | 'reasoning'
  | 'streaming'
  | 'ready'
  | 'error'
  | 'unknown';
export type SchedulerState = 'idle' | 'waitingAfterSend' | 'busy' | 'ready' | 'sending' | 'paused' | 'error';
export type QueueItemStatus = 'queued' | 'sending' | 'failed';
export type QueueItemSource = 'enter' | 'import' | 'manual' | 'duplicate' | 'edit';

export interface QueueItem {
  id: string;
  text: string;
  source: QueueItemSource;
  status: QueueItemStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  sendDelayMs: number;
  stabilityMs: number;
  fallbackReadyTimeoutMs: number;
  alwaysQueue: boolean;
  showToasts: boolean;
  pauseOnStop: boolean;
  pauseOnError: boolean;
  debugMode: boolean;
}

export interface StorageState {
  schemaVersion: 2;
  settings: Settings;
  queuesByProvider: Record<ProviderId, Record<string, QueueItem[]>>;
  pausedByProvider: Record<ProviderId, Record<string, boolean>>;
}

export interface TabState {
  tabId: number;
  url: string;
  providerId: ProviderId;
  conversationId: string | null;
  temporaryConversationKey: string | null;
  visible: boolean;
  focused: boolean;
  lastSeen: number;
}

export interface LeaderLock {
  tabId: number;
  instanceId: string;
  lastHeartbeat: number;
  visible: boolean;
  focused: boolean;
}

export interface SessionState {
  tabStates: Record<string, TabState>;
  leaderLocks: Record<string, LeaderLock>;
}

export interface TabStatus {
  supported: boolean;
  planned?: boolean;
  providerId?: ProviderId;
  providerName?: string;
  conversationId?: string | null;
  conversationKey?: string;
  chatState?: ChatState;
  schedulerState?: SchedulerState;
  isLeader?: boolean;
}
