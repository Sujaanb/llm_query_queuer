# LM Query Queuer

LM Query Queuer is a local-first Chrome Manifest V3 extension that queues prompts while an AI chat is working and sends them one at a time after each response is complete. Queues persist per provider and conversation; prompt content is inserted only into the active provider composer and is never sent to an extension server.

## Phase 1 scope

Phase 1 fully enables ChatGPT at `https://chatgpt.com/*` and `https://chat.openai.com/*`. The provider registry contains disabled metadata for planned providers such as Gemini, Qwen, Claude, Grok, Kimi, Perplexity, Z.ai, MiniMax, HuggingChat, Aristotle, Mistral, Meta AI, Sakana, and LongCat. Those entries do not inject scripts, request host access, or run schedulers. See [PROVIDERS.md](PROVIDERS.md) for the extension path.

## Install, test, and build

Requirements: a current Node.js LTS release, npm, and Chrome with side-panel support.

```sh
npm install
npm test
npx tsc --noEmit
npm run build
```

The production extension is emitted to `dist` and contains the manifest, background worker, content script, side-panel HTML/assets, and bundled styles.

## Load the unpacked extension

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select this repository's `dist` folder.
6. Open ChatGPT and click the LM Query Queuer toolbar action.

The panel command defaults to Alt+Q on Windows/Linux and Control+Q on macOS. Customize it at `chrome://extensions/shortcuts`.

## Queueing and shortcuts

- Enter sends normally while ChatGPT is idle and queues while it is busy.
- Shift+Enter inserts a newline.
- Ctrl+Enter on Windows/Linux or Cmd+Enter on macOS forces an immediate send.
- Alt+Enter on Windows/Linux or Option+Enter on macOS forces queueing.
- **Always queue messages** makes ordinary Enter queue even while idle; force-send still wins.

A manual send, Stop generation (when enabled), or a provider error/rate limit pauses an active queue. Resume retries the top item; there is intentionally no separate retry action. The side panel supports stable-ID drag-and-drop ordering, immediate delete, confirmed clear-all, pause/resume, multiline edit, and duplicate-below-original.

## Scheduling and ChatGPT state

The ChatGPT adapter owns all selectors and working-state text patterns. It combines visible Stop controls, thinking/searching/browsing/analyzing/reasoning signals, `aria-busy`, bounded latest-assistant text stability, completion controls, composer readiness, and visible errors. It uses a 2-second stability delay and a guarded 15-second fallback by default. The provider-neutral scheduler sends only when the queue is active, the document is visible, the adapter is ready, no error exists, and the tab holds the conversation lease.

After a send is accepted, the scheduler waits for a busy phase, then a stable ready phase, then the configured send delay (3 seconds by default). An insertion or send failure keeps the item, marks it failed, pauses the queue, and shows a toast.

## Multiline prompts

CRLF, legacy CR, and Unicode line separators normalize to LF internally. The queue, import preview, editor, and UI preserve intentional line breaks, code indentation, and leading/trailing blank lines. Textarea composers use the native value setter plus a bubbling input event. Contenteditable composers try plain-text `execCommand`, a synthetic `text/plain` paste, then direct plain-text input events. Every strategy reads the composer back and requires an exact normalized match before sending. No HTML is inserted.

The safe import parser accepts JSON/Python-style quoted lists, single and double quotes, adjacent Python literals, trailing commas, escaped quotes, commas within strings, triple-quoted strings, and a non-empty line-by-line fallback. It never uses `eval` or `new Function`. Preview is required by the UI flow, and imported prompts append without disturbing the existing queue.

## Per-conversation queues and multi-tab leadership

Persistent schema v2 scopes queues and pause flags by provider ID and conversation key in `chrome.storage.local`. Different ChatGPT conversations are independent. Tabs showing the same conversation share one queue.

Tab context and leader leases live only in `chrome.storage.session`. The service worker serializes claims for each `provider:conversation` scope. A visible, focused tab is preferred; the leader heartbeats every 2 seconds, becomes stale after 6 seconds, and releases its lease on teardown. Hidden, closed, or stale leaders can be replaced. Non-leaders display the shared queue but never send. A new-chat queue uses a tab-specific temporary key and migrates by stable item ID when `/c/<conversationId>` appears, preventing duplication.

## Side-panel context

The service worker handles tab creation, update, activation, removal, and window focus. It enables tab-specific side-panel options only for supported ChatGPT URLs. If a previously open panel remains visible after a tab switch, its UI changes to:

> Open a supported AI chat website to use LM Query Queuer.

A recognized future provider shows ?This provider is planned but not enabled yet.? Unsupported pages never receive the content script and never run a scheduler.

Chrome does not expose a reliable API to forcibly close an already-open side panel in every tab/window transition. LM Query Queuer disables unsupported tab options where available and safely neuters any lingering panel with the unsupported state.

