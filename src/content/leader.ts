const HEARTBEAT_MS = 2000;
const EXPIRE_MS = 6000;

interface LeaderRecord { token: string; at: number }

export class LeaderElection {
  readonly tabToken = crypto.randomUUID();
  private timer?: number;
  constructor(private key: () => string) {}
  start() { this.timer = window.setInterval(() => void this.heartbeat(), HEARTBEAT_MS); void this.heartbeat(); }
  stop() { if (this.timer) clearInterval(this.timer); }
  private storageKey() { return `leader:${this.key()}`; }

  private async checkOrClaim(renew: boolean): Promise<boolean> {
    const name = this.storageKey();
    const stored = (await chrome.storage.local.get(name))[name] as LeaderRecord | undefined;
    const now = Date.now();
    if (stored?.token === this.tabToken) {
      if (renew || now - stored.at >= HEARTBEAT_MS) {
        await chrome.storage.local.set({ [name]: { token: this.tabToken, at: now } });
      }
      return true;
    }
    if (!stored || now - stored.at > EXPIRE_MS) {
      await chrome.storage.local.set({ [name]: { token: this.tabToken, at: now } });
      const confirmed = (await chrome.storage.local.get(name))[name] as Partial<LeaderRecord> | undefined;
      return confirmed?.token === this.tabToken;
    }
    return false;
  }

  heartbeat() { return this.checkOrClaim(true); }
  // Scheduler checks must be read-only for the current leader. Writing here
  // causes storage.onChanged -> scheduler tick -> leader write feedback loops.
  isLeader() { return this.checkOrClaim(false); }
}