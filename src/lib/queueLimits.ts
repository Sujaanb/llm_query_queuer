import { QUEUE_HARD_LIMIT, QUEUE_WARNING_THRESHOLD } from './constants';
export interface QueueCapacity { total: number; warning: boolean; requiresConfirmation: boolean; allowed: boolean }
export function assessQueueCapacity(currentCount: number, incomingCount: number, confirmed = false): QueueCapacity {
  const total = Math.max(0, currentCount) + Math.max(0, incomingCount);
  const requiresConfirmation = total > QUEUE_HARD_LIMIT && !confirmed;
  return { total, warning: total > QUEUE_WARNING_THRESHOLD, requiresConfirmation, allowed: !requiresConfirmation };
}
