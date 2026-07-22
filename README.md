# ChatGPT Queue

ChatGPT Queue is a local-first Chrome Manifest V3 extension that lets you collect prompts while ChatGPT is working and sends them sequentially only after each response is complete. Queues are saved per conversation in `chrome.storage.local`.

## Install and build

```sh
npm install
npm test
npm run build
```

The production extension is created in `dist`.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `dist` folder.

The extension requests `tabs` so its side panel can identify the active ChatGPT tab and exchange status with that tab. Host access is limited to `chatgpt.com` and `chat.openai.com`.

## Use

Open a ChatGPT conversation and click the toolbar icon to open the side panel. Add prompts by typing while ChatGPT is busy, forcing a queue action, or importing a list. Reorder prompts with the drag handle; edit, duplicate, or delete with the item controls. Pause/resume and clear-all are in the header.

Default shortcuts:

- Enter: send normally while idle; queue while busy.
- Shift+Enter: newline.
- Windows/Linux Ctrl+Enter or macOS Cmd+Enter: force immediate send.
- Windows/Linux Alt+Enter or macOS Option+Enter: force queue.
- Windows/Linux Alt+Q or macOS Control+Q: open the queue panel.

Customize the panel shortcut at `chrome://extensions/shortcuts`.

## How scheduling works

The extension watches multiple ChatGPT controls, live status regions, busy flags, error banners, and assistant-text stability. A queued prompt is inserted only when ChatGPT is ready. After sending, the scheduler requires a busy phase followed by a stable ready phase and the configured delay before proceeding. A storage heartbeat elects one sender when the same conversation is open in multiple tabs. Stopping generation, a reported error, or a manual send while automation is active pauses the queue.

## Import

The import panel accepts JSON arrays, Python-style single- or double-quoted lists, trailing commas, escaped quotes, commas inside strings, and triple-quoted multiline strings. Plain text uses one non-empty line per prompt. Parsing is purpose-built and never executes input. Preview the result, then append it after the existing queue.

## Troubleshooting

- If the panel says to open ChatGPT, activate a tab at `https://chatgpt.com/` or `https://chat.openai.com/` and reopen it.
- If the queue pauses after a UI error, verify the composer and send button are present, then resume.
- Reload the extension after rebuilding.
- Inspect the ChatGPT tab console for `[ChatGPT Queue]` diagnostics.
- ChatGPT UI changes may require selector maintenance in `src/content/chatgpt-dom.ts`.

## Manual test checklist

- [ ] Load `dist` unpacked with no manifest errors.
- [ ] Toolbar click and configured command open the side panel.
- [ ] Light and dark system themes render clearly.
- [ ] Idle Enter sends; busy Enter queues and clears; Shift+Enter adds a newline.
- [ ] Force-send and force-queue shortcuts work on the current platform.
- [ ] Prompts send one at a time only after a busy-to-ready transition.
- [ ] Delay, stability, fallback, always-queue, toast, stop, and error settings persist.
- [ ] Edit, duplicate, delete, reorder, clear confirmation, pause, and resume work.
- [ ] Sending items cannot be dragged or deleted.
- [ ] Python/JSON/triple-quoted and line-based imports preview and append in order.
- [ ] Reloading preserves queues and conversation isolation.
- [ ] Two tabs on one conversation produce only one sender.
- [ ] Manual send, Stop generating, error, and rate-limit states pause automation with a toast.
- [ ] No prompts or transcript content leave the browser except through the ChatGPT composer.
