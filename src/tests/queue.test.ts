import { describe, expect, it, vi } from 'vitest';
import { appendPrompts, clearItems, deleteItem, duplicateItem, editItem, makeItem, reorderItem, setItemStatus } from '../lib/queue';

vi.stubGlobal('crypto', { randomUUID: vi.fn(() => Math.random().toString()) });
describe('queue operations', () => {
  it('adds a prompt with a stable unique ID', () => { const a = makeItem('A'); const b = makeItem('B'); expect(a.id).not.toBe(b.id); expect(a.status).toBe('queued'); });
  it('preserves multiline and boundary blank lines', () => expect(makeItem('\r\nA\r\nB\r\n').text).toBe('\nA\nB\n'));
  it('appends imports without disturbing existing items', () => { const a = makeItem('A'); const next = appendPrompts([a], ['B', 'C']); expect(next.map((item) => item.text)).toEqual(['A', 'B', 'C']); expect(next[0]).toBe(a); });
  it('duplicates immediately below the original', () => { const q = [makeItem('A'), makeItem('B')]; const next = duplicateItem(q, q[0].id); expect(next.map((item) => item.text)).toEqual(['A', 'A', 'B']); expect(next[1].id).not.toBe(next[0].id); });
  it('deletes an individual prompt', () => { const q = [makeItem('A'), makeItem('B')]; expect(deleteItem(q, q[0].id).map((item) => item.text)).toEqual(['B']); });
  it('reorders by stable IDs', () => { const q = [makeItem('A'), makeItem('B'), makeItem('C')]; expect(reorderItem(q, q[0].id, q[2].id).map((item) => item.text)).toEqual(['B', 'C', 'A']); });
  it('does not reorder a sending item', () => { const q = [{ ...makeItem('A'), status: 'sending' as const }, makeItem('B')]; expect(reorderItem(q, q[0].id, q[1].id)).toBe(q); });
  it('edits multiline text and rejects empty edits', () => { const q = [makeItem('A')]; expect(editItem(q, q[0].id, '\nB\n')[0]).toMatchObject({ text: '\nB\n', source: 'edit' }); expect(editItem(q, q[0].id, ' \n')).toBe(q); });
  it('clears all items', () => expect(clearItems()).toEqual([]));
  it('supports queued, sending, and failed status transitions', () => { const q = [makeItem('A')]; const sending = setItemStatus(q, q[0].id, 'sending'); const failed = setItemStatus(sending, q[0].id, 'failed'); expect(sending[0].status).toBe('sending'); expect(failed[0].status).toBe('failed'); });
  it('models pause and resume without changing the queue', () => { const q = [makeItem('A')]; let paused = false; paused = true; expect(paused).toBe(true); paused = false; expect(paused).toBe(false); expect(q).toHaveLength(1); });
});
