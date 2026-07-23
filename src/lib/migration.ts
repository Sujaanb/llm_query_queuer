import { MIGRATION_LOCK_STALE_MS } from './constants';
import type { MigrationLock } from './types';
export function migrationLockAvailable(lock: MigrationLock | undefined, owner: string, now = Date.now()): boolean { return !lock || lock.owner === owner || now - lock.acquiredAt > MIGRATION_LOCK_STALE_MS; }

export function validQueueMigration(providerId: string, from: string, to: string, owner: string): boolean { return Boolean(providerId && owner && from.startsWith('temp:' + providerId + ':') && /^conversation:[^:]+$/.test(to)); }
