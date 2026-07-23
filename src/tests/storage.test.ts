import { beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateStorageSnapshot } from '../lib/storage';

beforeEach(() => vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'generated-id') }));
describe('storage migration', () => {
  it('migrates schema v1 queues and settings into ChatGPT provider scope', () => {
    const old = { schemaVersion: 1, settings: { sendDelayMs: 9000, alwaysQueue: true }, queuesByConversation: { 'conversation:abc': [{ id: 'one', text: 'A\r\nB', source: 'enter', status: 'queued', createdAt: 1, updatedAt: 2 }] }, pausedByConversation: { 'conversation:abc': true } };
    const result = migrateStorageSnapshot(old, 100);
    expect(result.state.schemaVersion).toBe(2);
    expect(result.state.settings).toMatchObject({ sendDelayMs: 9000, alwaysQueue: true, debugMode: false });
    expect(result.state.queuesByProvider.chatgpt['conversation:abc'][0]).toMatchObject({ id: 'one', text: 'A\nB' });
    expect(result.state.pausedByProvider.chatgpt['conversation:abc']).toBe(true);
  });
  it('preserves valid schema v2 queues', () => {
    const queue = [{ id: 'one', text: 'A', source: 'manual', status: 'failed', createdAt: 1, updatedAt: 2 }];
    const result = migrateStorageSnapshot({ schemaVersion: 2, settings: {}, queuesByProvider: { chatgpt: { c: queue } }, pausedByProvider: { chatgpt: { c: false } } });
    expect(result.changed).toBe(false); expect(result.state.queuesByProvider.chatgpt.c).toEqual(queue);
  });
  it('backs up a future or corrupted schema before resetting', () => {
    expect(migrateStorageSnapshot({ schemaVersion: 99, queuesByProvider: {} }).backup).toBeTruthy();
    const corrupted = migrateStorageSnapshot({ schemaVersion: 2, queuesByProvider: { chatgpt: 'broken' }, pausedByProvider: { chatgpt: {} } });
    expect(corrupted.changed).toBe(true); expect(corrupted.backup).toBeTruthy(); expect(corrupted.state.queuesByProvider.chatgpt).toEqual({});
  });
  it('recovers string items from very old queue storage', () => {
    const result = migrateStorageSnapshot({ queue: ['A', '  ', 'B'] }, 50);
    expect(result.state.queuesByProvider.chatgpt['legacy:default'].map((item) => item.text)).toEqual(['A', 'B']);
  });
});
