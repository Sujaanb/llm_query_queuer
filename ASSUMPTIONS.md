# Assumptions

- Chrome's current Manifest V3 side-panel and `chrome.storage.session` APIs are available; the build targets Chrome rather than Firefox/Safari.
- ChatGPT may use either a textarea or a contenteditable composer, so both plain-text insertion paths remain active.
- A temporary new-chat queue is intentionally tab-scoped until ChatGPT exposes `/c/<conversationId>`; two unrelated new-chat tabs therefore cannot share or misroute that temporary queue.
- The existing `tabs` permission is retained because active-tab URL inspection, tab lifecycle cleanup, status messaging, and tab-specific side-panel configuration require it. Host access stays limited to ChatGPT.
- Chrome can reject or retain a side panel in some user-gesture/tab-transition cases; the extension disables unsupported tab options and provides a safe unsupported UI when forced closure is unavailable.
- Visible and focused tabs are eligible to preempt a hidden/unfocused leader; otherwise a live lease remains stable until it becomes stale after 6 seconds.
- Queue mutation uses the requested schema-v2 nested objects in local storage. Sending is serialized by the session leader; simultaneous side-panel edits resolve according to Chrome storage event order.
