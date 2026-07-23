# Known issues and beta limitations

- All optional adapters are beta because providers frequently A/B test composer, control, source, tool, and status DOM. Missing selectors fail closed and are visible in Debug diagnostics.
- Dynamic injection into an already-loaded optional-provider tab can be rejected by Chrome immediately after permission grant. Reloading activates the persisted registration.
- Search, citations, file analysis, tools, terminals, agents, and account limits differ by model/tier. The adapters cover semantic/test-ID/aria/class fallbacks and bounded stability, but the live provider matrices remain required.
- Chinese and Japanese matching is intentionally restricted to small status regions. An unlabelled UI variant may therefore remain unknown instead of scanning assistant prose and risking a false busy state.
- Perplexity route variants beyond `/search/<id>` and `/page/<id>` use temporary queue keys until observed and documented.
- Same-origin iframe variants may need explicit future registration/selector support. Cross-origin frames, login challenges, captchas, access controls, and rate limits are never inspected across boundaries or bypassed.
- Automated tests validate registry, exact permissions, URL identity, schema preservation, normalization, selector utilities, and safe diagnostics without logging into third-party accounts. Live authentication, provider workflows, and long memory soaks require `PHASE2_TESTING.md` and `PHASE3_TESTING.md`.