## Permissions, privacy, and security

- `storage`: persistent queues/settings and ephemeral session leases.
- `sidePanel`: queue UI.
- `tabs`: active-tab URL/context awareness, status messaging, tab cleanup, and tab-specific side-panel enablement.
- Host access is limited to `chatgpt.com` and `chat.openai.com`; future providers receive no Phase 1 access.

There are no cookies, `webRequest`, debugger, `<all_urls>`, analytics, remote code, CDN scripts, or external fonts. The extension does not scrape/store assistant responses or conversation transcripts. DOM monitoring retains only a capped length/tail signature of the latest assistant element, never the full conversation.

## Debug mode

Enable **Debug mode** in Settings and inspect the ChatGPT tab/service-worker consoles. Logs include provider/context metadata, tab and lease state, scheduler transitions, bounded busy/ready signals, insertion strategy and verification, send outcomes, and migration events. Prompt bodies and transcripts are not logged. The in-page debug buffer is capped at 200 entries and debug mode is off by default.

## Memory safety

The content script has a replace-on-reinjection singleton guard and a disposer for observers, listeners, timeouts, fallback intervals, leader heartbeats, DOM references, and toasts. SPA route changes dispose the old adapter/scheduler before initializing the new scope. The adapter has one debounced MutationObserver plus a 1.5-second fallback evaluation; the scheduler tick is 1 second. Storage settings writes are debounced, service-worker coordination has no persistent interval, toasts are capped at three with cleared timers, and the side panel skips polling while hidden.

## Troubleshooting

- **Panel says unsupported:** activate a ChatGPT tab and reopen the toolbar panel. If ChatGPT was open before installation/reload, reload that page so the content script can attach.
- **Reconnect message:** reload the extension at `chrome://extensions`, then reload ChatGPT.
- **Queue paused after failure:** inspect ChatGPT for an error/rate limit or UI change, then Resume to retry the same top item.
- **Shortcut does not fire:** check conflicts at `chrome://extensions/shortcuts`.
- **Build changed:** rebuild, then click the extension's Reload button at `chrome://extensions` and reload ChatGPT.
- **Selector diagnostics:** enable Debug mode; all ChatGPT DOM knowledge is in `src/content/providers/chatgpt.ts`.

## Manual test checklist

- [ ] 1. Run the build and load `dist` as an unpacked extension.
- [ ] 2. Open ChatGPT.
- [ ] 3. Open the side panel.
- [ ] 4. Verify the ChatGPT queue appears.
- [ ] 5. Open an unrelated website.
- [ ] 6. Verify the side panel is disabled or shows the unsupported state.
- [ ] 7. Return to ChatGPT.
- [ ] 8. While ChatGPT is busy, queue a single-line prompt with Enter.
- [ ] 9. Verify the prompt is queued and the composer clears.
- [ ] 10. Queue prompts containing two lines, multiple paragraphs, Windows CRLF, Unix LF, leading/trailing blank lines, code blocks, quotes, and commas.
- [ ] 11. Verify every multiline prompt and blank line is represented correctly.
- [ ] 12. Edit the multiline prompt in the textarea.
- [ ] 13. Verify its line breaks are preserved after saving.
- [ ] 14. Paste and preview a Python-style list containing single/double quotes, trailing commas, escaped quotes, commas, and triple-quoted multiline strings.
- [ ] 15. Add the import and verify it appends after existing prompts without reordering them.
- [ ] 16. Drag prompts to reorder and reload to verify the order persists.
- [ ] 17. Duplicate a prompt and verify the unique-ID copy appears immediately below it.
- [ ] 18. Delete an individual prompt and verify immediate removal.
- [ ] 19. Use Clear all, cancel once, then confirm and verify removal.
- [ ] 20. Pause and resume; verify Resume retries a failed/top item without a visible retry button.
- [ ] 21. Open two different ChatGPT conversations and queue different prompts.
- [ ] 22. Verify each conversation shows only its own persistent queue.
- [ ] 23. Open the same ChatGPT conversation in two tabs.
- [ ] 24. Verify only the visible/focused leader tab sends queued messages.
- [ ] 25. Close or hide the leader tab.
- [ ] 26. Verify another eligible tab takes over after lease expiry (no duplicate send).
- [ ] 27. Start on a new-chat URL, queue a prompt, submit/create the conversation, and verify temporary-queue migration without duplication or wrong-conversation sending.
- [ ] 28. Switch conversations at least 50 times while monitoring the ChatGPT process in Chrome Task Manager (Shift+Esc); verify observer/listener counts and memory do not continually climb.
- [ ] 29. Repeatedly queue, import, preview, edit, duplicate, reorder, delete, clear, pause, and resume while watching memory.
- [ ] 30. Run a 30-minute soak with multiple conversation switches and sequential sends; verify stable memory and no ?Aw, Snap! Out of Memory? crash.
