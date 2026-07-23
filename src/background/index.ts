import { CHATGPT_URL, DEFAULT_STORAGE } from '../lib/constants';

const PANEL_PATH = 'src/sidepanel/index.html';

function supportsQueue(url?: string): boolean {
  return CHATGPT_URL.test(url ?? '');
}

async function configurePanelForTab(tabId: number, url?: string): Promise<void> {
  const enabled = supportsQueue(url);
  await chrome.sidePanel.setOptions({
    tabId,
    enabled,
    ...(enabled ? { path: PANEL_PATH } : {}),
  });
}

async function configureOpenTabs(): Promise<void> {
  // Disable the window-scoped default. Supported tabs receive their own panel
  // below, so switching to any other site closes/hides the queue panel.
  await chrome.sidePanel.setOptions({ enabled: false });
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs
      .filter((tab) => tab.id !== undefined)
      .map((tab) => configurePanelForTab(tab.id!, tab.url)),
  );
}

async function initializePanels(): Promise<void> {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  await configureOpenTabs();
}

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(null);
  await chrome.storage.local.set({
    schemaVersion: 1,
    settings: { ...DEFAULT_STORAGE.settings, ...(current.settings ?? {}) },
    queuesByConversation: current.queuesByConversation ?? {},
    pausedByConversation: current.pausedByConversation ?? {},
  });
  await initializePanels();
});

chrome.runtime.onStartup.addListener(() => {
  void initializePanels();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === 'loading') {
    void configurePanelForTab(tabId, changeInfo.url ?? tab.url);
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void chrome.tabs.get(tabId).then((tab) => configurePanelForTab(tabId, tab.url));
});

async function openForActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !supportsQueue(tab.url)) return;
  await configurePanelForTab(tab.id, tab.url);
  await chrome.sidePanel.open({ tabId: tab.id });
}

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-queue-panel') void openForActiveTab();
});

chrome.runtime.onMessage.addListener((message: { type?: string }, sender, sendResponse) => {
  if (message.type === 'GET_TAB_ID') {
    if (sender.tab?.id !== undefined) void configurePanelForTab(sender.tab.id, sender.tab.url);
    sendResponse({ tabId: sender.tab?.id });
  }
  return false;
});