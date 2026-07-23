import { useCallback, useEffect, useState } from 'react';
import { CHATGPT_URL } from '../lib/constants';
import { appendPrompts, deleteItem, duplicateItem, editItem, reorderItem } from '../lib/queue';
import { setPaused, updateQueue, updateSettings } from '../lib/storage';
import type { QueueItem, TabStatus } from '../lib/types';
import { shortcutLabels } from '../lib/platform';
import { ConfirmDialog } from './components/ConfirmDialog';
import { EditPromptDialog } from './components/EditPromptDialog';
import { ImportPanel } from './components/ImportPanel';
import { QueueList } from './components/QueueList';
import { SettingsPanel } from './components/SettingsPanel';
import { StatusPill } from './components/StatusPill';
import { useStorageState } from './hooks/useStorage';

function sameStatus(left: TabStatus, right: TabStatus): boolean {
  return left.supported === right.supported
    && left.conversationKey === right.conversationKey
    && left.chatState === right.chatState
    && left.schedulerState === right.schedulerState;
}

export default function App() {
  const { state } = useStorageState();
  const [status, setStatus] = useState<TabStatus>({ supported: false });
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [editing, setEditing] = useState<QueueItem | null>(null);
  const shortcuts = shortcutLabels();

  const refreshStatus = useCallback(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !CHATGPT_URL.test(tab.url ?? '')) {
      setConnectionFailed(false);
      setStatus((current) => current.supported ? { supported: false } : current);
      return;
    }
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATUS' }) as TabStatus;
      setConnectionFailed(false);
      setStatus((current) => sameStatus(current, response) ? current : response);
    } catch {
      setConnectionFailed(true);
      const fallback: TabStatus = { supported: true, chatState: 'unknown', schedulerState: 'idle' };
      setStatus((current) => sameStatus(current, fallback) ? current : fallback);
    }
  }, []);
  useEffect(() => { void refreshStatus(); const timer = setInterval(refreshStatus, 2000); return () => clearInterval(timer); }, [refreshStatus]);

  if (!state) return <div className="grid min-h-screen place-items-center text-xs text-zinc-500">Loading queue…</div>;
  if (!status.supported || !status.conversationKey) return <main className="grid min-h-screen place-items-center p-8 text-center"><div><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-zinc-200 text-xl dark:bg-zinc-800">&#8599;</div><h1 className="text-sm font-semibold">{connectionFailed ? 'Reconnect the ChatGPT tab.' : 'Open ChatGPT to use the queue.'}</h1><p className="mt-2 text-xs text-zinc-500">{connectionFailed ? 'Reload this extension, then reload the ChatGPT page.' : 'Switch to a ChatGPT tab, then reopen this panel.'}</p></div></main>;

  const key = status.conversationKey;
  const items = state.queuesByConversation[key] ?? [];
  const paused = Boolean(state.pausedByConversation[key]);
  const mutate = (fn: (items: QueueItem[]) => QueueItem[]) => void updateQueue(key, fn);
  const chatTone = status.chatState === 'error' ? 'bad' : ['idle', 'ready'].includes(status.chatState ?? '') ? 'good' : 'warn';

  return <main className="min-h-screen p-3">
    <header className="sticky top-0 z-20 -mx-3 -mt-3 mb-3 border-b border-zinc-200 bg-zinc-50/90 px-3 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="flex items-center justify-between"><div><h1 className="text-base font-semibold tracking-tight">ChatGPT Queue</h1><div className="mt-1 flex gap-1.5"><StatusPill label={status.chatState ?? 'unknown'} tone={chatTone} /><StatusPill label={paused ? 'paused' : status.schedulerState ?? 'idle'} tone={paused ? 'warn' : 'neutral'} /></div></div><div className="flex gap-1.5"><button className="btn" onClick={() => void setPaused(key, !paused)}>{paused ? 'Resume' : 'Pause'}</button><button className="btn" disabled={!items.length || items.some((i) => i.status === 'sending')} onClick={() => setClearOpen(true)}>Clear all</button></div></div>
    </header>

    <div className="space-y-3">
      <section><div className="mb-2 flex items-center justify-between px-1"><h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Queue</h2><span className="text-xs tabular-nums text-zinc-400">{items.length}</span></div>
        {items.length ? <QueueList items={items} onReorder={(a, b) => mutate((q) => reorderItem(q, a, b))} onEdit={setEditing} onDuplicate={(id) => mutate((q) => duplicateItem(q, id))} onDelete={(id) => mutate((q) => deleteItem(q, id))} /> : <div className="card px-4 py-10 text-center"><p className="text-sm font-medium">No queued prompts</p><p className="mt-2 text-xs text-zinc-500">Force queue with <kbd>{shortcuts.forceQueue}</kbd><br />Force send with <kbd>{shortcuts.forceSend}</kbd></p></div>}
      </section>
      <ImportPanel onImport={(prompts) => mutate((q) => appendPrompts(q, prompts))} />
      <SettingsPanel settings={state.settings} onChange={(patch) => void updateSettings(patch)} />
      <p className="px-2 pb-3 text-center text-[10px] text-zinc-400">Open panel: {shortcuts.open} · Prompts stay in local Chrome storage</p>
    </div>
    <ConfirmDialog open={clearOpen} onCancel={() => setClearOpen(false)} onConfirm={() => { mutate(() => []); setClearOpen(false); }} />
    <EditPromptDialog text={editing?.text ?? null} onCancel={() => setEditing(null)} onSave={(text) => { if (editing) mutate((q) => editItem(q, editing.id, text)); setEditing(null); }} />
  </main>;
}
