# Phase 3 manual testing

Build and load `dist` from `chrome://extensions` with Developer mode. Run the general matrix separately for **Grok, Kimi, Perplexity, Z.ai, Sakana Chat, and LongCat AI**. Keep Debug mode on for selector/stability checks.

## Permission and activation

- [ ] Confirm every Phase 3 provider starts disabled after a schema-v3 upgrade.
- [ ] Confirm Phase 2 enabled choices and queues survived the upgrade.
- [ ] Click Enable and verify Chrome requests only that provider's exact origin set.
- [ ] Deny once and confirm no enabled state or dynamic script is created.
- [ ] Grant access, reload if prompted, and confirm the provider is recognized.
- [ ] Disable it and confirm execution/script registration stop while saved queues and permission remain.
- [ ] Restart Chrome with an enabled provider whose permission was removed; confirm reconciliation disables it.
- [ ] Confirm ChatGPT works with no optional permissions.

## Queue and conversation matrix

- [ ] Queue single-line, CRLF/LF multiline, indented code, and boundary-blank prompts while busy.
- [ ] Verify exact composer read-back before send and no HTML insertion.
- [ ] Edit, duplicate, reorder, delete, import, pause/resume, and confirm clear-all.
- [ ] Queue several prompts; verify one send per final stable answer and configured delay.
- [ ] Stop generation; verify the configured pause behavior and no automatic bypass.
- [ ] Trigger login, usage/rate/Pro limit, captcha, access, network, and provider errors where practical; verify fail-closed pause.
- [ ] Use a new-chat route, create the conversation, and verify one migration from the temporary key.
- [ ] Keep two conversations open and verify provider+conversation isolation.
- [ ] Open one conversation in two tabs; verify only the focused/visible leader sends.
- [ ] Close the leader and verify takeover after lease expiry without a duplicate send.
- [ ] Switch among ChatGPT, Phase 2 providers, and all enabled Phase 3 providers; verify queues never cross.

## Stability and diagnostics

- [ ] Confirm Debug diagnostics report composer, send, Stop, response control, and latest assistant presence.
- [ ] Confirm citation/source, thinking block, and tool/task panel booleans match visible provider UI.
- [ ] Verify changing assistant text keeps the scheduler busy.
- [ ] Verify changing citation/source/result-card content keeps the scheduler busy.
- [ ] Verify changing thinking/tool/task content keeps the scheduler busy.
- [ ] Verify stable but still-visible sources do not block forever after all active status/Stop signals clear.
- [ ] Click Copy diagnostics and inspect JSON: no prompt, assistant response, transcript, queue item, actual conversation ID, or temporary key may appear.
- [ ] Confirm localized words in ordinary completed assistant prose do not become status signals.

## Grok

- [ ] Test normal chat and `/chat/<id>` extraction on both Grok hosts.
- [ ] Exercise web search/X search, citations, result cards, and image generation if available.
- [ ] Verify every source/result change settles before the next prompt.
- [ ] Verify login, human verification, usage/rate-limit, and access-denied states pause.

## Kimi

- [ ] Test search, deep thinking, long-context response, and file analysis.
- [ ] Verify English and Chinese small status labels such as thinking/searching/analyzing/generating are detected.
- [ ] Verify file-analysis/tool panels settle before queue advancement.
- [ ] Repeat multiline insertion in both textarea and contenteditable UI variants if offered.

## Perplexity

- [ ] Test `/search/<id>` and any observed `/page/<id>` route.
- [ ] Verify source/citation cards finish populating before the follow-up composer sends.
- [ ] Test normal and Pro search modes if available.
- [ ] Verify Pro/usage limits pause without retries or bypass.

## Z.ai

- [ ] Test both `/chat/<id>` and `/c/<id>` routes across all three declared hosts.
- [ ] Exercise search, code, tool calls, and multi-step tasks.
- [ ] Verify English and Chinese small status labels are detected.
- [ ] Verify active tools/tasks and source changes settle before send.

## Sakana Chat

- [ ] Test `/chat/<id>`, normal response, search/tool states if available, and exact multiline insertion.
- [ ] Verify English and Japanese thinking/searching/analyzing/generating labels are detected.
- [ ] Verify Japanese text inside a completed assistant answer does not act as a status indicator.

## LongCat AI

- [ ] Test all four declared hosts and `/chat/<id>` extraction.
- [ ] Exercise coding-agent, tool, code, terminal, and multi-step task progress modes.
- [ ] Verify terminal/task activity keeps the queue waiting until stable.
- [ ] Trigger a tool/terminal failure if safely available and confirm the queue pauses.

## Lifecycle and memory

- [ ] Navigate at least 50 SPA routes per provider and verify one active adapter/observer/scheduler.
- [ ] Enable/disable providers repeatedly and verify no duplicate content scripts or listeners.
- [ ] Run a 20–30 minute sequential-send soak with route and tab changes.
- [ ] Watch Chrome Task Manager for monotonic extension/page memory growth.
- [ ] Verify no duplicate sends, duplicate toasts, stale leaders, retained panels, or out-of-memory crash.
