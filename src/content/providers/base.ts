import { DEFAULT_SETTINGS } from '../../lib/constants';
import { mergeSelectorList, selectorOverrideKeys } from '../../lib/selectors';
import { normalizeStatusText } from '../../lib/status';
import { promptTextMatches } from '../../lib/text';
import type { ChatState, ProviderDiagnostics, ProviderId, SelectorOverrideKey, SelectorOverrides, Settings } from '../../lib/types';
import type { DebugLog } from '../debug';
import { clearComposerText, clickSend, insertComposerText, readComposer } from './composer';
import { boundedText, composerEnabled, composerKind, findVisible, queryAllSafe, recentVisible, truncateDiagnosticLabels } from './dom';
import type { KeyboardProfile, ProviderAdapter, ProviderCapabilities, ProviderSnapshot } from './types';

export interface ProviderSelectorRegistry {
  composer: readonly string[]; send: readonly string[]; stop: readonly string[]; complete: readonly string[]; assistant: readonly string[]; status: readonly string[]; errors: readonly string[];
  citations?: readonly string[]; thinking?: readonly string[]; tools?: readonly string[]; terminal?: readonly string[]; auxiliary?: readonly string[];
}
export interface ProviderAdapterConfig {
  id: ProviderId; name: string; matches: readonly string[]; detect: (url: string) => boolean; conversationId: (url: string) => string | null;
  selectors: ProviderSelectorRegistry; busyPatterns: ReadonlyArray<readonly [RegExp, ChatState, string]>; errorPattern: RegExp; capabilities?: Partial<ProviderCapabilities>; keyboardProfile?: Partial<KeyboardProfile>;
  experimental?: boolean; pauseOnUncertain?: boolean; defaultStabilityMs?: number; defaultFallbackReadyTimeoutMs?: number;
}
const DEFAULT_CAPABILITIES: ProviderCapabilities = { supportsMultiline: true, usesContentEditable: true, usesTextArea: true, usesShadowDom: false, hasStopButton: true, hasRegenerateButton: true, hasThinkingIndicator: true, hasSearchIndicator: true, requiresPasteFallback: true };
const DEFAULT_KEYBOARD: KeyboardProfile = { enterSends: true, shiftEnterNewline: true, cmdOrCtrlEnterSends: false, altEnterQueues: true, interceptSubmitEvent: true };
type HighlightEntry = { element: HTMLElement; outline: string; outlineOffset: string };

export abstract class ConfiguredProviderAdapter implements ProviderAdapter {
  readonly id: ProviderId; readonly name: string; readonly matches: readonly string[]; readonly capabilities: ProviderCapabilities; readonly keyboardProfile: KeyboardProfile;
  private observer: MutationObserver | null = null; private fallbackTimer: number | null = null; private debounceTimer: number | null = null; private highlightTimer: number | null = null;
  private listeners = new Set<() => void>(); private disposed = false; private highlights: HighlightEntry[] = [];
  private lastAssistantSignature = ''; private lastAssistantChangeAt = Date.now(); private lastAuxiliarySignature = ''; private lastAuxiliaryChangeAt = Date.now(); private noBusySince = Date.now(); private insertionStrategy: string | null = null;
  private snapshot: ProviderSnapshot = { state: 'unknown', busy: false, ready: false, errorReason: null, uncertainReason: null, signals: [] };
  private diagnostics: ProviderDiagnostics; private selectors: ProviderSelectorRegistry; private overrideKeys: SelectorOverrideKey[];

