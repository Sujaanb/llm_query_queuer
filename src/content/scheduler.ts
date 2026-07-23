import { updateQueue, readStorage, setPaused } from '../lib/storage';
import type { Settings } from '../lib/types';
import { composerEnabled, findComposer } from './chatgpt-dom';
import { clearComposer, submitComposer, writeComposer } from './composer';
import type { LeaderElection } from './leader';
import type { StateDetector } from './state-detector';
import type { Toasts } from './toasts';

export type SchedulerState = 'idle' | 'waitingAfterSend' | 'busy' | 'ready' | 'sending' | 'paused' | 'error';

export class Scheduler {
  state: SchedulerState = 'idle';
  private running = false;
  private sawBusy = false;
  private readySince = 0;
  private timer?: number;
  private autoSubmitting = false;

  constructor(
    private key: () => string,
    private settings: () => Settings,
    private detector: StateDetector,
    private leader: LeaderElection,
    private toasts: Toasts,
  ) {}

  start() {
    this.detector.onChange((state, previous) => {
      if (this.state === 'waitingAfterSend' && !['idle', 'ready', 'unknown'].includes(state)) this.sawBusy = true;
      if ((state === 'ready' || state === 'idle') && this.sawBusy) this.readySince = Date.now();
      if (state === 'error') void this.pauseForError();
      if (previous !== state) void this.tick();
    });
    this.timer = window.setInterval(() => void this.tick(), 1000);
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;
      if (changes.queuesByConversation || changes.pausedByConversation || changes.settings) void this.tick();
    });
    document.addEventListener('visibilitychange', () => void this.tick());
    void this.tick();
  }

  isAutoSubmitting() { return this.autoSubmitting; }

  async pause(message?: string) {
    await setPaused(this.key(), true);
    this.state = 'paused';
    if (message) this.toasts.show(message, 'warning');
  }

  async pauseForError() {
    if (this.settings().pauseOnError) await this.pause('Queue paused because ChatGPT reported an error');
  }

  private async fail(id: string, uiMissing = false) {
    await updateQueue(this.key(), (items) => items.map((item) => item.id === id ? { ...item, status: 'failed', updatedAt: Date.now() } : item));
    await setPaused(this.key(), true);
    this.state = 'error';
    if (uiMissing) {
      console.error('[ChatGPT Queue] Required composer or send control was not found', { url: location.href, detectorState: this.detector.current });
      this.toasts.show('ChatGPT UI changed or required elements were not found. Queue paused.', 'error');
    } else this.toasts.show('Failed to send queued message. Queue paused.', 'error');
  }

  async tick() {
    if (this.running || document.hidden) return;
    this.running = true;
    try {
      const key = this.key();
      const storage = await readStorage();
      const queue = storage.queuesByConversation[key] ?? [];
      if (storage.pausedByConversation[key]) { this.state = 'paused'; return; }
      if (!queue.length) { this.state = 'idle'; this.sawBusy = false; return; }
      if (!(await this.leader.isLeader())) return;
      if (!findComposer()) { await this.fail(queue[0].id, true); return; }
      const chat = this.detector.current;
      if (!['idle', 'ready'].includes(chat)) { this.state = 'busy'; return; }

      if (this.state === 'waitingAfterSend' || this.sawBusy) {
        if (!this.sawBusy) return;
        if (!this.readySince) this.readySince = Date.now();
        if (Date.now() - this.readySince < storage.settings.sendDelayMs) { this.state = 'ready'; return; }
      }

      const item = queue[0];
      if (!findComposer() || !composerEnabled()) { await this.fail(item.id, true); return; }
      this.state = 'sending';
      await updateQueue(key, (items) => items.map((entry) => entry.id === item.id ? { ...entry, status: 'sending', updatedAt: Date.now() } : entry));
      if (!(await writeComposer(item.text))) { clearComposer(); await this.fail(item.id, true); return; }
      this.autoSubmitting = true;
      const sent = await submitComposer();
      setTimeout(() => { this.autoSubmitting = false; }, 500);
      if (!sent) { this.autoSubmitting = false; clearComposer(); await this.fail(item.id); return; }
      await updateQueue(key, (items) => items.filter((entry) => entry.id !== item.id));
      this.state = 'waitingAfterSend';
      this.sawBusy = false;
      this.readySince = 0;
    } finally { this.running = false; }
  }
}
