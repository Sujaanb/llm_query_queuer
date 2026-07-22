export function isMac(): boolean {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  return /mac/i.test(nav.userAgentData?.platform ?? navigator.platform ?? navigator.userAgent);
}

export function shortcutLabels() {
  return isMac()
    ? { forceSend: 'Cmd+Enter', forceQueue: 'Option+Enter', open: 'Control+Q' }
    : { forceSend: 'Ctrl+Enter', forceQueue: 'Alt+Enter', open: 'Alt+Q' };
}
