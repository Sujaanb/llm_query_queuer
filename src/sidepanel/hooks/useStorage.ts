import { useCallback, useEffect, useState } from 'react';
import { readStorage } from '../../lib/storage';
import type { StorageState } from '../../lib/types';

export function useStorageState() {
  const [state, setState] = useState<StorageState | null>(null);
  const refresh = useCallback(() => void readStorage().then(setState), []);
  useEffect(() => {
    refresh();
    const listener = () => refresh();
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [refresh]);
  return { state, refresh };
}
