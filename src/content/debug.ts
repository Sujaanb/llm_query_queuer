import type { Settings } from '../lib/types';

const MAX_LOGS = 200;

export class DebugLog {
  private entries: Array<{ at: number; event: string; data?: Record<string, unknown> }> = [];
  constructor(private settings: () => Settings) {}

  add(event: string, data?: Record<string, unknown>): void {
    if (!this.settings().debugMode) return;
    const entry = { at: Date.now(), event, ...(data ? { data } : {}) };
    this.entries.push(entry);
    if (this.entries.length > MAX_LOGS) this.entries.splice(0, this.entries.length - MAX_LOGS);
    console.debug('[LM Query Queuer]', entry);
  }

  clear(): void { this.entries.length = 0; }
}
