# Assumptions

- Chrome supports Manifest V3 side panels, `chrome.storage.session`, optional host permissions, and persistent dynamic content-script registration.
- ChatGPT remains statically registered. Phase 2 and Phase 3 providers share one compiled content bundle, but URL matching constructs exactly one enabled provider-owned adapter.
- Optional permission requests run directly in the side-panel Enable handler; the service worker verifies the grant before registration.
- Disabling retains local queues and Chrome origin permission. Permission alone never implies enabled state.
- Schema-v3 provider maps may omit all Phase 3 IDs; schema-v4 migration fills them with empty maps/false enablement while retaining all recognized Phase 2 values.
- The documented conversation URL patterns are stable enough to key queues. Any unmatched/new route uses a provider- and tab-scoped temporary key until a persistent ID appears.
- English/Chinese/Japanese status text is exposed in small provider status, live, progress, or labelled regions. Assistant bodies are not status regions.
- Bounded assistant and auxiliary-region stability, combined with absence of Stop/error/provider-owned busy signals, is authoritative. Composer editability alone is not completion.
- Citation/source panels may remain visible after completion; their changes—not permanent presence—delay readiness.
- Known provider variants use top-level DOM. Cross-origin frames are not inspected; no security boundary is bypassed.
- Provider DOMs, experiments, model tiers, and localized labels can change, so all optional adapters remain beta until live matrices pass across representative accounts.
- A focused visible tab may preempt a hidden leader; otherwise a live provider+conversation lease remains stable until its six-second expiry.
