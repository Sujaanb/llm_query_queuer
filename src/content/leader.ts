const HEARTBEAT_MS = 2000;
const EXPIRE_MS = 6000;

export class LeaderElection {
  readonly tabToken = crypto.randomUUID();
  private timer?: number;
  constructor(private key: () => string) {}
  start() { this.timer = window.setInterval(() => void this.heartbeat(), HEARTBEAT_MS); void this.heartbeat(); }
  stop() { if (this.timer) clearInterval(this.timer); }
  private storageKey() { return `leader:${this.key()}`; }
  async heartbeat(): Promise<boolean> {
    const name = this.storageKey();
    const stored = (await chrome.storage.local.get(name))[name] as { token: string; at: number } | undefined;
    const now = Date.now();
    if (!stored || stored.token === this.tabToken || now - stored.at > EXPIRE_MS) {
      await chrome.storage.local.set({ [name]: { token: this.tabToken, at: now } });
      return true;
    }
    return false;
  }
  isLeader() { return this.heartbeat(); }
}
