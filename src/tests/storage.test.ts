import { beforeEach, describe, expect, it, vi } from 'vitest';
import { migrationLockAvailable } from '../lib/migration'; import { mergeQueuesForMigration, migrateStorageSnapshot } from '../lib/storage'; import type { QueueItem } from '../lib/types';
beforeEach(() => vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'generated-id') }));
const item = (id: string, text = id): QueueItem => ({ id, text, source: 'manual', status: 'queued', createdAt: 1, updatedAt: 1 });
const ids = ['chatgpt', 'claude', 'qwen', 'mistral', 'huggingchat', 'grok', 'kimi', 'perplexity', 'zai', 'sakana', 'longcat'];
const emptyMaps = () => Object.fromEntries(ids.map((id) => [id, {}]));
describe('storage migration', () => {
  it('migrates schema v1 queues into ChatGPT provider scope', () => { const result = migrateStorageSnapshot({ schemaVersion: 1, settings: { sendDelayMs: 9000 }, queuesByConversation: { 'conversation:abc': [item('one', 'A\r\nB')] }, pausedByConversation: { 'conversation:abc': true } }, 100); expect(result.state.schemaVersion).toBe(4); expect(result.state.settings.sendDelayMs).toBe(9000); expect(result.state.queuesByProvider.chatgpt['conversation:abc'][0].text).toBe('A\nB'); expect(result.state.pausedByProvider.chatgpt['conversation:abc']).toBe(true); });
  it('migrates Phase 1 schema v2 without losing ChatGPT queues', () => { const result = migrateStorageSnapshot({ schemaVersion: 2, settings: {}, queuesByProvider: { chatgpt: { c: [item('one')] } }, pausedByProvider: { chatgpt: { c: false } } }); expect(result.changed).toBe(true); expect(result.state.queuesByProvider.chatgpt.c[0].id).toBe('one'); expect(Object.values(result.state.providerEnablement).every((value) => value === false)).toBe(true); });
  it('migrates schema v3 while preserving Phase 2 queues, pauses, and enablement', () => {
    const queues = { chatgpt: {}, claude: { c: [item('one')] }, qwen: {}, mistral: {}, huggingchat: {} }; const pauses = { chatgpt: {}, claude: { c: true }, qwen: {}, mistral: {}, huggingchat: {} };
    const result = migrateStorageSnapshot({ schemaVersion: 3, settings: {}, providerEnablement: { claude: true, qwen: false, mistral: true, huggingchat: false }, queuesByProvider: queues, pausedByProvider: pauses });
    expect(result.changed).toBe(true); expect(result.state.schemaVersion).toBe(4); expect(result.state.queuesByProvider.claude.c[0].id).toBe('one'); expect(result.state.pausedByProvider.claude.c).toBe(true);
    expect(result.state.providerEnablement).toMatchObject({ claude: true, mistral: true, grok: false, kimi: false, perplexity: false, zai: false, sakana: false, longcat: false });
  });
  it('accepts a complete schema v4 snapshot without migration', () => { const queues = emptyMaps(); queues.grok = { c: [item('g')] }; const result = migrateStorageSnapshot({ schemaVersion: 4, settings: {}, providerEnablement: { grok: true }, queuesByProvider: queues, pausedByProvider: emptyMaps() }); expect(result.changed).toBe(false); expect(result.state.queuesByProvider.grok.c[0].id).toBe('g'); });
  it('backs up future and corrupted current schemas', () => { expect(migrateStorageSnapshot({ schemaVersion: 99 }).backup).toBeTruthy(); const corrupted = migrateStorageSnapshot({ schemaVersion: 4, queuesByProvider: { chatgpt: 'bad' }, pausedByProvider: {} }); expect(corrupted.changed).toBe(true); expect(corrupted.backup).toBeTruthy(); const corruptedV3 = migrateStorageSnapshot({ schemaVersion: 3, queuesByProvider: { chatgpt: 'bad' }, pausedByProvider: {} }); expect(corruptedV3.backup).toBeTruthy(); });
});
describe('temporary queue migration', () => {
  it('merges temporary items into the real conversation without duplicates', () => expect(mergeQueuesForMigration([item('one')], [item('one'), item('two')]).map((entry) => entry.id)).toEqual(['one', 'two']));
  it('does not mutate an unrelated conversation array', () => { const unrelated = [item('other')]; mergeQueuesForMigration([item('one')], [item('two')]); expect(unrelated.map((entry) => entry.id)).toEqual(['other']); });
  it('prevents a concurrent owner from taking a live migration lock', () => { const lock = { owner: 'first', acquiredAt: 1000 }; expect(migrationLockAvailable(lock, 'second', 2000)).toBe(false); expect(migrationLockAvailable(lock, 'first', 2000)).toBe(true); expect(migrationLockAvailable(lock, 'second', 12000)).toBe(true); });
});
