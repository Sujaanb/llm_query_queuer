import type { ProviderDiagnostics, SchedulerState } from './types';
export function createSafeDiagnosticCopy(diagnostics: ProviderDiagnostics, leader: boolean, scheduler?: SchedulerState) {
  return {
    provider: { id: diagnostics.providerId, name: diagnostics.providerName, url: diagnostics.url, conversationType: diagnostics.conversationId ? 'persistent' : 'temporary' },
    selectors: { composer: diagnostics.composerFound, send: diagnostics.sendButtonFound, stop: diagnostics.stopButtonFound, responseControl: diagnostics.regenerateButtonFound, assistant: diagnostics.latestAssistantMessageFound, citationOrSource: diagnostics.citationSourceRegionFound, thinking: diagnostics.thinkingBlockFound, toolOrTask: diagnostics.toolTaskPanelFound },
    indicators: { busy: [...diagnostics.busyIndicators], ready: [...diagnostics.readyIndicators], errors: [...diagnostics.errorIndicators] },
    composer: { type: diagnostics.composerType, insertionStrategy: diagnostics.insertionStrategy },
    execution: { leader, scheduler: scheduler ?? 'unknown', lastCheckedAt: diagnostics.lastCheckedAt },
  };
}
