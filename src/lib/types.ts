export type ChatState = 'idle' | 'thinking' | 'searching' | 'browsing' | 'analyzing' | 'reasoning' | 'streaming' | 'ready' | 'error' | 'unknown';
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
}

export interface StorageState {
  schemaVersion: 1;
  settings: Settings;
  queuesByConversation: Record<string, QueueItem[]>;
  pausedByConversation: Record<string, boolean>;
}

export interface TabStatus {
  supported: boolean;
  conversationKey?: string;
  chatState?: ChatState;
  schedulerState?: string;
}
