import { DEFAULT_SETTINGS } from '../lib/constants';
import { makeItem } from '../lib/queue';
import { hasPromptContent } from '../lib/text';
import { migrateQueue, readStorage, setPaused, updateQueue } from '../lib/storage';
import type { ProviderId, Settings, TabStatus } from '../lib/types';
import { DebugLog } from './debug';
import { LeaderElection } from './leader';
import { createProviderAdapter } from './providers/registry';
import type { ProviderAdapter } from './providers/types';
import { Scheduler } from './scheduler';
import { Toasts } from './toasts';

interface RuntimeRegistration { tabId?: number; temporaryConversationKey?: string }
interface RouteRuntime { provider: ProviderAdapter; leader: LeaderElection; scheduler: Scheduler; key: () => string; dispose: () => void }

declare global { interface Window { __lmQueryQueuerDispose?: () => void } }

class ContentController {
  private settings: Settings = DEFAULT_SETTINGS;
  private debug = new DebugLog(() => this.settings);
  private toasts = new Toasts(() => this.settings);
  private route: RouteRuntime | null = null;
  private routeUrl = location.href;
  private tabId: number | null = null;
  private temporaryKey = `temp:instance:${crypto.randomUUID()}`;
  private routeTimer: number | null = null;
  private disposed = false;
  private autoSubmitting = false;

  private readonly keydown = (event: KeyboardEvent) => {
    const route = this.route;
    if (!route || event.key !== 'Enter' || event.isComposing || event.shiftKey || !route.provider.isComposerEventTarget(event.target)) return;
    const mac = /mac/i.test(navigator.platform);
    const forceSend = mac ? event.metaKey : event.ctrlKey;
    const forceQueue = event.altKey;
    if (forceSend) { void this.pauseForManualSend(); return; }
    const state = route.provider.getSnapshot().state;
    const shouldQueue = forceQueue || this.settings.alwaysQueue || !['idle', 'ready'].includes(state);
    if (!shouldQueue) { void this.pauseForManualSend(); return; }
    event.preventDefault();
    event.stopImmediatePropagation();
    void this.queueCurrent();
  };

  private readonly click = (event: MouseEvent) => {
    const route = this.route;
    if (!route) return;
    const action = route.provider.classifyControlAction(event.target);
    if (action === 'stop' && this.settings.pauseOnStop) void route.scheduler.pause('Queue paused because generation was stopped.');
    if (action === 'send' && !route.scheduler.isAutoSubmitting() && !this.autoSubmitting) void this.pauseForManualSend();
  };

  private readonly message = (message: { type?: string }, _sender: chrome.runtime.MessageSender, sendResponse: (response: TabStatus) => void) => {
    if (message.type !== 'GET_STATUS') return false;
    const route = this.route;
    const response: TabStatus = route ? {
      supported: true,
      providerId: route.provider.id,
      providerName: route.provider.name,
      conversationId: route.provider.getConversationId(),
      conversationKey: route.key(),
      chatState: route.provider.getSnapshot().state,
      schedulerState: route.scheduler.state,
      isLeader: route.leader.current,
    } : { supported: false };
    sendResponse(response);
    return false;
  };

