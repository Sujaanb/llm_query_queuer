# Phase 2 manual testing

Build and load `dist` from `chrome://extensions` with Developer mode. Run the following **for Claude, Qwen, Mistral, and HuggingChat individually**.

## General provider matrix

- [ ] 1. Confirm the provider starts disabled in the Providers section.
- [ ] 2. Click Enable and grant the exact optional origin permission.
- [ ] 3. Open or reload the provider website.
- [ ] 4. Verify the side panel recognizes the provider and shows beta/enabled status.
- [ ] 5. Verify a real conversation ID or provider/tab temporary key appears in Debug diagnostics.
- [ ] 6. While the provider is busy, queue a single-line prompt with Enter.
- [ ] 7. Verify the prompt queues, the composer clears, and a Shadow DOM toast appears.
- [ ] 8. Queue CRLF and LF multiline prompts with code, indentation, and boundary blank lines.
- [ ] 9. Verify every newline is preserved in the queue and provider composer.
- [ ] 10. Edit the multiline prompt in the textarea.
- [ ] 11. Verify line breaks remain exact after saving.
- [ ] 12. Preview and import a Python-style list with quotes, commas, trailing commas, and triple-quoted multiline strings.
- [ ] 13. Verify imported prompts append after existing items.
- [ ] 14. Drag prompts into a new order and reload to verify persistence.
- [ ] 15. Duplicate a prompt and verify the unique-ID copy appears immediately below it.
- [ ] 16. Delete one prompt and verify immediate removal.
- [ ] 17. Cancel Clear all once, then confirm it.
- [ ] 18. Pause and resume; verify Resume retries a failed/top item.
- [ ] 19. Queue multiple prompts and verify they send one by one.
- [ ] 20. Verify nothing sends during thinking, searching, reasoning, tool, agent, or generating activity.
- [ ] 21. Verify the next item waits for a stable final response and configured delay.
- [ ] 22. Open two conversations for the provider and queue distinct prompts.
- [ ] 23. Verify both queues remain independent across reloads.
- [ ] 24. Open the same conversation in two tabs/windows and queue prompts.
- [ ] 25. Verify only the visible/focused leader sends and the viewer never double-sends.
- [ ] 26. Close or hide the leader and verify takeover after lease expiry.
- [ ] 27. Queue on a new-chat URL, create the conversation, and verify migration without duplication or wrong routing.
- [ ] 28. Switch among ChatGPT and all enabled Phase 2 providers; verify active-tab context and queue isolation.
- [ ] 29. Disable the provider; verify execution stops, the disabled card appears, and saved queues remain.
- [ ] 30. Open Chrome Task Manager (Shift+Esc), switch at least 50 routes, and watch for monotonic extension/page memory growth.
- [ ] 31. Run a 20-minute soak for this provider with sequential sends and route/tab switches.
- [ ] 32. Verify no duplicate listeners/observers, duplicate sends, or Aw Snap out-of-memory crash.

## Claude-specific

- [ ] Generate an artifact and verify artifact/tool activity keeps the queue waiting.
- [ ] Exercise analysis/thinking and verify no premature send.
- [ ] Generate code or invoke a tool and verify the queue waits for the final main response.
- [ ] Trigger or observe a usage/login state and verify the queue pauses without bypass attempts.

## Qwen-specific

- [ ] Exercise thinking/reasoning mode.
- [ ] Exercise search mode if available.
- [ ] Generate code or run an agent workflow.
- [ ] Verify the next prompt waits for all search/agent indicators and final response stability.

## Mistral-specific

- [ ] Test normal chat.
- [ ] Test Vibe agent/work or multi-step mode if available.
- [ ] Test search/tool activity if available.
- [ ] Verify the queue waits until work mode and final response are complete.

## HuggingChat-specific

- [ ] Test normal textarea chat and exact multiline insertion.
- [ ] Switch models and repeat readiness checks.
- [ ] Click Stop generation and verify the configured pause behavior.
- [ ] Verify retry/response controls and final stability before the next send.

## Permission regression

- [ ] Deny an Enable request and verify the provider remains disabled with a clear message.
- [ ] Grant permission, disable the provider, and verify it does not silently re-enable.
- [ ] Remove permission at `chrome://extensions`, restart Chrome, and verify startup disables the stale enabled state.
- [ ] Confirm ChatGPT still works with no optional provider permissions granted.
