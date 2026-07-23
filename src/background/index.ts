import { LEADER_HEARTBEAT_MS, LEADER_STALE_MS } from '../lib/constants';
import { enabledProviderForUrl } from '../lib/providers';
import { ensureStorageMigrated } from '../lib/storage';
import type { LeaderLock, ProviderId, TabState } from '../lib/types';

const PANEL_PATH = 'src/sidepanel/index.html';
let sessionOperations: Promise<unknown> = Promise.resolve();

function serializeSession<T>(operation: () => Promise<T>): Promise<T> {
  const result = sessionOperations.then(operation, operation);
  sessionOperations = result.then(() => undefined, () => undefined);
  return result;
}

async function configurePanelForTab(tabId: number, url?: string): Promise<void> {
  const enabled = Boolean(enabledProviderForUrl(url));
  try { await chrome.sidePanel.setOptions({ tabId, enabled, ...(enabled ? { path: PANEL_PATH } : {}) }); }
  catch (error) { console.warn('[LM Query Queuer] Could not configure side panel', { tabId, enabled, error }); }
}

async function configureOpenTabs(): Promise<void> {
  await chrome.sidePanel.setOptions({ enabled: false });
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.filter((tab) => tab.id !== undefined).map((tab) => configurePanelForTab(tab.id!, tab.url)));
}

async function initialize(): Promise<void> {
  await ensureStorageMigrated();
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  await configureOpenTabs();
}

async function sessionMaps(): Promise<{ tabStates: Record<string, TabState>; leaderLocks: Record<string, LeaderLock> }> {
  const value = await chrome.storage.session.get(['tabStates', 'leaderLocks']);
  return { tabStates: (value.tabStates ?? {}) as Record<string, TabState>, leaderLocks: (value.leaderLocks ?? {}) as Record<string, LeaderLock> };
}

async function updateTab(sender: chrome.runtime.MessageSender, message: Record<string, unknown>): Promise<{ tabId: number; temporaryConversationKey: string } | null> {
  const tabId = sender.tab?.id;
  const url = sender.tab?.url ?? '';
  const provider = enabledProviderForUrl(url);
  if (tabId === undefined || !provider) return null;
  const state = await sessionMaps();
  const existing = state.tabStates[String(tabId)];
  const temporaryConversationKey = existing?.temporaryConversationKey ?? `temp:tab:${tabId}`;
  state.tabStates[String(tabId)] = {
    tabId,
    url,
    providerId: provider.id,
    conversationId: typeof message.conversationId === 'string' ? message.conversationId : existing?.conversationId ?? null,
    temporaryConversationKey,
    visible: Boolean(message.visible),
    focused: Boolean(message.focused),
    lastSeen: Date.now(),
  };
  await chrome.storage.session.set({ tabStates: state.tabStates });
  return { tabId, temporaryConversationKey };
}

async function leaderRequest(sender: chrome.runtime.MessageSender, message: Record<string, unknown>, renew: boolean): Promise<{ leader: boolean; lock?: LeaderLock }> {
  const tabId = sender.tab?.id;
  const scope = typeof message.scope === 'string' ? message.scope : '';
  const instanceId = typeof message.instanceId === 'string' ? message.instanceId : '';
  if (tabId === undefined || !scope || !instanceId) return { leader: false };
  if (renew) await updateTab(sender, message);
  const state = await sessionMaps();
  const now = Date.now();
  const current = state.leaderLocks[scope];
  const visible = Boolean(message.visible);
  const focused = Boolean(message.focused);
  const own = current?.tabId === tabId && current.instanceId === instanceId;
  const stale = !current || now - current.lastHeartbeat > LEADER_STALE_MS;
  const preferred = visible && focused && Boolean(current) && (!current.visible || !current.focused);
  if (own) {
    if (renew && now - current.lastHeartbeat >= LEADER_HEARTBEAT_MS - 250) {
      state.leaderLocks[scope] = { tabId, instanceId, lastHeartbeat: now, visible, focused };
      await chrome.storage.session.set({ leaderLocks: state.leaderLocks });
    }
    return { leader: true, lock: state.leaderLocks[scope] ?? current };
  }
  if (stale || preferred) {
    const lock = { tabId, instanceId, lastHeartbeat: now, visible, focused };
    state.leaderLocks[scope] = lock;
    await chrome.storage.session.set({ leaderLocks: state.leaderLocks });
    return { leader: true, lock };
  }
  return { leader: false, lock: current };
}

async function releaseLeader(message: Record<string, unknown>): Promise<void> {
  const scope = typeof message.scope === 'string' ? message.scope : '';
  const instanceId = typeof message.instanceId === 'string' ? message.instanceId : '';
  if (!scope || !instanceId) return;
  const state = await sessionMaps();
  if (state.leaderLocks[scope]?.instanceId === instanceId) {
    delete state.leaderLocks[scope];
    await chrome.storage.session.set({ leaderLocks: state.leaderLocks });
  }
}

async function cleanupTab(tabId: number): Promise<void> {
  const state = await sessionMaps();
  delete state.tabStates[String(tabId)];
  for (const [scope, lock] of Object.entries(state.leaderLocks)) if (lock.tabId === tabId) delete state.leaderLocks[scope];
  await chrome.storage.session.set({ tabStates: state.tabStates, leaderLocks: state.leaderLocks });
}

chrome.runtime.onInstalled.addListener(() => { void initialize(); });
chrome.runtime.onStartup.addListener(() => { void initialize(); });
chrome.tabs.onCreated.addListener((tab) => { if (tab.id !== undefined) void configurePanelForTab(tab.id, tab.url); });
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => { if (changeInfo.url || changeInfo.status === 'loading') void configurePanelForTab(tabId, changeInfo.url ?? tab.url); });
chrome.tabs.onActivated.addListener(({ tabId }) => { void chrome.tabs.get(tabId).then((tab) => configurePanelForTab(tabId, tab.url)); });
chrome.tabs.onRemoved.addListener((tabId) => { void serializeSession(() => cleanupTab(tabId)); });
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  void chrome.tabs.query({ active: true, windowId }).then(([tab]) => tab?.id !== undefined ? configurePanelForTab(tab.id, tab.url) : undefined);
});

async function openForActiveTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined || !enabledProviderForUrl(tab.url)) return;
  try {
    await configurePanelForTab(tab.id, tab.url);
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) { console.error('[LM Query Queuer] Could not open the side panel. Chrome may have rejected the user gesture.', error); }
}

chrome.commands.onCommand.addListener((command) => { if (command === 'open-queue-panel') void openForActiveTab(); });

chrome.runtime.onMessage.addListener((raw: unknown, sender, sendResponse) => {
  const message = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const type = message.type;
  if (type === 'REGISTER_TAB' || type === 'TAB_CONTEXT') {
    void serializeSession(() => updateTab(sender, message)).then(sendResponse);
    return true;
  }
  if (type === 'LEADER_HEARTBEAT' || type === 'LEADER_CHECK') {
    void serializeSession(() => leaderRequest(sender, message, type === 'LEADER_HEARTBEAT')).then(sendResponse);
    return true;
  }
  if (type === 'LEADER_RELEASE') {
    void serializeSession(() => releaseLeader(message)).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (type === 'TAB_UNLOAD' && sender.tab?.id !== undefined) {
    void serializeSession(() => cleanupTab(sender.tab!.id!)).then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});

void initialize();