  protected constructor(protected config: ProviderAdapterConfig, private temporaryKey: string, private settings: () => Settings, private debug: DebugLog, overrides: SelectorOverrides = {}) {
    this.id = config.id; this.name = config.name; this.matches = config.matches; this.capabilities = { ...DEFAULT_CAPABILITIES, ...config.capabilities }; this.keyboardProfile = { ...DEFAULT_KEYBOARD, ...config.keyboardProfile };
    this.overrideKeys = selectorOverrideKeys(overrides);
    this.selectors = {
      composer: mergeSelectorList(config.selectors.composer, overrides.composer), send: mergeSelectorList(config.selectors.send, overrides.send), stop: mergeSelectorList(config.selectors.stop, overrides.stop),
      complete: mergeSelectorList(config.selectors.complete, overrides.regenerate), assistant: mergeSelectorList(config.selectors.assistant, overrides.assistant), status: mergeSelectorList(config.selectors.status, overrides.status),
      errors: mergeSelectorList(config.selectors.errors, overrides.errors), citations: mergeSelectorList(config.selectors.citations ?? [], overrides.citations), thinking: mergeSelectorList(config.selectors.thinking ?? [], overrides.thinking),
      tools: mergeSelectorList(config.selectors.tools ?? [], overrides.tools), terminal: mergeSelectorList(config.selectors.terminal ?? [], overrides.terminal), auxiliary: mergeSelectorList(config.selectors.auxiliary ?? [], overrides.auxiliary),
    };
    this.diagnostics = this.createDiagnostics([], [], [], null);
  }
  detect(): boolean { return this.config.detect(location.href); }
  getConversationId(): string | null { return this.config.conversationId(location.href); }
  getTemporaryConversationKey(): string { return this.temporaryKey; }
  getComposer(): HTMLElement | null { return findVisible(this.selectors.composer); }
  readComposerText(): string { return readComposer(this.getComposer()); }
  verifyComposerText(expectedText: string): boolean { return promptTextMatches(this.readComposerText(), expectedText); }
  isComposerEventTarget(target: EventTarget | null): boolean { const composer = this.getComposer(); return target instanceof Node && Boolean(composer?.contains(target)); }
  classifyControlAction(target: EventTarget | null): 'send' | 'stop' | null { const button = target instanceof Element ? target.closest('button') : null; if (!button) return null; const stop = findVisible(this.selectors.stop); if (stop && (button === stop || stop.contains(button))) return 'stop'; const send = findVisible(this.selectors.send); return send && (button === send || send.contains(button)) ? 'send' : null; }
  async setComposerText(text: string) { const composer = this.getComposer(); if (!composer) return { ok: false, strategy: null }; const result = await insertComposerText(composer, text); this.insertionStrategy = result.strategy; this.debug.add('composer-insertion', { provider: this.id, strategy: result.strategy, verified: result.ok, length: text.length, lines: text.split('\n').length }); return result; }
  clearComposer(): Promise<void> { return clearComposerText(this.getComposer()); }
  canSend(): boolean { return composerEnabled(this.getComposer()) && Boolean(findVisible(this.selectors.send)); }
  clickSend(): Promise<boolean> { return clickSend(this.selectors.send, () => !this.readComposerText() || Boolean(findVisible(this.selectors.stop))); }

