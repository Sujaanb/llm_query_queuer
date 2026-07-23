# Provider architecture and complete provider adapters

The core scheduler imports only `ProviderAdapter`. Shared DOM visibility, multiline insertion, bounded diagnostics, observer lifecycle, and readiness mechanics live under `src/content/providers/`; every selector registry, URL rule, and provider-specific busy/error phrase remains in its adapter file.

All Phase 2, Phase 3, and Phase 4 optional providers are disabled by default. The service worker requests their exact optional origins only after a side-panel Enable click, registers `assets/content.js` with `chrome.scripting.registerContentScripts`, and unregisters it on disable. ChatGPT remains the only static content script.

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

## Gemini

- **ID/status:** `gemini`, optional experimental.
- **Website/origin:** `https://gemini.google.com`, optional `https://gemini.google.com/*`.
- **Conversation URLs:** `/app/<id>`, `/u/<index>/app/<id>`, `/chat/<id>`; root is temporary.
- **Selectors:** rich-textarea/QL/contenteditable fallbacks, semantic send/Stop/copy/regenerate controls, model-response candidates, bounded status and account/error regions.
- **Busy/ready:** thinking, search, generation, extensions, tools, images, workspace activity, Stop, and changing answer/source/tool fingerprints; ready requires stability, an editable composer, no error, and a response control or guarded fallback.
- **Errors:** login, account chooser, consent, verification/captcha, region/access, rate/quota, network, unavailable.
- **Multiline/localization:** shared verified textarea/contenteditable plain-text insertion; current status patterns are English.
- **Experimental/manual:** Google account UI is never touched. Test search, image, extension, consent, and account variants.

## Meta AI

- **ID/status:** `metaai`, optional experimental.
- **Websites/origins:** `https://meta.ai`, `https://www.meta.ai`.
- **Conversation URLs:** `/chat/<id>`, `/messages/<id>`; root is temporary.
- **Selectors:** contenteditable/textarea composer fallbacks, semantic controls, assistant/response candidates, bounded status/login/cookie/consent/error regions.
- **Busy/ready:** thinking, searching, responding, creating images, tools, Stop, and changing response/source/tool fingerprints.
- **Errors:** login/recovery, cookie consent, captcha/verification, region/access, rate/quota, network, unavailable.
- **Multiline/localization:** shared verified plain-text insertion; current status patterns are English.
- **Experimental/manual:** never accepts cookies or operates account controls. Region/account variants require live testing.

## MiniMax AI

- **ID/status:** `minimax`, optional experimental.
- **Websites/origins:** root/`www` and agent/`www.agent` variants of `minimax.io`.
- **Conversation URLs:** `/chat/<id>`, `/agent/<id>`, `/task/<id>`; roots are temporary.
- **Selectors:** prompt/composer fallbacks, English/Chinese controls, assistant regions, planning/task/file/tool/terminal/output/source trackers.
- **Busy/ready:** English/Chinese thinking, searching, planning, executing, analyzing, generating, file processing, task/tool/terminal changes, and Stop.
- **Errors:** English/Chinese login, captcha, access, limits/quota, task/tool failure, network, unavailable.
- **Multiline/localization:** verified plain-text insertion; NFKC small-status matching covers English and Chinese.
- **Experimental/manual:** long-horizon tasks can outlive visible answer text; validate each agent tier and task mode.

## Aristotle

- **ID/status:** `aristotle`, optional experimental and access-dependent.
- **Website/origins:** root, `www`, and wildcard subdomains of `aristotle.science`.
- **Conversation URLs:** `/chat/<id>`, `/conversation/<id>`, `/thread/<id>`, `/research/<id>`; other routes are temporary.
- **Selectors:** scientific-chat composer/control fallbacks plus research progress, citations/references, reasoning, document/file/tool, terminal/output, invite/access/verification regions.
- **Busy/ready:** thinking, research/search, document reading, citations, reasoning, tools, file analysis, Stop, and changing auxiliary fingerprints.
- **Errors:** verified-researcher/invite/login/access gates, verification/captcha, region, limits/quota, network, unavailable.
- **Multiline/localization:** shared verified plain-text insertion; current status patterns are English.
- **Experimental/manual:** authenticated DOM is not publicly stable. Landing-page fail-closed diagnostics are expected without access.

## Experimental selector system

Phase 4 adapters accept validated local selector overrides. Allowed lists merge ahead of defaults; guarded queries ignore invalid selectors. Debug highlighting temporarily outlines composer/send/Stop/response controls and restores styles after five seconds or disposal. See `EXPERIMENTAL_PROVIDERS.md`.

## Maintenance rules

Create a provider-owned adapter/config, export conversation extraction for tests, add disabled metadata, extend the provider union/default maps only when implementation ships, add exact optional origins, add construction to `registry.ts`, and extend permission/URL/selector/diagnostics tests. Never add `<all_urls>`, transcript scanning, remote code, or provider phrases/selectors to the scheduler.

Manually verify new chat migration, multiline boundary blanks, login/error behavior, two conversations, two tabs of one conversation, leader takeover, 50 SPA route changes, and a 20-30 minute Chrome Task Manager soak. Every adapter must disconnect its observer, clear timers/listeners, clear references, and allow its scheduler/leader to dispose.
