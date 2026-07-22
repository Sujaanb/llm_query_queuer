import { normalizePromptText, promptTextMatches } from '../lib/text';
import { findComposer, findVisible, SELECTORS, visible } from './chatgpt-dom';

const INSERT_WAIT_MS = 1000;
const SEND_ACCEPT_WAIT_MS = 3000;

function composerTextCandidates(composer: HTMLTextAreaElement | HTMLElement): string[] {
  if (composer instanceof HTMLTextAreaElement) return [composer.value];
  return [composer.innerText, composer.textContent ?? ''];
}

function composerContains(composer: HTMLTextAreaElement | HTMLElement, expected: string): boolean {
  return composerTextCandidates(composer).some((value) => promptTextMatches(value, expected));
}

async function waitUntil(predicate: () => boolean, timeoutMs: number, intervalMs = 50): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  do {
    if (predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  } while (Date.now() < deadline);
  return predicate();
}

export function readComposer(): string {
  const composer = findComposer();
  if (composer instanceof HTMLTextAreaElement) return normalizePromptText(composer.value);
  return normalizePromptText(composer?.innerText ?? composer?.textContent ?? '');
}

function setTextarea(element: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(element, value);
  element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function selectComposerContents(composer: HTMLElement) {
  const selection = getSelection();
  const range = document.createRange();
  range.selectNodeContents(composer);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function replaceContentEditableWithPlainText(composer: HTMLElement, text: string) {
  composer.replaceChildren(document.createTextNode(text));
  composer.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    inputType: 'insertText',
    data: text,
  }));
}

export async function writeComposer(text: string): Promise<boolean> {
  const composer = findComposer();
  if (!composer) return false;
  const normalized = normalizePromptText(text);
  composer.focus();

  if (composer instanceof HTMLTextAreaElement) {
    setTextarea(composer, normalized);
  } else {
    selectComposerContents(composer);
    const inserted = document.execCommand?.('insertText', false, normalized) ?? false;
    if (!inserted) replaceContentEditableWithPlainText(composer, normalized);
  }

  if (await waitUntil(() => composerContains(composer, normalized), INSERT_WAIT_MS)) return true;

  // Some editor versions report execCommand success but do not reconcile the
  // resulting multiline DOM. Retry once using only a text node and InputEvent.
  if (!(composer instanceof HTMLTextAreaElement)) {
    replaceContentEditableWithPlainText(composer, normalized);
    return waitUntil(() => composerContains(composer, normalized), INSERT_WAIT_MS);
  }
  return false;
}

export function clearComposer(): void {
  const composer = findComposer();
  if (!composer) return;
  if (composer instanceof HTMLTextAreaElement) setTextarea(composer, '');
  else {
    composer.focus();
    selectComposerContents(composer);
    const deleted = document.execCommand?.('delete', false) ?? false;
    if (!deleted || composerTextCandidates(composer).some((value) => value.trim())) {
      composer.replaceChildren();
      composer.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward', data: null }));
    }
  }
}

async function waitForSendAcceptance(): Promise<boolean> {
  return waitUntil(
    () => !readComposer().trim() || Boolean(findVisible(SELECTORS.stop)),
    SEND_ACCEPT_WAIT_MS,
    75,
  );
}

export async function submitComposer(): Promise<boolean> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const button = findVisible(SELECTORS.send);
    if (button instanceof HTMLButtonElement && !button.disabled) {
      button.click();
      return waitForSendAcceptance();
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const form = findComposer()?.closest('form');
  const submit = form?.querySelector('button[type="submit"]');
  if (submit && visible(submit) && !(submit as HTMLButtonElement).disabled) {
    (submit as HTMLButtonElement).click();
    return waitForSendAcceptance();
  }
  return false;
}