  getEffectiveSelectors(): Partial<Record<SelectorOverrideKey, string[]>> {
    return { composer: [...this.selectors.composer], send: [...this.selectors.send], stop: [...this.selectors.stop], regenerate: [...this.selectors.complete], assistant: [...this.selectors.assistant], status: [...this.selectors.status], errors: [...this.selectors.errors], citations: [...(this.selectors.citations ?? [])], thinking: [...(this.selectors.thinking ?? [])], tools: [...(this.selectors.tools ?? [])], terminal: [...(this.selectors.terminal ?? [])], auxiliary: [...(this.selectors.auxiliary ?? [])] };
  }
  private clearHighlights(): void {
    if (this.highlightTimer !== null) clearTimeout(this.highlightTimer); this.highlightTimer = null;
    for (const entry of this.highlights) { entry.element.style.outline = entry.outline; entry.element.style.outlineOffset = entry.outlineOffset; } this.highlights = [];
  }
  highlightDetectedElements(): string[] {
    this.clearHighlights(); const found: string[] = []; const seen = new Set<HTMLElement>();
    const targets: Array<readonly [string, readonly string[], string]> = [['composer', this.selectors.composer, '#2563eb'], ['send', this.selectors.send, '#16a34a'], ['stop', this.selectors.stop, '#d97706'], ['regenerate', this.selectors.complete, '#9333ea']];
    for (const [label, selectors, color] of targets) { const element = findVisible(selectors); if (!element || seen.has(element)) continue; seen.add(element); this.highlights.push({ element, outline: element.style.outline, outlineOffset: element.style.outlineOffset }); element.style.outline = '3px solid ' + color; element.style.outlineOffset = '2px'; found.push(label); }
    if (this.highlights.length) this.highlightTimer = window.setTimeout(() => this.clearHighlights(), 5000); return found;
  }
  private assistantSignature(): string {
    for (const selector of this.selectors.assistant) { const nodes = queryAllSafe(selector); for (let index = nodes.length - 1; index >= 0; index--) { const element = nodes[index] as HTMLElement; if (!element.getClientRects().length || element.getAttribute('aria-hidden') === 'true') continue; const text = element.textContent ?? ''; return text.length + ':' + text.slice(-4000); } } return '';
  }
  private groupSignature(selectors: readonly string[] | undefined): string { if (!selectors?.length) return ''; return recentVisible(selectors, 4).map((element) => { const value = boundedText(element, 300); return value.length + ':' + value.slice(-120); }).join('|').slice(-1200); }
  private auxiliarySignature(): string { return [this.groupSignature(this.selectors.citations), this.groupSignature(this.selectors.thinking), this.groupSignature(this.selectors.tools), this.groupSignature(this.selectors.terminal), this.groupSignature(this.selectors.auxiliary)].join('::'); }
  private effectiveSettings(): Settings {
    const settings = this.settings(); if (!this.config.experimental) return settings;
    return { ...settings, stabilityMs: settings.stabilityMs === DEFAULT_SETTINGS.stabilityMs ? this.config.defaultStabilityMs ?? settings.stabilityMs : settings.stabilityMs, fallbackReadyTimeoutMs: settings.fallbackReadyTimeoutMs === DEFAULT_SETTINGS.fallbackReadyTimeoutMs ? this.config.defaultFallbackReadyTimeoutMs ?? settings.fallbackReadyTimeoutMs : settings.fallbackReadyTimeoutMs };
  }
  private createDiagnostics(busyIndicators: string[], readyIndicators: string[], errorIndicators: string[], uncertainReason: string | null): ProviderDiagnostics {
    const composer = this.getComposer();
    return {
      providerId: this.id, providerName: this.name, url: location.href, conversationId: this.getConversationId(), temporaryConversationKey: this.temporaryKey,
      composerFound: Boolean(composer), sendButtonFound: Boolean(findVisible(this.selectors.send)), stopButtonFound: Boolean(findVisible(this.selectors.stop)), regenerateButtonFound: Boolean(findVisible(this.selectors.complete)),
      citationSourceRegionFound: Boolean(findVisible(this.selectors.citations ?? [])), thinkingBlockFound: Boolean(findVisible(this.selectors.thinking ?? [])), toolTaskPanelFound: Boolean(findVisible(this.selectors.tools ?? [])), terminalOutputPanelFound: Boolean(findVisible(this.selectors.terminal ?? [])),
      busyIndicators: truncateDiagnosticLabels(busyIndicators), readyIndicators: truncateDiagnosticLabels(readyIndicators), errorIndicators: truncateDiagnosticLabels(errorIndicators, 8),
      latestAssistantMessageFound: Boolean(this.lastAssistantSignature), composerType: composerKind(composer), insertionStrategy: this.insertionStrategy, lastCheckedAt: Date.now(),
      experimentalProvider: Boolean(this.config.experimental), selectorOverridesActive: this.overrideKeys.length > 0, selectorOverrideKeys: [...this.overrideKeys], uncertainReason,
    };
  }
  private evaluate(): void {
    if (this.disposed) return;
    const now = Date.now(); const signature = this.assistantSignature(); if (signature !== this.lastAssistantSignature) { this.lastAssistantSignature = signature; this.lastAssistantChangeAt = now; }
    const auxiliary = this.auxiliarySignature(); if (auxiliary !== this.lastAuxiliarySignature) { this.lastAuxiliarySignature = auxiliary; this.lastAuxiliaryChangeAt = now; }
    const statusText = normalizeStatusText(recentVisible(this.selectors.status).map((element) => boundedText(element)).join(' '));
    const errorTexts = recentVisible(this.selectors.errors).map((element) => normalizeStatusText(boundedText(element, 800)));
    const errorMatch = errorTexts.map((text) => { this.config.errorPattern.lastIndex = 0; return text.match(this.config.errorPattern)?.[0]; }).find(Boolean) ?? null;
    const named = this.config.busyPatterns.find(([pattern]) => { pattern.lastIndex = 0; return pattern.test(statusText); });
    const stop = Boolean(findVisible(this.selectors.stop)); const timing = this.effectiveSettings(); const stabilityMs = timing.stabilityMs;
    const textChanging = Boolean(signature) && now - this.lastAssistantChangeAt < stabilityMs; const auxiliaryChanging = Boolean(auxiliary.replaceAll(':', '')) && now - this.lastAuxiliaryChangeAt < stabilityMs;
    const busy = stop || Boolean(named) || textChanging || auxiliaryChanging; if (busy) this.noBusySince = now;
    const composer = this.getComposer(); const enabled = composerEnabled(composer); const stableFor = now - this.lastAssistantChangeAt; const auxiliaryStableFor = now - this.lastAuxiliaryChangeAt; const complete = Boolean(findVisible(this.selectors.complete));
    const fullyStable = stableFor >= stabilityMs && auxiliaryStableFor >= stabilityMs;
    const fallback = !busy && enabled && !errorMatch && Boolean(signature) && fullyStable && now - this.noBusySince >= timing.fallbackReadyTimeoutMs;
    const ready = !busy && enabled && !errorMatch && (!signature || (fullyStable && complete) || fallback);
    const uncertainReason = this.config.experimental && this.config.pauseOnUncertain && !busy && !errorMatch && !composer ? 'composer-not-found' : null;
    let state: ChatState = 'unknown'; if (errorMatch) state = 'error'; else if (named) state = named[1]; else if (busy) state = 'streaming'; else if (ready) state = signature ? 'ready' : 'idle';
    const busyIndicators = [stop ? 'stop-button' : '', named?.[2] ?? '', textChanging ? 'assistant-text-changing' : '', auxiliaryChanging ? 'source-tool-terminal-changing' : ''].filter(Boolean);
    const readyIndicators = [enabled ? 'composer-enabled' : '', complete ? 'response-control' : '', stableFor >= stabilityMs ? 'assistant-stable' : '', auxiliaryStableFor >= stabilityMs ? 'auxiliary-regions-stable' : '', fallback ? 'fallback-ready' : ''].filter(Boolean);
    const errorIndicators = errorMatch ? [errorMatch.slice(0, 80)] : [];
    const previous = this.snapshot; this.snapshot = { state, busy, ready, errorReason: errorMatch, uncertainReason, signals: [...busyIndicators, ...readyIndicators] }; this.diagnostics = this.createDiagnostics(busyIndicators, readyIndicators, errorIndicators, uncertainReason);
    if (previous.state !== state || previous.busy !== busy || previous.ready !== ready || previous.errorReason !== errorMatch || previous.uncertainReason !== uncertainReason) { this.debug.add('provider-diagnostics', { ...this.diagnostics }); this.listeners.forEach((listener) => listener()); }
  }
  private scheduleEvaluate(): void { if (this.debounceTimer !== null) return; this.debounceTimer = window.setTimeout(() => { this.debounceTimer = null; this.evaluate(); }, 250); }
  observe(callback: () => void): () => void { this.listeners.add(callback); if (!this.observer) { this.observer = new MutationObserver(() => this.scheduleEvaluate()); this.observer.observe(document.querySelector('main') ?? document.body ?? document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-busy', 'aria-disabled', 'disabled', 'data-state'] }); this.fallbackTimer = window.setInterval(() => this.evaluate(), 1500); this.evaluate(); } return () => { this.listeners.delete(callback); }; }
  getSnapshot(): ProviderSnapshot { return this.snapshot; }
  getDiagnostics(): ProviderDiagnostics { return { ...this.diagnostics, busyIndicators: [...this.diagnostics.busyIndicators], readyIndicators: [...this.diagnostics.readyIndicators], errorIndicators: [...this.diagnostics.errorIndicators], selectorOverrideKeys: [...this.diagnostics.selectorOverrideKeys] }; }
  isBusy(): boolean { return this.snapshot.busy; } isReadyForNextMessage(): boolean { return this.snapshot.ready; } hasError(): boolean { return Boolean(this.snapshot.errorReason); } getErrorReason(): string | null { return this.snapshot.errorReason; }
  isUncertain(): boolean { return Boolean(this.snapshot.uncertainReason); } getUncertainReason(): string | null { return this.snapshot.uncertainReason; }
  dispose(): void {
    this.disposed = true; this.observer?.disconnect(); this.observer = null; this.clearHighlights(); if (this.fallbackTimer !== null) clearInterval(this.fallbackTimer); if (this.debounceTimer !== null) clearTimeout(this.debounceTimer);
    this.fallbackTimer = null; this.debounceTimer = null; this.listeners.clear(); this.lastAssistantSignature = ''; this.lastAuxiliarySignature = ''; this.insertionStrategy = null;
  }
}
