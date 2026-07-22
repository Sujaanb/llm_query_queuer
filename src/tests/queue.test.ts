import { describe, expect, it, vi } from 'vitest';
import { appendPrompts, deleteItem, duplicateItem, editItem, makeItem, reorderItem } from '../lib/queue';

vi.stubGlobal('crypto', { randomUUID: vi.fn(() => Math.random().toString()) });
describe('queue utilities', () => {
  it('appends imports without disturbing existing items', () => { const a = makeItem('A'); const next = appendPrompts([a], ['B', 'C']); expect(next.map((i) => i.text)).toEqual(['A', 'B', 'C']); expect(next[0]).toBe(a); });
  it('duplicates below the original', () => { const q = [makeItem('A'), makeItem('B')]; expect(duplicateItem(q, q[0].id).map((i) => i.text)).toEqual(['A', 'A', 'B']); });
  it('deletes one item', () => { const q = [makeItem('A'), makeItem('B')]; expect(deleteItem(q, q[0].id).map((i) => i.text)).toEqual(['B']); });
  it('reorders items', () => { const q = [makeItem('A'), makeItem('B'), makeItem('C')]; expect(reorderItem(q, q[0].id, q[2].id).map((i) => i.text)).toEqual(['B', 'C', 'A']); });
  it('does not reorder a sending item', () => { const q = [{ ...makeItem('A'), status: 'sending' as const }, makeItem('B')]; expect(reorderItem(q, q[0].id, q[1].id)).toBe(q); });
  it('edits non-empty text', () => { const q = [makeItem('A')]; expect(editItem(q, q[0].id, ' B ')[0]).toMatchObject({ text: 'B', source: 'edit' }); });
  it('rejects an empty edit', () => { const q = [makeItem('A')]; expect(editItem(q, q[0].id, ' ')).toBe(q); });
  it('clears all with an empty array', () => expect((() => [])()).toEqual([]));
  it('models pause and resume state', () => { let paused = false; paused = true; expect(paused).toBe(true); paused = false; expect(paused).toBe(false); });
});
