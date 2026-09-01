# Phase 7E live validation checklist

Run this checklist only with an authorized provider account and confirmed Bengaluru/BMTC entitlement. Start with `BMTC_LIVE_SHADOW_MODE=true`.

- A. Missing credentials: readiness check reports missing values and makes no request.
- B. Invalid credentials: authentication fails safely and demo remains active.
- C. Wrong metro or agency: identity verification fails; the feed is never labelled BMTC.
- D. Correct BMTC feed: agency, Bengaluru geography, routes, stops, trips, and mappings are visible in diagnostics.
- E. Mapping coverage: 95% or more is GOOD, 80–94% is DEGRADED, and below 80% fails activation.
- F. Freshness: diagnostics show newest, median, oldest, fresh/stale counts, and the fresh percentage.
- G. GPS quality: malformed, future, duplicate, stale, and impossible-jump fixtures produce the expected reason codes.
- H. Stable cycles: live activation cannot occur before the configured successful-cycle count.
- I. Shadow isolation: real records are validated but the main dashboard and Socket.IO data events remain demo-only.
- J. ETA truth: record actual arrivals from provider truth or the configured 50–100 metre geofence; make no accuracy claim with zero samples.
- K. Crowd/recommendations: show unavailable when occupancy truth/outcomes are absent; do not retrain or alter Phase 7B weights.
- L. Direction/partial trips: reject wrong-direction and short-turn buses that do not serve the destination.

Before disabling shadow mode, capture provider authorization, account metro/agency identifiers, ten or more stable cycles, mapping and freshness evidence, request latency/error rates, ETA sample size, fallback recovery, and screenshots of the diagnostics page. If any gate regresses, keep shadow mode or return to demo; never merge live and demo records.
