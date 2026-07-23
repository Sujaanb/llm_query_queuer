# Phase 4 manual testing

Build and load `dist` from `chrome://extensions`. Run the general matrix independently for Gemini, Meta AI, MiniMax AI, and Aristotle. Keep Debug mode enabled for selector and stability validation.

## General provider matrix

- [ ] 1. Confirm the provider starts disabled and carries an experimental badge.
- [ ] 2. Click Enable and verify only its documented origins are requested.
- [ ] 3. Deny once; verify no enabled state or dynamic script is created.
- [ ] 4. Grant permission, reload if instructed, and verify recognition.
- [ ] 5. Verify conversation ID or provider+tab temporary key.
- [ ] 6. Queue a single-line prompt while busy; verify the composer clears.
- [ ] 7. Queue CRLF/LF multiline, indented code, and boundary-blank prompts.
- [ ] 8. Verify exact line preservation in queue, edit dialog, and composer.
- [ ] 9. Preview/import Python and JSON lists; verify append order.
- [ ] 10. Grow a test queue past 500 and verify a warning.
- [ ] 11. Attempt an import past 1,000; cancel once and confirm once.
- [ ] 12. Reorder, edit, duplicate, and delete prompts.
- [ ] 13. Cancel and then confirm Clear all.
- [ ] 14. Pause/resume and retry a failed first item.
- [ ] 15. Queue multiple prompts and verify one-at-a-time sends.
- [ ] 16. Verify the 3.5-second stability and 5-second send-delay defaults.
- [ ] 17. Verify no send during thinking/search/tool/task/terminal/source changes.
- [ ] 18. Verify stable persistent source/tool panels do not block forever.
- [ ] 19. Remove the composer/visit a landing route; verify uncertainty pauses after the conservative timeout.
- [ ] 20. Trigger an available login/limit/error state; verify error pause and no bypass.
- [ ] 21. Create a new chat; verify temporary queue migration exactly once.
- [ ] 22. Open two conversations; verify isolated queues.
- [ ] 23. Open one conversation in two tabs/windows; verify one leader sends.
- [ ] 24. Hide/close the leader; verify safe takeover without duplication.
- [ ] 25. Switch among all phase providers and unsupported tabs; verify active-tab context.
- [ ] 26. Disable the provider; verify execution stops and queues remain.
- [ ] 27. Remove permission and restart; verify stale enabled state is disabled.
- [ ] 28. Save a valid selector override; verify adapter reload and priority.
- [ ] 29. Enter invalid JSON/CSS/URL/code; verify clear rejection and no crash.
- [ ] 30. Copy effective selectors, reset provider, and verify defaults return.
- [ ] 31. Highlight elements; verify outlines disappear after five seconds/navigation.
- [ ] 32. Copy diagnostics; verify no prompt, answer, transcript, actual conversation key, or queue item appears.
- [ ] 33. Navigate at least 50 SPA routes and check for one adapter/observer/scheduler.
- [ ] 34. Run a 20-minute soak and monitor Chrome Task Manager.
- [ ] 35. Verify no duplicate sends/listeners/toasts, stale outlines, memory growth, or out-of-memory crash.

## Gemini

- [ ] Test root temporary context, `/app/<id>`, `/u/0/app/<id>`, and `/chat/<id>`.
- [ ] Test normal chat, search, image generation, extensions/tools, and workspace states if available.
- [ ] Verify account chooser, Google login, consent, and verification screens pause safely without interaction.
- [ ] Verify final answer, sources, and tools stabilize before the next send.

## Meta AI

- [ ] Test root temporary context, `/chat/<id>`, and `/messages/<id>`.
- [ ] Test normal chat, search, and image creation if available.
- [ ] Verify login, cookie consent, account recovery, region restriction, and verification screens pause safely.
- [ ] Confirm the extension never accepts cookies or operates account controls.

## MiniMax AI

- [ ] Test root, `/chat/<id>`, `/agent/<id>`, and `/task/<id>` across root/agent hosts.
- [ ] Test normal chat, agent planning, multi-step task, file processing, tools, and terminal/output panels.
- [ ] Verify English and Chinese thinking/searching/planning/executing/generating statuses.
- [ ] Verify tool/task/file progress completes and stabilizes before send.
- [ ] Verify quota/rate/task/tool errors pause.

## Aristotle

- [ ] Test root and any landing/app subdomain diagnostics.
- [ ] Verify the access-dependent badge and warning.
- [ ] If access exists, test `/chat`, `/conversation`, `/thread`, and `/research` IDs.
- [ ] Test scientific query, citations, document analysis, reasoning, and tools if available.
- [ ] Verify invite, researcher verification, login, and access-restriction screens pause.
- [ ] Without access, verify diagnostics remain bounded and queue execution fails closed.
