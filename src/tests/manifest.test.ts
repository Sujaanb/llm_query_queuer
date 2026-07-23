import { describe, expect, it } from 'vitest'; import { readFileSync } from 'node:fs';
const manifest = JSON.parse(readFileSync('public/manifest.json','utf8')); const phase4=['https://gemini.google.com/*','https://meta.ai/*','https://www.meta.ai/*','https://minimax.io/*','https://www.minimax.io/*','https://agent.minimax.io/*','https://www.agent.minimax.io/*','https://aristotle.science/*','https://www.aristotle.science/*','https://*.aristotle.science/*'];
describe('Phase 4 manifest permissions', () => {
  it('keeps only ChatGPT required and static', () => { expect(manifest.host_permissions).toEqual(['https://chatgpt.com/*','https://chat.openai.com/*']); expect(manifest.content_scripts).toHaveLength(1); expect(manifest.content_scripts[0].matches).toEqual(manifest.host_permissions); });
  it('adds the exact ten Phase 4 origins as optional', () => { expect(manifest.optional_host_permissions).toHaveLength(29); expect(manifest.optional_host_permissions.slice(-10)).toEqual(phase4); });
  it('does not request broad or sensitive permissions', () => expect(JSON.stringify(manifest)).not.toMatch(/<all_urls>|cookies|webRequest|debugger/));
  it('packages version 5', () => expect(manifest.version).toBe('5.0.0'));
});
