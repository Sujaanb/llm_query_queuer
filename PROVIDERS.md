# Provider architecture and Phase 3 adapters

The core scheduler imports only `ProviderAdapter`. Shared DOM visibility, multiline insertion, bounded diagnostics, observer lifecycle, and readiness mechanics live under `src/content/providers/`; every selector registry, URL rule, and provider-specific busy/error phrase remains in its adapter file.

All Phase 2 and Phase 3 optional providers are disabled by default. The service worker requests their exact optional origins only after a side-panel Enable click, registers `assets/content.js` with `chrome.scripting.registerContentScripts`, and unregisters it on disable. ChatGPT remains the only static content script.

## Adapter contract

`types.ts` defines identity, capabilities, keyboard profile, conversation identity, composer read/write/verification, send controls, busy/ready/error state, diagnostics, observation, and disposal. `base.ts` provides the memory-safe state implementation. `composer.ts` normalizes CRLF/CR to LF and verifies every textarea/contenteditable strategy. `dom.ts` resolves fallback selectors and filters hidden or disabled elements.

Adapters retain only latest assistant length plus a capped 4,000-character tail and small capped fingerprints for recent citation/source/thinking/tool/task regions. Readiness waits for both response and auxiliary fingerprints to stabilize. Status matching applies NFKC/case/whitespace normalization only to small status regions. Diagnostics store labels and selector booleans, never prompt/assistant bodies, and cap item counts and label length.

## ChatGPT

- **ID / status:** `chatgpt`, built-in stable.
- **Origins:** required `https://chatgpt.com/*`, `https://chat.openai.com/*`.
- **Conversation URL:** `/c/<id>`; other routes use a provider/tab temporary key.
- **Selectors:** `#prompt-textarea`, textarea/contenteditable role fallbacks, ChatGPT test IDs and aria labels.
- **Busy:** Stop, thinking, searching, browsing, analyzing, reasoning, assistant text changing.
- **Ready:** no busy/error signal, stable assistant response, enabled composer, response/copy control or guarded fallback.
- **Errors:** status/alert regions for limits, failures, login, captcha, and unavailability.

## Claude

- **ID / status:** `claude`, optional beta.
- **Official website:** `https://claude.ai` (also `https://www.claude.ai`).
- **Optional origins:** `https://claude.ai/*`, `https://www.claude.ai/*`.
- **Conversation URLs:** `/chat/<id>`; `/new` and other paths are temporary.
- **Selector strategy:** Claude composer/test-ID candidates, Message-labelled contenteditable, textbox and textarea fallbacks; aria/test-ID send/Stop/copy controls; main assistant/status regions only.
- **Busy indicators:** thinking, reasoning, search/reading, analysis/working, tool use, artifact work, code execution, Stop, or changing main assistant text.
- **Ready indicators:** main assistant stable, Stop/working absent, composer editable, response/copy control or guarded fallback. Artifact panel activity is not used as a completion signal.
- **Errors:** main alert/login/usage regions for login, usage/message limit, quota, rate limit, captcha/Cloudflare, network, or service failures.
- **Multiline notes:** shared contenteditable-first fallbacks with exact read-back verification; textarea fallback remains available.
- **Caveats/manual notes:** validate analysis, artifact creation, tool/code work, and the final-answer boundary before enabling unattended queues.

## Qwen

- **ID / status:** `qwen`, optional beta.
- **Official website / origin:** `https://chat.qwen.ai`, optional `https://chat.qwen.ai/*`.
- **Conversation URLs:** `/chat/<id>`, with `/c/<id>` and `/conversation/<id>` defensive fallbacks; root is temporary.
- **Selector strategy:** prompt/chat IDs, composer test IDs, Ask/Message textareas, textbox fallback, semantic send/submit/Stop/retry controls.
- **Busy indicators:** thinking/generating, reasoning, search/reading, agent/tool/code/running/working, Stop, changing assistant text.
- **Ready indicators:** all working signals absent, assistant stable, composer editable, response control or guarded fallback.
- **Errors:** alert/limit regions for rate, usage/message limit, quota, login, captcha, network, or provider errors.
- **Multiline notes:** native textarea path is preferred when found; contenteditable uses shared verified fallbacks.
- **Caveats/manual notes:** validate thinking mode, web search, code generation, and agent-like workflows.

## Mistral / Vibe

- **ID / status:** `mistral`, optional beta.
- **Official website / origin:** `https://chat.mistral.ai/chat`, optional `https://chat.mistral.ai/*`.
- **Conversation URLs:** `/chat/<id>`; `/`, `/chat`, and other new-chat paths are temporary.
- **Selector strategy:** prompt/chat IDs, composer test IDs, Ask/Message textareas, textbox fallback, semantic send/Stop/regenerate/copy controls.
- **Busy indicators:** thinking/generating, reasoning, search/reading, agent/tool/code/running/multi-step work, Stop, changing assistant text.
- **Ready indicators:** no agent/work/Stop signal, stable final assistant response, enabled composer, response control or guarded fallback.
- **Errors:** alert/limit regions for usage, quota, login, captcha, network, rate limit, or provider failure.
- **Multiline notes:** shared verified textarea/contenteditable engine.
- **Caveats/manual notes:** Vibe agent/work mode can outlive visible text generation; validate its active-state labels and search/tool completion.

