# Known issues and experimental limitations

- Optional provider DOMs can change without notice. Phase 4 adapters deliberately fail closed; selector overrides may be needed after redesigns.
- Dynamic activation can fail for an already-loaded tab immediately after permission grant. Reloading activates the persisted registration.
- Gemini account chooser/consent, Meta regional/cookie/login screens, MiniMax agent tiers, and Aristotle access shells vary. The extension detects bounded banner regions where possible and never interacts with or bypasses them.
- Aristotle wildcard host permission supports possible app subdomains, but the actual authenticated host and DOM remain access-dependent.
- Known implementations use top-level DOM. Same-origin iframe variants would need validated frame registration and duplicate-scheduler guards; cross-origin frames are unsupported.
- Generic response controls can differ by locale or experiment. The 30-second experimental fallback requires stable answer/auxiliary regions, no busy/error signal, and an enabled composer.
- Queue rendering is capped operationally through warnings and import confirmation rather than virtualization. At explicitly confirmed sizes above 1,000, side-panel rendering may be slower.
- Automated tests do not authenticate to third-party services. Live account, region, consent, search, tools, file processing, agent tasks, citations, and memory soak behavior require the manual phase checklists.
