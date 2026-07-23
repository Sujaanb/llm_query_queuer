import { normalizeStatusText } from '../../lib/status';
import { promptTextMatches } from '../../lib/text';
import type { ChatState, ProviderDiagnostics, ProviderId, Settings } from '../../lib/types';
import type { DebugLog } from '../debug';
import { clearComposerText, clickSend, insertComposerText, readComposer } from './composer';
import { boundedText, composerEnabled, composerKind, findVisible, recentVisible, truncateDiagnosticLabels } from './dom';
import type { KeyboardProfile, ProviderAdapter, ProviderCapabilities, ProviderSnapshot } from './types';

export interface ProviderSelectorRegistry {
  composer: readonly string[]; send: readonly string[]; stop: readonly string[]; complete: readonly string[]; assistant: readonly string[]; status: readonly string[]; errors: readonly string[];
  citations?: readonly string[]; thinking?: readonly string[]; tools?: readonly string[]; auxiliary?: readonly string[];
}
export interface ProviderAdapterConfig {
  id: ProviderId; name: string; matches: readonly string[]; detect: (url: string) => boolean; conversationId: (url: string) => string | null;
  selectors: ProviderSelectorRegistry; busyPatterns: ReadonlyArray<readonly [RegExp, ChatState, string]>; errorPattern: RegExp; capabilities?: Partial<ProviderCapabilities>; keyboardProfile?: Partial<KeyboardProfile>;
}
const DEFAULT_CAPABILITIES: ProviderCapabilities = { supportsMultiline: true, usesContentEditable: true, usesTextArea: true, usesShadowDom: false, hasStopButton: true, hasRegenerateButton: true, hasThinkingIndicator: true, hasSearchIndicator: true, requiresPasteFallback: true };
const DEFAULT_KEYBOARD: KeyboardProfile = { enterSends: true, shiftEnterNewline: true, cmdOrCtrlEnterSends: false, altEnterQueues: true, interceptSubmitEvent: true };

export abstract class ConfiguredProviderAdapter implements ProviderAdapter {
  readonly id: ProviderId; readonly name: string; readonly matches: readonly string[]; readonly capabilities: ProviderCapabilities; readonly keyboardProfile: KeyboardProfile;
  private observer: MutationObserver | null = null; private fallbackTimer: number | null = null; private debounceTimer: number | null = null; private listeners = new Set<() => void>(); private disposed = false;
  private lastAssistantSignature = ''; private lastAssistantChangeAt = Date.now(); private lastAuxiliarySignature = ''; private lastAuxiliaryChangeAt = Date.now(); private noBusySince = Date.now(); private insertionStrategy: string | null = null;
  private snapshot: ProviderSnapshot = { state: 'unknown', busy: false, ready: false, errorReason: null, signals: [] };
  private diagnostics: ProviderDiagnostics;

  protected constructor(protected config: ProviderAdapterConfig, private temporaryKey: string, private settings: () => Settings, private debug: DebugLog) {
    this.id = config.id; this.name = config.name; this.matches = config.matches; this.capabilities = { ...DEFAULT_CAPABILITIES, ...config.capabilities }; this.keyboardProfile = { ...DEFAULT_KEYBOARD, ...config.keyboardProfile };
    this.diagnostics = this.createDiagnostics([], [], []);
  }
  detect(): boolean { return this.config.detect(location.href); }
  getConversationId(): string | null { return this.config.conversationId(location.href); }
  getTemporaryConversationKey(): string { return this.temporaryKey; }
  getComposer(): HTMLElement | null { return findVisible(this.config.selectors.composer); }
  readComposerText(): string { return readComposer(this.getComposer()); }
  verifyComposerText(expectedText: string): boolean { return promptTextMatches(this.readComposerText(), expectedText); }
  isComposerEventTarget(target: EventTarget | null): boolean { const composer = this.getComposer(); return target instanceof Node && Boolean(composer?.contains(target)); }
  classifyControlAction(target: EventTarget | null): 'send' | 'stop' | null { const button = target instanceof Element ? target.closest('button') : null; if (!button) return null; const stop = findVisible(this.config.selectors.stop); if (stop && (button === stop || stop.contains(button))) return 'stop'; const send = findVisible(this.config.selectors.send); return send && (button === send || send.contains(button)) ? 'send' : null; }
  async setComposerText(text: string) { const composer = this.getComposer(); if (!composer) return { ok: false, strategy: null }; const result = await insertComposerText(composer, text); this.insertionStrategy = result.strategy; this.debug.add('composer-insertion', { provider: this.id, strategy: result.strategy, verified: result.ok, length: text.length, lines: text.split('\n').length }); return result; }
  clearComposer(): Promise<void> { return clearComposerText(this.getComposer()); }
  canSend(): boolean { return composerEnabled(this.getComposer()) && Boolean(findVisible(this.config.selectors.send)); }
  clickSend(): Promise<boolean> { return clickSend(this.config.selectors.send, () => !this.readComposerText() || Boolean(findVisible(this.config.selectors.stop))); }