## HuggingChat

- **ID / status:** `huggingchat`, optional beta.
- **Official website / origin:** `https://huggingface.co/chat`, optional `https://huggingface.co/chat/*`.
- **Conversation URLs:** `/chat/<id>`; `/chat/` is temporary.
- **Selector strategy:** open chat-ui style `textarea[name="prompt"]`, prompt/chat IDs, form textarea, semantic send/submit and Stop/title fallbacks, assistant/prose candidates.
- **Busy indicators:** generating/thinking, working/running, search/reading, Stop, or changing assistant text.
- **Ready indicators:** generating/Stop absent, assistant stable, textarea enabled, response/retry/copy control or guarded fallback.
- **Errors:** alert/login regions for authentication, rate/usage limits, captcha/Cloudflare, network, or service errors.
- **Multiline notes:** native textarea value setter is preferred and exactly verified; contenteditable fallback remains safe.
- **Caveats/manual notes:** test model switching, Stop generation, and model-specific response controls.

## Grok

- **ID / status:** `grok`, optional Phase 3 beta.
- **Origins:** `https://grok.com/*`, `https://www.grok.com/*`.
- **Conversation URL:** `/chat/<id>`.
- **Busy/stability:** search and X/web-source work, thinking/reasoning, image generation, result cards, citations, Stop, and changing assistant/source/tool fingerprints.
- **Errors:** login, verification/captcha, access denied, usage/rate/quota, network, and provider failure.

## Kimi

- **ID / status:** `kimi`, optional Phase 3 beta.
- **Origins:** `https://kimi.com/*`, `https://www.kimi.com/*`.
- **Conversation URL:** `/chat/<id>`.
- **Busy/stability:** English/Chinese thinking, deep-thinking, searching, analyzing/file-analysis, generating, source panels, and assistant/auxiliary changes.
- **Errors:** English/Chinese login, frequency/usage limit, captcha/access, network, and provider failure.

## Perplexity

- **ID / status:** `perplexity`, optional Phase 3 beta.
- **Origins:** `https://perplexity.ai/*`, `https://www.perplexity.ai/*`.
- **Conversation URLs:** `/search/<id>` and observed `/page/<id>`; unmatched routes remain temporary.
- **Busy/stability:** search/browse/read/synthesize states and changing answer, source, citation, or result-card fingerprints. A visible stable source panel does not block forever.
- **Errors:** Pro/usage/rate/quota limits, login, verification/access, network, and provider failure.

## Z.ai

- **ID / status:** `zai`, optional Phase 3 beta.
- **Origins:** `https://chat.z.ai/*`, `https://z.ai/*`, `https://www.z.ai/*`.
- **Conversation URLs:** `/chat/<id>`, `/c/<id>`.
- **Busy/stability:** English/Chinese search, thinking, analysis, generation, code/tool/multi-step panels, citations, Stop, and assistant/auxiliary changes.
- **Errors:** English/Chinese login, frequency/usage limit, captcha/access, network, and provider failure.

## Sakana Chat

- **ID / status:** `sakana`, optional Phase 3 beta.
- **Origin:** `https://chat.sakana.ai/*`.
- **Conversation URL:** `/chat/<id>`.
- **Busy/stability:** English/Japanese thinking, searching, analyzing, generating/answering, tool/source regions, Stop, and bounded response/auxiliary changes.
- **Errors:** English/Japanese login, usage limit, authentication/captcha, network, and provider failure.

## LongCat AI

- **ID / status:** `longcat`, optional Phase 3 beta.
- **Origins:** `https://longcat.ai/*`, `https://www.longcat.ai/*`, `https://longcat.chat/*`, `https://www.longcat.chat/*`.
- **Conversation URL:** `/chat/<id>`.
- **Busy/stability:** coding agent, code/tool calls, terminal execution, multi-step task progress, search/reasoning/generation, Stop, and assistant/tool/task changes.
- **Errors:** login, usage/rate/quota, verification/access, tool/terminal failure, network, and provider failure.

## Adding a later provider

Create a provider-owned adapter/config, export conversation extraction for tests, add disabled metadata, extend the provider union/default maps only when implementation ships, add exact optional origins, add construction to `registry.ts`, and extend permission/URL/selector/diagnostics tests. Never add `<all_urls>`, transcript scanning, remote code, or provider phrases/selectors to the scheduler.

Manually verify new chat migration, multiline boundary blanks, login/error behavior, two conversations, two tabs of one conversation, leader takeover, 50 SPA route changes, and a 20-30 minute Chrome Task Manager soak. Every adapter must disconnect its observer, clear timers/listeners, clear references, and allow its scheduler/leader to dispose.
