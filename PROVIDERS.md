# Provider extension guide

Phase 1 enables only ChatGPT. Future adapters must remain disabled until their host permission, automated tests, and manual validation ship together.

## Adapter contract

`src/content/providers/types.ts` defines `ProviderAdapter` and capability flags. An adapter supplies identity/matching metadata; conversation and temporary keys; composer lookup/read/write/clear/verification; send/readiness/busy/error behavior; control classification; one lifecycle-safe observer subscription; and complete disposal. The core scheduler calls only this interface and must never import provider selectors or text patterns.

## Add a provider

1. Create `src/content/providers/<provider>.ts` implementing `ProviderAdapter`.
2. Centralize every selector, working/error phrase, and DOM heuristic in that file.
3. Add enabled construction to `src/content/providers/registry.ts` only when the adapter is ready.
4. Change the matching metadata entry in `src/lib/providers.ts` from disabled to enabled.
5. Add the exact origin to `host_permissions` and the content-script `matches` in `public/manifest.json`. Prefer optional host permissions in a later permission-onboarding phase; never add `<all_urls>`.
6. Extend the `ProviderId` union and initialize its maps in schema defaults/migration.

Disabled metadata alone is safe: it provides a planned-provider panel label but receives no host access and creates no adapter or scheduler.

## Conversation identity

Extract a stable server conversation ID from the URL or provider state without reading transcript content. Return `null` until it exists. Use the tab-specific temporary key supplied by the content controller for new chats. On the SPA transition to a real ID, the controller disposes the old runtime and merges temporary items by stable ID. Never derive identity from a prompt or assistant response.

## Composer and multiline insertion

Support textarea and/or contenteditable composers as capabilities require. Normalize CRLF/CR to LF, but do not trim, collapse whitespace, or turn newlines into spaces. For textareas use the prototype native value setter and a bubbling `input` event. For contenteditable try plain-text `execCommand('insertText')`, a `DataTransfer`/`text/plain` paste event, then plain text nodes with `beforeinput`/`input`. Avoid HTML. If a provider absolutely requires HTML, sanitize all content and represent only line breaks?never interpolate prompt text as markup.

After each strategy, read the composer and compare the exact normalized text. Return the successful strategy. If every strategy fails, return failure; the scheduler will mark the item failed and pause.

## Busy and ready detection

Use the smallest stable combination of provider-owned signals:

- visible Stop/cancel/working controls;
- thinking, searching, browsing, analyzing, or reasoning status regions;
- `aria-busy` and disabled states;
- a bounded signature (length plus capped tail) for latest assistant-text change;
- response-complete/regenerate/copy controls;
- composer enabled state; and
- visible error/rate-limit banners.

Do not treat composer-enabled alone as ready. Require no busy/error signal and a stability delay; use the fallback timeout only when the composer is enabled, latest response is stable, and no busy/error signal exists.

## Observer and memory rules

Create at most one MutationObserver per adapter instance, debounce callbacks, and use no interval faster than 500 ms (the ChatGPT fallback is 1.5 seconds). Store no MutationRecords, DOM nodes, transcripts, or full long responses. Re-query elements, cap text signatures, and remove every observer/listener/timer in `dispose()`. The observer unsubscribe must not leave monitoring callbacks behind. Test at least 50 SPA conversation switches and a 30-minute Chrome Task Manager soak.

## Manual provider validation

Verify unsupported pages receive no injection; new and existing conversation IDs; temporary-key migration; single-line and boundary-blank multiline insertion; idle/busy/error detection; send acceptance; Stop/manual-send pause; two different conversations; the same conversation in two tabs; leader closure/takeover; side-panel provider label; imports/edits/reordering; reload persistence; route-switch cleanup; and the full memory soak. Add parser/queue tests only for shared changes and provider-focused unit/DOM tests for adapter behavior.
