import { useCallback, useEffect, useState } from 'react';
import { readStorage } from '../../lib/storage';
import type { StorageState } from '../../lib/types';

export function useStorageState() {
  const [state, setState] = useState<StorageState | null>(null);
  const refresh = useCallback(() => void readStorage().then(setState), []);
  useEffect(() => {
    refresh();
    const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName === 'local' && (changes.schemaVersion || changes.settings || changes.providerEnablement || changes.queuesByProvider || changes.pausedByProvider || changes.selectorOverridesByProvider)) refresh();
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [refresh]);
  return { state, refresh };
}