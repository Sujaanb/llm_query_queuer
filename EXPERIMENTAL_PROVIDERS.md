# Experimental providers

Gemini, Meta AI, MiniMax AI, and Aristotle are experimental because their chat shells may be login-gated, region-restricted, invite/access-dependent, agent-oriented, or frequently redesigned. Enable only the sites and accounts you intend to use, supervise initial queue runs, and keep the queue paused during account or access flows.

## Safe selector overrides

Selector overrides are a debug-only recovery tool, not an automation bypass. Enable Debug mode on the provider, paste a JSON object into **Advanced selector overrides**, and save. Allowed keys are `composer`, `send`, `stop`, `regenerate`, `assistant`, `status`, `errors`, `citations`, `thinking`, `tools`, `terminal`, and `auxiliary`.

Values may be a CSS selector string or array of strings. Overrides are local, validated, and placed before built-in fallbacks. JavaScript, remote/data URLs, markup, unknown keys, non-string values, and invalid CSS are rejected. Use narrow semantic/test-ID/aria selectors. Never use a broad status selector that includes full assistant messages. Use **Reset provider** if a selector causes false detection.

## Collecting diagnostics

Turn on Debug mode, reload the provider, and inspect the diagnostics panel. Use **Highlight detected elements** to check composer/control matches for five seconds. Use **Copy effective selectors** when comparing defaults and overrides. Use **Copy diagnostics** for a content-safe report; it contains selector booleans and short labels but no prompt, answer, transcript, queue, or actual conversation key.

When reporting a selector issue, include provider/version, URL route shape without private IDs, locale, whether login/access is complete, copied diagnostics, copied effective selectors, and which outlined element was wrong. Do not include account data or conversation text.

## Avoiding automation risk

Do not use the extension to bypass provider safeguards or run unattended high-volume automation. It never accepts consent, completes login, solves captcha, handles verification, evades regional/access restrictions, or retries rate limits. Provider terms and account limits still apply.

Pause manually before changing accounts, opening cookie/account recovery flows, uploading sensitive files, or tuning selectors. If diagnostics show uncertainty or an error, leave the queue paused, resolve the provider UI yourself, verify selectors, then resume.
