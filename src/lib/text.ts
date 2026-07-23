export function normalizePromptText(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/[\u2028\u2029]/g, '\n');
}

export function hasPromptContent(text: string): boolean {
  return normalizePromptText(text).trim().length > 0;
}

function normalizeComposerArtifacts(text: string): string {
  return normalizePromptText(text).replace(/\u00a0/g, ' ').replace(/[\u200b\ufeff]/g, '');
}

/** Verification never trims or collapses meaningful prompt whitespace. */
export function promptTextMatches(actual: string, expected: string): boolean {
  return normalizeComposerArtifacts(actual) === normalizeComposerArtifacts(expected);
}
