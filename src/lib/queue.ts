import { createId } from './id';
import { hasPromptContent, normalizePromptText } from './text';
import type { QueueItem, QueueItemSource, QueueItemStatus } from './types';

export function makeItem(text: string, source: QueueItemSource = 'manual'): QueueItem {
  const now = Date.now();
  return { id: createId(), text: normalizePromptText(text), source, status: 'queued', createdAt: now, updatedAt: now };
}

export function appendPrompts(items: QueueItem[], prompts: string[], source: QueueItemSource = 'import'): QueueItem[] {
  return [...items, ...prompts.filter(hasPromptContent).map((text) => makeItem(text, source))];
}

export function duplicateItem(items: QueueItem[], id: string): QueueItem[] {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return items;
  const copy = makeItem(items[index].text, 'duplicate');
  return [...items.slice(0, index + 1), copy, ...items.slice(index + 1)];
}

export const deleteItem = (items: QueueItem[], id: string): QueueItem[] => items.filter((item) => item.id !== id);
export const clearItems = (): QueueItem[] => [];

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
  if (!hasPromptContent(text)) return items;
  const normalized = normalizePromptText(text);
  return items.map((item) => item.id === id ? { ...item, text: normalized, source: 'edit', status: 'queued', updatedAt: Date.now() } : item);
}

export function setItemStatus(items: QueueItem[], id: string, status: QueueItemStatus): QueueItem[] {
  return items.map((item) => item.id === id ? { ...item, status, updatedAt: Date.now() } : item);
}
