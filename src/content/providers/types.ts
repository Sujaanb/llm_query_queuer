import type { ChatState, ProviderDiagnostics, ProviderId } from '../../lib/types';
export interface ProviderCapabilities { supportsMultiline: boolean; usesContentEditable: boolean; usesTextArea: boolean; usesShadowDom: boolean; hasStopButton: boolean; hasRegenerateButton: boolean; hasThinkingIndicator: boolean; hasSearchIndicator: boolean; requiresPasteFallback: boolean }
export interface ProviderSnapshot { state: ChatState; busy: boolean; ready: boolean; errorReason: string | null; signals: readonly string[] }
export interface ComposerInsertionResult { ok: boolean; strategy: string | null }
export interface KeyboardProfile { enterSends: boolean; shiftEnterNewline: boolean; cmdOrCtrlEnterSends: boolean; altEnterQueues: boolean; interceptSubmitEvent: boolean }
export interface ProviderAdapter {
  readonly id: ProviderId; readonly name: string; readonly matches: readonly string[]; readonly capabilities: ProviderCapabilities; readonly keyboardProfile: KeyboardProfile;
  detect(): boolean; getConversationId(): string | null; getTemporaryConversationKey(): string; getComposer(): HTMLElement | null; readComposerText(): string;
  setComposerText(text: string): Promise<ComposerInsertionResult>; clearComposer(): Promise<void>; verifyComposerText(expectedText: string): boolean;
  clickSend(): Promise<boolean>; canSend(): boolean; isBusy(): boolean; isReadyForNextMessage(): boolean; hasError(): boolean; getErrorReason(): string | null;
  getSnapshot(): ProviderSnapshot; getDiagnostics(): ProviderDiagnostics; isComposerEventTarget(target: EventTarget | null): boolean;
  classifyControlAction(target: EventTarget | null): 'send' | 'stop' | null; observe(callback: () => void): () => void; dispose(): void;
}
