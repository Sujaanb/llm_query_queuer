import { useCallback, useEffect, useState } from 'react';
import { providerForUrl } from '../lib/providers';
import { appendPrompts, clearItems, deleteItem, duplicateItem, editItem, reorderItem } from '../lib/queue';
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

function sameStatus(a: TabStatus, b: TabStatus): boolean {
  return a.supported === b.supported && a.planned === b.planned && a.providerName === b.providerName && a.conversationKey === b.conversationKey && a.chatState === b.chatState && a.schedulerState === b.schedulerState && a.isLeader === b.isLeader;
}

export default function App() {
  const { state } = useStorageState();
  const [status, setStatus] = useState<TabStatus>({ supported: false });
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [editing, setEditing] = useState<QueueItem | null>(null);
  const shortcuts = shortcutLabels();
  const refreshStatus = useCallback(async (includeHidden = false) => {
    if (document.hidden && !includeHidden) return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const metadata = providerForUrl(tab?.url);
    if (!tab?.id || !metadata) { setConnectionFailed(false); setStatus((old) => sameStatus(old, { supported: false }) ? old : { supported: false }); return; }
    if (!metadata.enabled) { const planned = { supported: false, planned: true, providerName: metadata.name }; setConnectionFailed(false); setStatus((old) => sameStatus(old, planned) ? old : planned); return; }
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATUS' }) as TabStatus;
      setConnectionFailed(false); setStatus((old) => sameStatus(old, response) ? old : response);
    } catch {
      const fallback: TabStatus = { supported: true, providerName: metadata.name, chatState: 'unknown', schedulerState: 'idle' };
      setConnectionFailed(true); setStatus((old) => sameStatus(old, fallback) ? old : fallback);
    }
  }, []);
  useEffect(() => {
    void refreshStatus(true);
    const timer = window.setInterval(() => void refreshStatus(), 2000);
    const activated = () => void refreshStatus(true);
    const updated = (_id: number, change: { url?: string; status?: string }) => { if (change.url || change.status) void refreshStatus(true); };
    const visibility = () => { if (!document.hidden) void refreshStatus(true); };
    chrome.tabs.onActivated.addListener(activated); chrome.tabs.onUpdated.addListener(updated); document.addEventListener('visibilitychange', visibility);
    return () => { clearInterval(timer); chrome.tabs.onActivated.removeListener(activated); chrome.tabs.onUpdated.removeListener(updated); document.removeEventListener('visibilitychange', visibility); };
  }, [refreshStatus]);

  if (!state) return <div className="grid min-h-screen place-items-center text-xs text-zinc-500">Loading queue?</div>;
  if (!status.supported || !status.conversationKey) {
    const heading = status.planned ? 'This provider is planned but not enabled yet.' : connectionFailed ? `Reconnect the ${status.providerName ?? 'AI chat'} tab.` : 'Open a supported AI chat website to use LM Query Queuer.';
    const detail = status.planned ? `${status.providerName} support is intentionally disabled in Phase 1.` : connectionFailed ? 'Reload the extension, then reload the provider page.' : 'Phase 1 supports ChatGPT on chatgpt.com and chat.openai.com.';
    return <main className="grid min-h-screen place-items-center p-8 text-center"><div><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-zinc-200 text-xl dark:bg-zinc-800">?</div><h1 className="text-sm font-semibold">{heading}</h1><p className="mt-2 text-xs text-zinc-500">{detail}</p></div></main>;
  }
  const providerId = status.providerId ?? 'chatgpt';
  const key = status.conversationKey;
  const items = state.queuesByProvider[providerId]?.[key] ?? [];
  const paused = Boolean(state.pausedByProvider[providerId]?.[key]);
  const mutate = (operation: (items: QueueItem[]) => QueueItem[]) => void updateQueue(providerId, key, operation);
  const chatTone = status.chatState === 'error' ? 'bad' : ['idle', 'ready'].includes(status.chatState ?? '') ? 'good' : 'warn';
  return <main className="min-h-screen p-3">
    <header className="sticky top-0 z-20 -mx-3 -mt-3 mb-3 border-b border-zinc-200 bg-zinc-50/90 px-3 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90"><div className="flex items-center justify-between"><div><h1 className="text-base font-semibold tracking-tight">LM Query Queuer</h1><p className="mt-0.5 text-[11px] text-zinc-500">{status.providerName} ? {status.conversationId ? 'Conversation queue' : 'New chat queue'}</p><div className="mt-1 flex gap-1.5"><StatusPill label={status.chatState ?? 'unknown'} tone={chatTone} /><StatusPill label={paused ? 'paused' : status.schedulerState ?? 'idle'} tone={paused ? 'warn' : 'neutral'} /><StatusPill label={status.isLeader ? 'leader' : 'viewer'} tone={status.isLeader ? 'good' : 'neutral'} /></div></div><div className="flex gap-1.5"><button className="btn" onClick={() => void setPaused(providerId, key, !paused)}>{paused ? 'Resume' : 'Pause'}</button><button className="btn" disabled={!items.length || items.some((item) => item.status === 'sending')} onClick={() => setClearOpen(true)}>Clear all</button></div></div></header>
    <div className="space-y-3"><section><div className="mb-2 flex items-center justify-between px-1"><h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Queue</h2><span className="text-xs tabular-nums text-zinc-400">{items.length}</span></div>{items.length ? <QueueList items={items} onReorder={(a, b) => mutate((q) => reorderItem(q, a, b))} onEdit={setEditing} onDuplicate={(id) => mutate((q) => duplicateItem(q, id))} onDelete={(id) => mutate((q) => deleteItem(q, id))} /> : <div className="card px-4 py-10 text-center"><p className="text-sm font-medium">No queued prompts</p><p className="mt-2 text-xs text-zinc-500">Force queue with <kbd>{shortcuts.forceQueue}</kbd><br />Force send with <kbd>{shortcuts.forceSend}</kbd></p></div>}</section><ImportPanel onImport={(prompts) => mutate((q) => appendPrompts(q, prompts))} /><SettingsPanel settings={state.settings} onChange={(patch) => void updateSettings(patch)} /><p className="px-2 pb-3 text-center text-[10px] text-zinc-400">Open panel: {shortcuts.open} ? Queues stay in local Chrome storage</p></div>
    <ConfirmDialog open={clearOpen} onCancel={() => setClearOpen(false)} onConfirm={() => { mutate(clearItems); setClearOpen(false); }} />
    <EditPromptDialog text={editing?.text ?? null} onCancel={() => setEditing(null)} onSave={(text) => { if (editing) mutate((q) => editItem(q, editing.id, text)); setEditing(null); }} />
  </main>;
}
