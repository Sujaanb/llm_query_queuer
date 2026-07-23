import { readStorage, setPaused, updateQueue } from '../lib/storage';
import { setItemStatus } from '../lib/queue';
import type { ProviderId, SchedulerState, Settings } from '../lib/types';
import type { DebugLog } from './debug';
import type { LeaderElection } from './leader';
import type { ProviderAdapter } from './providers/types';
import type { Toasts } from './toasts';

export class Scheduler {
  state: SchedulerState = 'idle';
  private running = false;
  private disposed = false;
  private sawBusy = false;
  private readySince = 0;
  private timer: number | null = null;
  private autoSubmitTimer: number | null = null;
  private autoSubmitting = false;
  private removeProviderObserver: (() => void) | null = null;
  private unavailableSince = 0;
  private readonly storageListener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && (changes.queuesByProvider || changes.pausedByProvider || changes.settings)) void this.tick();
  };
  private readonly visibilityListener = () => { void this.tick(); };

  constructor(
    private providerId: ProviderId,
    private key: () => string,
    private settings: () => Settings,
    private provider: ProviderAdapter,
    private leader: LeaderElection,
    private toasts: Toasts,
    private debug: DebugLog,
  ) {}

  start(): void {
    this.removeProviderObserver = this.provider.observe(() => {
      if (this.state === 'waitingAfterSend' && this.provider.isBusy()) this.sawBusy = true;
      if (this.sawBusy && this.provider.isReadyForNextMessage() && !this.readySince) this.readySince = Date.now();
      if (this.provider.hasError()) void this.pauseForError();
      void this.tick();
    });
    this.timer = window.setInterval(() => void this.tick(), 1000);
    chrome.storage.onChanged.addListener(this.storageListener);
    document.addEventListener('visibilitychange', this.visibilityListener);
    void this.tick();
  }

  private transition(state: SchedulerState): void {
    if (state === this.state) return;
    this.debug.add('scheduler-transition', { from: this.state, to: state, provider: this.providerId, conversationKey: this.key() });
    this.state = state;
  }

  isAutoSubmitting(): boolean { return this.autoSubmitting; }

  async pause(message?: string): Promise<void> {
    await setPaused(this.providerId, this.key(), true);
    this.transition('paused');
    if (message) this.toasts.show(message, 'warning');
  }

  private async pauseForError(): Promise<void> {
    if (this.settings().pauseOnError) await this.pause(`${this.provider.name} reported an error. Queue paused.`);
  }

  private async fail(id: string, message: string): Promise<void> {
    await updateQueue(this.providerId, this.key(), (items) => setItemStatus(items, id, 'failed'));
    await setPaused(this.providerId, this.key(), true);
    this.transition('error');
    this.debug.add('send-failure', { itemId: id, reason: message });
    this.toasts.show(`${message} Queue paused.`, 'error');
  }

  async tick(): Promise<void> {
    if (this.running || this.disposed || document.hidden) return;
    this.running = true;
    try {
      const key = this.key();
      const storage = await readStorage();
      const queue = storage.queuesByProvider[this.providerId]?.[key] ?? [];
      if (storage.pausedByProvider[this.providerId]?.[key]) { this.transition('paused'); return; }
      if (!queue.length) { this.transition('idle'); this.sawBusy = false; this.readySince = 0; return; }
      if (!(await this.leader.isLeader())) return;
      if (this.provider.hasError()) { await this.pauseForError(); return; }
      if (this.provider.isBusy() || !this.provider.isReadyForNextMessage()) { this.transition('busy'); return; }

      if (this.state === 'waitingAfterSend' || this.sawBusy) {
        if (!this.sawBusy) return;
        if (!this.readySince) this.readySince = Date.now();
        if (Date.now() - this.readySince < storage.settings.sendDelayMs) { this.transition('ready'); return; }
      }

      const item = queue[0];
      if (!this.provider.getComposer() || !this.provider.canSend()) {
        if (!this.unavailableSince) this.unavailableSince = Date.now();
        if (Date.now() - this.unavailableSince >= storage.settings.fallbackReadyTimeoutMs) await this.fail(item.id, `${this.provider.name} composer or send control was not available.`);
        return;
      }
      this.unavailableSince = 0;
      this.transition('sending');
      await updateQueue(this.providerId, key, (items) => setItemStatus(items, item.id, 'sending'));
      this.debug.add('send-attempt', { itemId: item.id, length: item.text.length, lines: item.text.split('\n').length });
      const insertion = await this.provider.setComposerText(item.text);
      if (!insertion.ok || !this.provider.verifyComposerText(item.text)) {
        await this.provider.clearComposer();
        await this.fail(item.id, 'Could not safely insert and verify the queued prompt.');
        return;
      }
      if (!(await this.leader.isLeader()) || this.disposed) {
        await this.provider.clearComposer();
        await updateQueue(this.providerId, key, (items) => setItemStatus(items, item.id, 'queued'));
        return;
      }
      this.autoSubmitting = true;
      const accepted = await this.provider.clickSend();
      if (this.autoSubmitTimer !== null) clearTimeout(this.autoSubmitTimer);
      this.autoSubmitTimer = window.setTimeout(() => { this.autoSubmitting = false; this.autoSubmitTimer = null; }, 500);
      if (!accepted) {
        this.autoSubmitting = false;
        await this.provider.clearComposer();
        await this.fail(item.id, 'The queued prompt was not accepted.');
        return;
      }
      await updateQueue(this.providerId, key, (items) => items.filter((entry) => entry.id !== item.id));
      this.debug.add('send-success', { itemId: item.id, insertionStrategy: insertion.strategy });
      this.transition('waitingAfterSend');
      this.sawBusy = false;
      this.readySince = 0;
    } finally { this.running = false; }
  }

  dispose(): void {
    this.disposed = true;
    this.removeProviderObserver?.();
    this.removeProviderObserver = null;
    if (this.timer !== null) clearInterval(this.timer);
    if (this.autoSubmitTimer !== null) clearTimeout(this.autoSubmitTimer);
    this.timer = null;
    this.autoSubmitTimer = null;
    chrome.storage.onChanged.removeListener(this.storageListener);
    document.removeEventListener('visibilitychange', this.visibilityListener);
  }
}