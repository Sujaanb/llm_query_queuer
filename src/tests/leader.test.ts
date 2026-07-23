import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LeaderElection } from '../content/leader';

const debug = { add: vi.fn() } as never;
describe('leader election messaging', () => {
  const sendMessage = vi.fn();
  beforeEach(() => {
    sendMessage.mockReset();
    vi.stubGlobal('document', { hidden: false, hasFocus: () => true });
    vi.stubGlobal('chrome', { runtime: { sendMessage } });
  });
  it('checks leadership without local-storage writes', async () => {
    sendMessage.mockResolvedValue({ leader: true, lock: { tabId: 1 } });
    const leader = new LeaderElection('chatgpt', () => 'conversation:test', debug);
    (leader as unknown as { stopped: boolean }).stopped = false;
    expect(await leader.isLeader()).toBe(true);
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'LEADER_CHECK', scope: 'chatgpt:conversation:test' }));
  });
  it('honors a non-leader response', async () => {
    sendMessage.mockResolvedValue({ leader: false, lock: { tabId: 2 } });
    const leader = new LeaderElection('chatgpt', () => 'conversation:test', debug);
    (leader as unknown as { stopped: boolean }).stopped = false;
    expect(await leader.isLeader()).toBe(false);
  });
});
