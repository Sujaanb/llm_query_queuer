# LM Query Queuer

LM Query Queuer is a local-first Chrome Manifest V3 extension that queues prompts while an AI chat is working, then sends them one at a time after the response and any source/tool activity are stable.

## Provider support

- **Built-in stable:** ChatGPT (`chatgpt.com`, `chat.openai.com`).
- **Phase 2 optional beta:** Claude, Qwen, Mistral/Vibe, and HuggingChat.
- **Phase 3 optional beta:** Grok, Kimi, Perplexity, Z.ai, Sakana Chat, and LongCat AI.
- **Phase 4 planned only:** Gemini, Meta AI, MiniMax AI, and Aristotle.science.

Every optional provider is disabled by default. Planned providers have metadata/UI entries but no adapter, optional permission, or runtime script.

## Install and verify

```sh
npm install
npm test
npx tsc --noEmit
npm run build
```

Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `dist`. Rebuild and reload the extension after source changes. Configure the Alt+Q (macOS Control+Q) panel command at `chrome://extensions/shortcuts`.

## Optional access

Open the side panel, find **Providers**, and click **Enable** for a provider. Chrome asks only for that provider's declared origins. The permission request runs directly from the click; the service worker independently verifies the grant before it saves enabled state or dynamically registers `assets/content.js`.

Phase 3 origins are:

- Grok: `grok.com`, `www.grok.com`
- Kimi: `kimi.com`, `www.kimi.com`
- Perplexity: `perplexity.ai`, `www.perplexity.ai`
- Z.ai: `chat.z.ai`, `z.ai`, `www.z.ai`
- Sakana Chat: `chat.sakana.ai`
- LongCat AI: `longcat.ai`, `www.longcat.ai`, `longcat.chat`, `www.longcat.chat`

If Chrome cannot inject into an already-loaded matching tab, reload it. Disabling unregisters the provider script and clears ephemeral tab/leader state while retaining saved queues and the Chrome permission. A retained permission never silently enables a provider. Startup reconciliation disables any provider whose saved enabled state no longer has permission.

Required host access remains limited to ChatGPT. The extension does not request `<all_urls>`, cookies, `webRequest`, debugger access, remote code, analytics, or external fonts.

## Queue behavior

Enter sends normally while the provider is idle and queues while it is busy. Shift+Enter inserts a newline. Ctrl+Enter (Windows/Linux) or Cmd+Enter (macOS) forces send. Alt/Option+Enter forces queueing. **Always queue messages** makes ordinary Enter queue even while idle.

The scheduler advances only when the tab is visible, owns the provider+conversation lease, has no error/login/rate-limit state, and the provider adapter reports ready. Phase 3 adapters wait for bounded fingerprints of the latest assistant response plus citation/source, thinking, tool, terminal, or task panels to remain stable. A merely enabled composer does not prove completion. Send failures keep and mark the first item failed and pause the queue; Resume retries it.

The panel supports drag-and-drop ordering, delete, confirmed clear-all, pause/resume, multiline edit, duplicate, Python/JSON list import, and preview.

## Storage, conversations, and tabs

Schema v4 stores queues and pause state by provider and conversation in `chrome.storage.local`. Migration preserves Phase 1 ChatGPT data and all Phase 2 schema-v3 queues, pause flags, settings, and enabled-provider choices; the six Phase 3 providers begin disabled.

New-chat routes use provider/tab temporary keys. When a stable conversation ID appears, a session migration lock merges stable item IDs into the persistent key without duplication. Tab context, leader leases, and migration locks live in `chrome.storage.session`. Leadership is scoped to provider+conversation; a focused visible tab may replace a hidden leader, and non-leaders never send.

## Readiness and localized status

Selectors and busy/error phrases live in each adapter, not the scheduler. Small status regions are Unicode-normalized with NFKC, whitespace-collapsed, and matched case-insensitively. Kimi and Z.ai include English/Chinese states; Sakana includes English/Japanese states. Full assistant bodies are never searched for localized status phrases.

Adapters retain only bounded change fingerprints: latest assistant length plus a capped tail, and small capped fingerprints for recent source/tool regions. They do not retain responses, transcripts, DOM snapshots, or MutationRecords. SPA navigation disposes the prior adapter, observer, scheduler, lease heartbeat, listeners, and timers.

## Debug diagnostics

Enable **Debug mode** to see provider identity, URL, conversation key, composer/control matches, assistant presence, citation/source presence, thinking/tool/task matches, bounded busy/ready/error labels, insertion strategy, leader state, and scheduler state.

**Copy diagnostics** exports only those bounded facts and a persistent/temporary conversation type. It omits actual conversation IDs, temporary keys, prompt text, assistant text, transcript content, and queue items.

## Troubleshooting

- Reload an optional provider tab after enabling if the panel says reconnect.
- If Chrome permission was removed, disable and enable the provider again.
- Resolve login, captcha, quota, rate-limit, Pro-limit, network, or provider error UI normally before resuming; the extension never bypasses it.
- Provider UIs change frequently. Debug diagnostics identify which bounded selector classes are missing.
- Same-origin embedded content can be supported by future selector updates; cross-origin frames are not inspected or bypassed.
- Run the live matrices in `PHASE2_TESTING.md` and `PHASE3_TESTING.md`, including tools/search and memory soak tests.

See `PROVIDERS.md`, `ASSUMPTIONS.md`, and `KNOWN_ISSUES.md` for adapter and beta details.
