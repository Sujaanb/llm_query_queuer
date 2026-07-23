export type ProviderId = 'chatgpt' | 'claude' | 'qwen' | 'mistral' | 'huggingchat' | 'grok' | 'kimi' | 'perplexity' | 'zai' | 'sakana' | 'longcat' | 'gemini' | 'metaai' | 'minimax' | 'aristotle';
export type OptionalProviderId = Exclude<ProviderId, 'chatgpt'>;
export type ChatState = 'idle' | 'thinking' | 'searching' | 'browsing' | 'analyzing' | 'reasoning' | 'streaming' | 'ready' | 'error' | 'unknown';
export type SchedulerState = 'idle' | 'waitingAfterSend' | 'busy' | 'ready' | 'sending' | 'paused' | 'error';
export type QueueItemStatus = 'queued' | 'sending' | 'failed';
export type QueueItemSource = 'enter' | 'import' | 'manual' | 'duplicate' | 'edit';
export type ProviderStatus = 'stable' | 'beta' | 'experimental' | 'planned';
export type SelectorOverrideKey = 'composer' | 'send' | 'stop' | 'regenerate' | 'assistant' | 'status' | 'errors' | 'citations' | 'thinking' | 'tools' | 'terminal' | 'auxiliary';
export type SelectorOverrides = Partial<Record<SelectorOverrideKey, string[]>>;

export interface QueueItem { id: string; text: string; source: QueueItemSource; status: QueueItemStatus; createdAt: number; updatedAt: number }
export interface Settings { sendDelayMs: number; stabilityMs: number; fallbackReadyTimeoutMs: number; alwaysQueue: boolean; showToasts: boolean; pauseOnStop: boolean; pauseOnError: boolean; debugMode: boolean }
export interface StorageState {
  schemaVersion: 5; settings: Settings; providerEnablement: Record<OptionalProviderId, boolean>;
  queuesByProvider: Record<ProviderId, Record<string, QueueItem[]>>; pausedByProvider: Record<ProviderId, Record<string, boolean>>;
  selectorOverridesByProvider: Partial<Record<ProviderId, SelectorOverrides>>;
}
export interface TabState { tabId: number; url: string; providerId: ProviderId; conversationId: string | null; temporaryConversationKey: string | null; visible: boolean; focused: boolean; lastSeen: number }
export interface LeaderLock { tabId: number; instanceId: string; lastHeartbeat: number; visible: boolean; focused: boolean }
export interface MigrationLock { owner: string; acquiredAt: number }
export interface SessionState { tabStates: Record<string, TabState>; leaderLocks: Record<string, LeaderLock>; migrationLocks: Record<string, MigrationLock> }

export interface ProviderDiagnostics {
  providerId: ProviderId; providerName: string; url: string; conversationId: string | null; temporaryConversationKey: string;
  composerFound: boolean; sendButtonFound: boolean; stopButtonFound: boolean; regenerateButtonFound: boolean;
  citationSourceRegionFound: boolean; thinkingBlockFound: boolean; toolTaskPanelFound: boolean; terminalOutputPanelFound: boolean;
  busyIndicators: string[]; readyIndicators: string[]; errorIndicators: string[]; latestAssistantMessageFound: boolean;
  composerType: 'textarea' | 'contenteditable' | 'unknown'; insertionStrategy: string | null; lastCheckedAt: number;
  experimentalProvider: boolean; selectorOverridesActive: boolean; selectorOverrideKeys: SelectorOverrideKey[]; uncertainReason: string | null;
}
export interface ProviderPermissionState {
  id: string; name: string; phase: number; builtIn: boolean; status: ProviderStatus; enabled: boolean; permissionGranted: boolean;
  experimental: boolean; accessDependent: boolean;
}
export interface TabStatus {
  supported: boolean; planned?: boolean; disabled?: boolean; providerId?: ProviderId; providerName?: string; conversationId?: string | null;
  conversationKey?: string; chatState?: ChatState; schedulerState?: SchedulerState; isLeader?: boolean; diagnostics?: ProviderDiagnostics;
  experimental?: boolean; accessDependent?: boolean;
}
