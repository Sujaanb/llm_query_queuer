import { DEFAULT_SETTINGS } from '../lib/constants';
import { makeItem } from '../lib/queue';
import { migrateQueue, readStorage, setPaused, updateQueue } from '../lib/storage';
import type { Settings, TabStatus } from '../lib/types';
import { findVisible, isInsideComposer, SELECTORS } from './chatgpt-dom';
import { clearComposer, readComposer } from './composer';
import { LeaderElection } from './leader';
import { Scheduler } from './scheduler';
import { StateDetector } from './state-detector';
import { Toasts } from './toasts';

let settings: Settings = DEFAULT_SETTINGS;
let temporaryKey = `temp:${crypto.randomUUID()}`;

function realConversationKey(): string | null {
  const match = location.pathname.match(/^\/c\/([^/?#]+)/);
  return match ? `conversation:${match[1]}` : null;
}
function conversationKey() { return realConversationKey() ?? temporaryKey; }

const toasts = new Toasts(() => settings);
const detector = new StateDetector(() => settings);
const leader = new LeaderElection(conversationKey);
const scheduler = new Scheduler(conversationKey, () => settings, detector, leader, toasts);

async function queueCurrent(source: 'enter' | 'manual' = 'enter') {
  const text = readComposer().trim();
  if (!text) return;
  await updateQueue(conversationKey(), (items) => [...items, makeItem(text, source)]);
  clearComposer();
  toasts.show('Message queued', 'success');
}

function forceSend(event: KeyboardEvent) { return (event.metaKey && /mac/i.test(navigator.platform)) || (event.ctrlKey && !/mac/i.test(navigator.platform)); }
function forceQueue(event: KeyboardEvent) { return event.altKey; }

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || event.isComposing || !isInsideComposer(event.target) || event.shiftKey) return;
  if (forceSend(event)) {
    void pauseForManualSend();
    return;
  }
  const shouldQueue = forceQueue(event) || settings.alwaysQueue || !['idle', 'ready'].includes(detector.current);
  if (!shouldQueue) {
    void pauseForManualSend();
    return;
  }
  event.preventDefault();
  event.stopImmediatePropagation();
  void queueCurrent('enter');
}, true);

async function pauseForManualSend() {
  const state = await readStorage();
  const key = conversationKey();
  if ((state.queuesByConversation[key]?.length ?? 0) > 0 && !state.pausedByConversation[key]) {
    await scheduler.pause('Queue paused because a manual message was sent');
  }
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest('button') : null;
  if (!target) return;
  const stop = findVisible(SELECTORS.stop);
  if (stop && target === stop && settings.pauseOnStop) void scheduler.pause('Queue paused because generation was stopped');
  const send = findVisible(SELECTORS.send);
  if (send && target === send && !scheduler.isAutoSubmitting()) {
    void readStorage().then((state) => {
      const key = conversationKey();
      if ((state.queuesByConversation[key]?.length ?? 0) > 0 && !state.pausedByConversation[key]) {
        void scheduler.pause('Queue paused because a manual message was sent');
      }
    });
  }
}, true);

chrome.runtime.onMessage.addListener((message: { type?: string }, _sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    const response: TabStatus = { supported: true, conversationKey: conversationKey(), chatState: detector.current, schedulerState: scheduler.state };
    sendResponse(response);
  }
  return false;
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings?.newValue) settings = { ...DEFAULT_SETTINGS, ...changes.settings.newValue };
});

async function initialize() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_TAB_ID' }) as { tabId?: number };
    if (response.tabId !== undefined) temporaryKey = `temp:tab:${response.tabId}`;
  } catch { /* Keep an isolated temporary key if the worker is unavailable. */ }
  settings = (await readStorage()).settings;
  detector.start(); leader.start(); scheduler.start();
  let previous = conversationKey();
  window.setInterval(() => {
    const next = conversationKey();
    if (next !== previous) { void migrateQueue(previous, next); previous = next; }
  }, 1000);
}
void initialize();
