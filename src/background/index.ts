import { CHATGPT_URL, DEFAULT_STORAGE } from '../lib/constants';

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(null);
  await chrome.storage.local.set({
    schemaVersion: 1,
    settings: { ...DEFAULT_STORAGE.settings, ...(current.settings ?? {}) },
    queuesByConversation: current.queuesByConversation ?? {},
    pausedByConversation: current.pausedByConversation ?? {},
  });
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onStartup.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

async function openForActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.windowId || !CHATGPT_URL.test(tab.url ?? '')) return;
  await chrome.sidePanel.open({ windowId: tab.windowId });
}

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-queue-panel') void openForActiveTab();
});


chrome.runtime.onMessage.addListener((message: { type?: string }, sender, sendResponse) => {
  if (message.type === 'GET_TAB_ID') sendResponse({ tabId: sender.tab?.id });
  return false;
});
