import { createId } from './id';
import { normalizePromptText } from './text';
import type { QueueItem, QueueItemSource } from './types';

export function makeItem(text: string, source: QueueItemSource = 'manual'): QueueItem {
  const now = Date.now();
  return { id: createId(), text: normalizePromptText(text).trim(), source, status: 'queued', createdAt: now, updatedAt: now };
}

export const appendPrompts = (items: QueueItem[], prompts: string[], source: QueueItemSource = 'import') =>
  [...items, ...prompts.map((text) => makeItem(text, source))];

export function duplicateItem(items: QueueItem[], id: string): QueueItem[] {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return items;
  const copy = makeItem(items[index].text, 'duplicate');
  return [...items.slice(0, index + 1), copy, ...items.slice(index + 1)];
}

export const deleteItem = (items: QueueItem[], id: string) => items.filter((item) => item.id !== id);

export function reorderItem(items: QueueItem[], activeId: string, overId: string): QueueItem[] {
  const from = items.findIndex((item) => item.id === activeId);
  const to = items.findIndex((item) => item.id === overId);
  if (from < 0 || to < 0 || from === to || items[from].status === 'sending' || items[to].status === 'sending') return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function editItem(items: QueueItem[], id: string, text: string): QueueItem[] {
  const value = text.trim();
  if (!value) return items;
  return items.map((item) => item.id === id ? { ...item, text: value, source: 'edit', updatedAt: Date.now() } : item);
}
