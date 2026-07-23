# LM Query Queuer

LM Query Queuer is a local-first Chrome Manifest V3 extension that queues prompts while an AI chat is working and sends them sequentially only after response, source, and tool activity is stable.

## Supported providers

- **Built-in stable:** ChatGPT.
- **Phase 2 optional beta:** Claude, Qwen, Mistral/Vibe, HuggingChat.
- **Phase 3 optional beta:** Grok, Kimi, Perplexity, Z.ai, Sakana Chat, LongCat AI.
- **Phase 4 optional experimental:** Gemini, Meta AI, MiniMax AI, Aristotle.

All optional providers are disabled by default. Phase 4 providers are conservative and may require manual selector tuning. Aristotle is additionally access-dependent.

## Install, test, build, and load

```sh
npm install
npm test
npx tsc --noEmit
npm run build
```

Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select this repository's `dist` folder. Rebuild and reload after source changes. Configure the Alt+Q shortcut at `chrome://extensions/shortcuts`.

## Enabling Phase 4 providers

Open the side panel on a matching site, expand **Providers**, and click **Enable**:

- Gemini requests only `https://gemini.google.com/*`.
- Meta AI requests only `https://meta.ai/*` and `https://www.meta.ai/*`.
- MiniMax requests only its `minimax.io` and `agent.minimax.io` host variants.
- Aristotle requests its root, `www`, and wildcard `aristotle.science` subdomains.

Chrome permission requests occur directly from the Enable click. The service worker verifies the grant, saves enabled state, and dynamically registers the shared content script only for that provider. If immediate activation fails, reload the page. Disabling unregisters execution and clears ephemeral tab/leader state while retaining local queues and the Chrome permission. A retained permission never re-enables a provider; startup reconciliation disables enabled state when permission is missing.

Required host access remains limited to ChatGPT. The `tabs` permission is used for active-tab side-panel context, messaging, dynamic activation, and tab cleanup. The extension does not request cookies, `webRequest`, debugger, `<all_urls>`, remote code, analytics, or external fonts.

## Experimental behavior

Phase 4 defaults are a 5-second post-ready send delay, 3.5-second stability interval, and 30-second fallback timeout. If the user changes the corresponding global setting, that explicit setting wins. Experimental adapters track bounded fingerprints for the latest answer and provider-specific citation, thinking, tool, task, terminal, output, or file-processing regions. They never retain full answers or source lists.

When an experimental page remains uncertain—such as a missing composer—the queue waits through the conservative timeout and then pauses with **Provider state uncertain. Queue paused.** Login, consent, captcha, verification, invite, region, access, quota, rate-limit, network, and provider errors pause without attempting a bypass.

## Queue behavior and limits

Enter queues while busy and sends normally while idle. Shift+Enter inserts a newline; Ctrl/Cmd+Enter forces send; Alt/Option+Enter forces queue. **Always queue messages** queues ordinary Enter even while idle.

A warning appears above 500 queued items. Direct page queueing refuses to grow beyond 1,000 items. Bulk imports that would exceed 1,000 require explicit confirmation. Long queue cards and import previews are collapsed/truncated visually while the full prompt remains in local storage.

## Multiline prompts

CRLF and CR normalize to LF. Textareas use the native value setter and input events. Contenteditable composers use verified plain-text insertion fallbacks. Every strategy reads the composer back and requires an exact normalized match before send. HTML is not inserted.

## Conversations and multi-tab leadership

Schema v5 stores queues and pause flags by provider and conversation in `chrome.storage.local`; selector overrides are also local. Migration preserves Phase 1–3 queues, settings, pause state, and provider enablement. New chats use provider+tab temporary keys and migrate once a stable URL ID appears under a session migration lock.

Leader leases live in `chrome.storage.session` and are scoped to provider+conversation. Only one eligible tab sends. Visible focused tabs outrank hidden tabs, stale leaders expire, and different providers or conversations never share queues.

## Debug diagnostics, overrides, and highlighting

Enable **Debug mode** to see selector matches, assistant/source/thinking/tool/task/terminal presence, bounded busy/ready/error labels, uncertainty, insertion strategy, scheduler state, leader state, experimental status, and active override keys.

For Phase 4 providers, **Advanced selector overrides** accepts JSON containing only allowed selector keys and CSS selector strings/arrays. Unsafe URLs/code, unknown keys, non-string values, invalid JSON, and invalid CSS are rejected. Overrides take priority over defaults. **Reset provider** restores defaults; **Copy effective selectors** copies the merged registry.

**Highlight detected elements** outlines the detected composer/send/Stop/response controls without changing layout and restores styles after five seconds or on navigation/disposal. **Copy diagnostics** omits prompt text, answers, transcripts, queue contents, and actual conversation keys.

## Privacy and limitations

All data stays local and queued prompts are inserted only into the selected provider composer. The extension does not interact with account, cookie-consent, verification, captcha, invite, or restriction controls. Provider DOMs vary by experiment, account, language, model, and region, so live validation in `PHASE2_TESTING.md`, `PHASE3_TESTING.md`, and `PHASE4_TESTING.md` remains required.

Known implementations use top-level DOM. Same-origin iframe variants may need future `allFrames` registration and frame leadership work; cross-origin frames are never bypassed. See `EXPERIMENTAL_PROVIDERS.md`, `PROVIDERS.md`, `ASSUMPTIONS.md`, and `KNOWN_ISSUES.md`.
