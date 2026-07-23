import { describe, expect, it } from 'vitest'; import { readFileSync } from 'node:fs';
const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf8'));
const phase3 = ['https://grok.com/*', 'https://www.grok.com/*', 'https://kimi.com/*', 'https://www.kimi.com/*', 'https://perplexity.ai/*', 'https://www.perplexity.ai/*', 'https://chat.z.ai/*', 'https://z.ai/*', 'https://www.z.ai/*', 'https://chat.sakana.ai/*', 'https://longcat.ai/*', 'https://www.longcat.ai/*', 'https://longcat.chat/*', 'https://www.longcat.chat/*'];
describe('Phase 3 manifest permissions', () => {
  it('keeps only ChatGPT as required host access and static content script', () => { expect(manifest.host_permissions).toEqual(['https://chatgpt.com/*', 'https://chat.openai.com/*']); expect(manifest.content_scripts).toHaveLength(1); expect(manifest.content_scripts[0].matches).toEqual(manifest.host_permissions); });
  it('declares the exact Phase 3 origins in optional access', () => { expect(manifest.optional_host_permissions).toHaveLength(19); expect(manifest.optional_host_permissions.slice(-14)).toEqual(phase3); });
  it('keeps Phase 4 providers out of permissions', () => expect(JSON.stringify(manifest.optional_host_permissions)).not.toMatch(/gemini|meta\.ai|minimax|aristotle/));
  it('uses scripting without broad or sensitive permissions', () => { expect(manifest.permissions).toContain('scripting'); expect(JSON.stringify(manifest)).not.toMatch(/<all_urls>|cookies|webRequest|debugger/); });
});
