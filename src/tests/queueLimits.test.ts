import { describe, expect, it } from 'vitest'; import { assessQueueCapacity } from '../lib/queueLimits';
describe('queue capacity safeguards', () => {
  it('does not warn at 500 items', () => expect(assessQueueCapacity(499,1)).toMatchObject({ warning:false,allowed:true }));
  it('warns above 500 items', () => expect(assessQueueCapacity(500,1)).toMatchObject({ warning:true,allowed:true }));
  it('requires confirmation above 1000', () => expect(assessQueueCapacity(999,2)).toMatchObject({ requiresConfirmation:true,allowed:false }));
  it('allows an explicitly confirmed large import', () => expect(assessQueueCapacity(999,2,true)).toMatchObject({ requiresConfirmation:false,allowed:true,warning:true }));
});
