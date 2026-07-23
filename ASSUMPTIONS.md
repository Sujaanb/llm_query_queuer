# Assumptions

- Chrome supports Manifest V3 side panels, `chrome.storage.session`, optional host permissions, and persistent dynamic content-script registration.
- ChatGPT remains static; every optional provider uses the shared compiled bundle but constructs exactly one enabled URL-matched adapter.
- Phase 4 provider IDs are `gemini`, `metaai`, `minimax`, and `aristotle`; no providers beyond the final 15 are included.
- Current provider variants expose top-level textarea/contenteditable composers and semantic/test-ID/aria fallbacks. No observed variant required `allFrames`; cross-origin frames are out of scope.
- Schema-v4 maps contain the 11 Phase 1–3 providers. Schema-v5 migration fills four empty Phase 4 maps and false enablement while preserving all recognized earlier data.
- Missing URL conversation IDs mean a provider+tab temporary key until a supported path appears.
- Phase 4 default timings apply only while the related global setting remains at its shipped default; explicit user timing changes override them.
- Small status/banner regions expose working and failure labels. Full assistant bodies are not searched for localized statuses by default.
- Source, tool, task, thinking, terminal, and output regions may remain visible after completion; changes delay readiness, permanent stable presence does not.
- Selector overrides are intended for Phase 4 diagnostics and are disabled by absence. They are local CSS strings, never executable code.
- A 1,000-item import can be accepted only through an explicit user confirmation; direct in-page queueing fails closed at that limit.
- Aristotle access and its authenticated app shell may not be publicly available; landing-page diagnostics and fail-closed behavior are considered valid without access.