  private readonly storageChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && changes.settings?.newValue) this.settings = { ...DEFAULT_SETTINGS, ...changes.settings.newValue };
  };
  private readonly unload = () => this.dispose();
  private readonly navigation = () => void this.checkRoute();

  async start(): Promise<void> {
    if (!/^https:\/\/(chatgpt\.com|chat\.openai\.com)(?:\/|$)/i.test(location.href)) return;
    this.settings = (await readStorage()).settings;
    if (this.disposed) return;
    try {
      const registration = await chrome.runtime.sendMessage({ type: 'REGISTER_TAB', visible: !document.hidden, focused: document.hasFocus() }) as RuntimeRegistration;
      this.tabId = registration.tabId ?? null;
      if (registration.temporaryConversationKey) this.temporaryKey = registration.temporaryConversationKey;
      else if (this.tabId !== null) this.temporaryKey = `temp:tab:${this.tabId}`;
    } catch { /* A unique instance key remains safe until the worker wakes. */ }
    if (this.disposed) return;
    document.addEventListener('keydown', this.keydown, true);
    document.addEventListener('click', this.click, true);
    chrome.runtime.onMessage.addListener(this.message);
    chrome.storage.onChanged.addListener(this.storageChanged);
    window.addEventListener('pagehide', this.unload, { once: true });
    window.addEventListener('popstate', this.navigation);
    window.addEventListener('hashchange', this.navigation);
    this.routeTimer = window.setInterval(() => void this.checkRoute(), 1000);
    await this.initializeRoute();
  }

  private async queueCurrent(): Promise<void> {
    const route = this.route;
    if (!route) return;
    const text = route.provider.readComposerText();
    if (!hasPromptContent(text)) return;
    await updateQueue(route.provider.id, route.key(), (items) => [...items, makeItem(text, 'enter')]);
    await route.provider.clearComposer();
    this.toasts.show('Message queued', 'success');
  }

  private async pauseForManualSend(): Promise<void> {
    const route = this.route;
    if (!route) return;
    const state = await readStorage();
    const items = state.queuesByProvider[route.provider.id]?.[route.key()] ?? [];
    if (items.length && !state.pausedByProvider[route.provider.id]?.[route.key()]) await route.scheduler.pause('Queue paused because a manual message was sent.');
  }

  private async initializeRoute(previousKey?: { providerId: ProviderId; key: string }): Promise<void> {
    const provider = createProviderAdapter(location.href, this.temporaryKey, () => this.settings, this.debug);
    if (!provider?.detect()) return;
    const conversationId = provider.getConversationId();
    const nextKey = conversationId ? `conversation:${conversationId}` : provider.getTemporaryConversationKey();
    const key = () => nextKey;
    if (previousKey && previousKey.providerId === provider.id && previousKey.key.startsWith('temp:') && !nextKey.startsWith('temp:')) {
      await migrateQueue(provider.id, previousKey.key, nextKey);
      this.debug.add('temporary-queue-migrated', { from: previousKey.key, to: nextKey });
    }
    const leader = new LeaderElection(provider.id, key, this.debug);
    const scheduler = new Scheduler(provider.id, key, () => this.settings, provider, leader, this.toasts, this.debug);
    leader.start();
    scheduler.start();
    this.route = { provider, leader, scheduler, key, dispose: () => { scheduler.dispose(); leader.stop(); provider.dispose(); } };
    this.debug.add('provider-detected', { provider: provider.id, conversationId: provider.getConversationId(), temporaryConversationKey: provider.getTemporaryConversationKey(), tabId: this.tabId });
    void chrome.runtime.sendMessage({ type: 'TAB_CONTEXT', providerId: provider.id, conversationId: provider.getConversationId(), temporaryConversationKey: provider.getTemporaryConversationKey(), visible: !document.hidden, focused: document.hasFocus() }).catch(() => undefined);
  }

  private async checkRoute(): Promise<void> {
    if (this.disposed || location.href === this.routeUrl) return;
    this.routeUrl = location.href;
    const previous = this.route ? { providerId: this.route.provider.id, key: this.route.key() } : undefined;
    this.route?.dispose();
    this.route = null;
    await this.initializeRoute(previous);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.route?.dispose();
    this.route = null;
    this.toasts.dispose();
    this.debug.clear();
    if (this.routeTimer !== null) clearInterval(this.routeTimer);
    document.removeEventListener('keydown', this.keydown, true);
    document.removeEventListener('click', this.click, true);
    chrome.runtime.onMessage.removeListener(this.message);
    chrome.storage.onChanged.removeListener(this.storageChanged);
    window.removeEventListener('pagehide', this.unload);
    window.removeEventListener('popstate', this.navigation);
    window.removeEventListener('hashchange', this.navigation);
    void chrome.runtime.sendMessage({ type: 'TAB_UNLOAD' }).catch(() => undefined);
  }
}

window.__lmQueryQueuerDispose?.();
const controller = new ContentController();
window.__lmQueryQueuerDispose = () => controller.dispose();
void controller.start();