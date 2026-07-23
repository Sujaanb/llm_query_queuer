import { LEADER_HEARTBEAT_MS } from '../lib/constants';
import { queueScope } from '../lib/providers';
import type { ProviderId } from '../lib/types';
import type { DebugLog } from './debug';

interface LeaderResponse { leader: boolean; lock?: { tabId: number; instanceId: string } }

export class LeaderElection {
  readonly instanceId = crypto.randomUUID();
  private timer: number | null = null;
  private leader = false;
  private stopped = true;
  private readonly visibilityHandler = () => { void this.heartbeat(); };
  private readonly focusHandler = () => { void this.heartbeat(); };

  constructor(private providerId: ProviderId, private key: () => string, private debug: DebugLog) {}

  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.timer = window.setInterval(() => void this.heartbeat(), LEADER_HEARTBEAT_MS);
    document.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('focus', this.focusHandler);
    window.addEventListener('blur', this.focusHandler);
    void this.heartbeat();
  }

  private request(type: 'LEADER_HEARTBEAT' | 'LEADER_CHECK'): Promise<LeaderResponse> {
    return chrome.runtime.sendMessage({
      type,
      scope: queueScope(this.providerId, this.key()),
      providerId: this.providerId,
      conversationKey: this.key(),
      instanceId: this.instanceId,
      visible: !document.hidden,
      focused: document.hasFocus(),
    }) as Promise<LeaderResponse>;
  }

  async heartbeat(): Promise<boolean> {
    if (this.stopped) return false;
    try {
      const response = await this.request('LEADER_HEARTBEAT');
      if (response.leader !== this.leader) this.debug.add('leader-status', { scope: queueScope(this.providerId, this.key()), leader: response.leader, lockTabId: response.lock?.tabId });
      this.leader = response.leader;
      return this.leader;
    } catch { this.leader = false; return false; }
  }

  async isLeader(): Promise<boolean> {
    if (this.stopped) return false;
    try {
      const response = await this.request('LEADER_CHECK');
      this.leader = response.leader;
      return this.leader;
    } catch { return false; }
  }

  get current(): boolean { return this.leader; }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    window.removeEventListener('focus', this.focusHandler);
    window.removeEventListener('blur', this.focusHandler);
    void chrome.runtime.sendMessage({ type: 'LEADER_RELEASE', scope: queueScope(this.providerId, this.key()), instanceId: this.instanceId }).catch(() => undefined);
    this.leader = false;
  }
}