  private assistantSignature(): string {
    for (const selector of this.config.selectors.assistant) { const nodes = document.querySelectorAll(selector); for (let index = nodes.length - 1; index >= 0; index--) { const element = nodes[index] as HTMLElement; if (!element.getClientRects().length || element.getAttribute('aria-hidden') === 'true') continue; const text = element.textContent ?? ''; return text.length + ':' + text.slice(-4000); } }
    return '';
  }
  private groupSignature(selectors: readonly string[] | undefined): string {
    if (!selectors?.length) return '';
    return recentVisible(selectors, 4).map((element) => { const value = boundedText(element, 300); return value.length + ':' + value.slice(-120); }).join('|').slice(-1200);
  }
  private auxiliarySignature(): string {
    const selectors = this.config.selectors;
    return [this.groupSignature(selectors.citations), this.groupSignature(selectors.thinking), this.groupSignature(selectors.tools), this.groupSignature(selectors.auxiliary)].join('::');
  }
  private createDiagnostics(busyIndicators: string[], readyIndicators: string[], errorIndicators: string[]): ProviderDiagnostics {
    const composer = this.getComposer(); const selectors = this.config.selectors;
    return {
      providerId: this.id, providerName: this.name, url: location.href, conversationId: this.getConversationId(), temporaryConversationKey: this.temporaryKey,
      composerFound: Boolean(composer), sendButtonFound: Boolean(findVisible(selectors.send)), stopButtonFound: Boolean(findVisible(selectors.stop)), regenerateButtonFound: Boolean(findVisible(selectors.complete)),
      citationSourceRegionFound: Boolean(findVisible(selectors.citations ?? [])), thinkingBlockFound: Boolean(findVisible(selectors.thinking ?? [])), toolTaskPanelFound: Boolean(findVisible(selectors.tools ?? [])),
      busyIndicators: truncateDiagnosticLabels(busyIndicators), readyIndicators: truncateDiagnosticLabels(readyIndicators), errorIndicators: truncateDiagnosticLabels(errorIndicators, 8),
      latestAssistantMessageFound: Boolean(this.lastAssistantSignature), composerType: composerKind(composer), insertionStrategy: this.insertionStrategy, lastCheckedAt: Date.now(),
    };
  }
  private evaluate(): void {
    if (this.disposed) return;
    const now = Date.now(); const signature = this.assistantSignature(); if (signature !== this.lastAssistantSignature) { this.lastAssistantSignature = signature; this.lastAssistantChangeAt = now; }
    const auxiliary = this.auxiliarySignature(); if (auxiliary !== this.lastAuxiliarySignature) { this.lastAuxiliarySignature = auxiliary; this.lastAuxiliaryChangeAt = now; }
    const statusText = normalizeStatusText(recentVisible(this.config.selectors.status).map((element) => boundedText(element)).join(' '));
    const errorTexts = recentVisible(this.config.selectors.errors).map((element) => normalizeStatusText(boundedText(element, 800)));
    const errorMatch = errorTexts.map((text) => { this.config.errorPattern.lastIndex = 0; return text.match(this.config.errorPattern)?.[0]; }).find(Boolean) ?? null;
    const named = this.config.busyPatterns.find(([pattern]) => { pattern.lastIndex = 0; return pattern.test(statusText); });
    const stop = Boolean(findVisible(this.config.selectors.stop)); const stabilityMs = this.settings().stabilityMs;
    const textChanging = Boolean(signature) && now - this.lastAssistantChangeAt < stabilityMs;
    const auxiliaryChanging = Boolean(auxiliary.replaceAll(':', '')) && now - this.lastAuxiliaryChangeAt < stabilityMs;
    const busy = stop || Boolean(named) || textChanging || auxiliaryChanging; if (busy) this.noBusySince = now;
    const enabled = composerEnabled(this.getComposer()); const stableFor = now - this.lastAssistantChangeAt; const auxiliaryStableFor = now - this.lastAuxiliaryChangeAt; const complete = Boolean(findVisible(this.config.selectors.complete));
    const fullyStable = stableFor >= stabilityMs && auxiliaryStableFor >= stabilityMs;
    const fallback = !busy && enabled && !errorMatch && Boolean(signature) && fullyStable && now - this.noBusySince >= this.settings().fallbackReadyTimeoutMs;
    const ready = !busy && enabled && !errorMatch && (!signature || (fullyStable && complete) || fallback);
    let state: ChatState = 'unknown'; if (errorMatch) state = 'error'; else if (named) state = named[1]; else if (busy) state = 'streaming'; else if (ready) state = signature ? 'ready' : 'idle';
    const busyIndicators = [stop ? 'stop-button' : '', named?.[2] ?? '', textChanging ? 'assistant-text-changing' : '', auxiliaryChanging ? 'source-tool-region-changing' : ''].filter(Boolean);
    const readyIndicators = [enabled ? 'composer-enabled' : '', complete ? 'response-control' : '', stableFor >= stabilityMs ? 'assistant-stable' : '', auxiliaryStableFor >= stabilityMs ? 'sources-tools-stable' : '', fallback ? 'fallback-ready' : ''].filter(Boolean);
    const errorIndicators = errorMatch ? [errorMatch.slice(0, 80)] : [];
    const previous = this.snapshot; this.snapshot = { state, busy, ready, errorReason: errorMatch, signals: [...busyIndicators, ...readyIndicators] }; this.diagnostics = this.createDiagnostics(busyIndicators, readyIndicators, errorIndicators);
    if (previous.state !== state || previous.busy !== busy || previous.ready !== ready || previous.errorReason !== errorMatch) { this.debug.add('provider-diagnostics', { ...this.diagnostics }); this.listeners.forEach((listener) => listener()); }
  }
  private scheduleEvaluate(): void { if (this.debounceTimer !== null) return; this.debounceTimer = window.setTimeout(() => { this.debounceTimer = null; this.evaluate(); }, 250); }
  observe(callback: () => void): () => void { this.listeners.add(callback); if (!this.observer) { this.observer = new MutationObserver(() => this.scheduleEvaluate()); this.observer.observe(document.querySelector('main') ?? document.body ?? document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-busy', 'aria-disabled', 'disabled'] }); this.fallbackTimer = window.setInterval(() => this.evaluate(), 1500); this.evaluate(); } return () => { this.listeners.delete(callback); }; }
  getSnapshot(): ProviderSnapshot { return this.snapshot; }
  getDiagnostics(): ProviderDiagnostics { return { ...this.diagnostics, busyIndicators: [...this.diagnostics.busyIndicators], readyIndicators: [...this.diagnostics.readyIndicators], errorIndicators: [...this.diagnostics.errorIndicators] }; }
  isBusy(): boolean { return this.snapshot.busy; } isReadyForNextMessage(): boolean { return this.snapshot.ready; } hasError(): boolean { return Boolean(this.snapshot.errorReason); } getErrorReason(): string | null { return this.snapshot.errorReason; }
  dispose(): void { this.disposed = true; this.observer?.disconnect(); this.observer = null; if (this.fallbackTimer !== null) clearInterval(this.fallbackTimer); if (this.debounceTimer !== null) clearTimeout(this.debounceTimer); this.fallbackTimer = null; this.debounceTimer = null; this.listeners.clear(); }
}
