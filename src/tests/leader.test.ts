import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LeaderElection } from '../content/leader';

describe('leader election storage behavior', () => {
  let values: Record<string, unknown>;
  let writes: number;

  beforeEach(() => {
    values = {};
    writes = 0;
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: values[key] })),
          set: vi.fn(async (patch: Record<string, unknown>) => {
            writes++;
            Object.assign(values, patch);
          }),
        },
      },
    });
  });

  it('does not write storage during scheduler leadership checks', async () => {
    const leader = new LeaderElection(() => 'conversation:test');
    expect(await leader.heartbeat()).toBe(true);
    expect(writes).toBe(1);

    expect(await leader.isLeader()).toBe(true);
    expect(await leader.isLeader()).toBe(true);
    expect(writes).toBe(1);
  });

  it('does not overwrite a live leader from another tab', async () => {
    values['leader:conversation:test'] = { token: 'another-tab', at: Date.now() };
    const leader = new LeaderElection(() => 'conversation:test');

    expect(await leader.isLeader()).toBe(false);
    expect(writes).toBe(0);
  });
});
