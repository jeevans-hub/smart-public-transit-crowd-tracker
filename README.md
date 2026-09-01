# Smart Public Transit Crowd Tracker

Smart Public Transit Crowd Tracker is a BMTC-focused transit application providing route and nearby-stop information, crowd forecasts, destination-compatible bus recommendations, secure digital QR tickets, in-app alerts, and a provider architecture capable of supporting authorized real-time transit feeds.

## Version 1.0 scope

The main demonstration journey is:

`Dashboard → BMTC Tracking → Nearby Stops → Crowd Forecasts → Digital Tickets`

Version 1.0 includes:

- A small dashboard overview rather than a second analytics product.
- BMTC route, stop, bus, and arrival views based on normalized transit data.
- Nearby-stop discovery and destination-compatible bus recommendations.
- Crowd estimates with confidence, source, and rush-hour context.
- Secure signed QR tickets with `ACTIVE`, `USED`, `EXPIRED`, and `CANCELLED` lifecycle rules.
- A separate ticket-history screen.
- Admin-only ticket validation and provider diagnostics.
- In-app alerts and a Socket.IO channel for BMTC updates.
- GTFS static, GTFS-Realtime, fixture, and optional Moovit provider adapters.
- A live-feed reliability gate, shadow mode, fallback behavior, and diagnostics.

## Demo data versus live data

No legitimate, authorized real BMTC feed or Moovit account credentials are included in this repository. The default provider mode is `DEMO`, using deterministic Bengaluru sample data. Real BMTC tracking is therefore still pending authorized feed access and successful real-world validation.

The interface and provider-status API must not label data as live merely because a build succeeds or an endpoint responds. A configured provider must prove feed identity, Bengaluru geography, mapping quality, freshness, and repeated stability. Shadow mode remains enabled until those checks pass.

Only use an official feed, documented open-data endpoint, or permitted third-party provider. Do not use reverse-engineered application endpoints or unofficial scraper feeds.

## Main routes

Passenger routes:

- `/dashboard`
- `/dashboard/bmtc`
- `/dashboard/bmtc/nearby`
- `/dashboard/bmtc/forecasts`
- `/dashboard/bmtc/routes/[routeNumber]`
- `/dashboard/bmtc/vehicles/[vehicleId]`
- `/dashboard/tickets`
- `/dashboard/tickets/history`
- `/dashboard/profile`
- `/dashboard/settings`

Admin-only routes:

- `/dashboard/tickets/validate`
- `/dashboard/bmtc/diagnostics`

The matching validation and diagnostics APIs also enforce the admin role on the server. Hiding a navigation item is not treated as authorization.

## Digital ticketing

Passengers select a BMTC route and journey, then generate an active ticket containing a signed QR payload. The project does not process payments; fares are demo values.

The validation workflow verifies the signature and lifecycle before marking an `ACTIVE` ticket as `USED`. It rejects tampered, expired, cancelled, and previously used tickets. Tickets use MongoDB when available and an in-memory development fallback when the database is unavailable.

## BMTC tracking and crowd recommendations

The BMTC module exposes routes, nearby stops, arrivals, vehicle details, crowd forecasts, destination-aware recommendations, alerts, provider status, and route intelligence. Recommendations exclude wrong-direction and destination-incompatible buses before comparing wait time, crowd, delay, confidence, and route fit.

Unknown exact passenger counts remain unknown. When live occupancy is unavailable, crowd levels are estimates and are labelled with their source and confidence.

## Provider architecture

Copy `.env.example` to `.env.local`. The safe default is:

```env
BMTC_REALTIME_ENABLED=false
BMTC_PROVIDER_TYPE=GTFS_RT
BMTC_LIVE_SHADOW_MODE=true
MOOVIT_ENABLED=false
```

The server supports configured GTFS static and GTFS-Realtime feeds. Moovit support requires legitimate account credentials plus the account-specific Bengaluru metro/agency context. Never guess those identifiers. Browser clients do not receive provider secrets or call upstream providers directly.

Useful provider checks:

```bash
npm run transit:readiness
npm run transit:verify-live
npm run test:moovit-provider
```

`transit:verify-live` performs at most one controlled feed cycle. Keep shadow mode enabled until the manual checks in `docs/PHASE_7E_LIVE_VALIDATION_CHECKLIST.md` pass with authorized data.

## Setup

Requirements:

- Node.js compatible with Next.js 16
- npm
- MongoDB for persistent users and tickets

Install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Required local environment values:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/smart-public-transit
JWT_SECRET=replace-with-a-long-random-secret
NEXT_PUBLIC_APP_NAME=Smart Public Transit Crowd Tracker
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

See `.env.example` for the optional authorized-provider settings and safety thresholds.

## Verification

```bash
npm test
npm run lint
npm audit
npm run build
```

Focused test scripts cover ticket QR tampering, lifecycle rules, duplicate scans, role access, destination compatibility, wrong-direction rejection, no-alternative behavior, crowd boundaries, provider fallback, GTFS parsing and normalization, Moovit request signing/configuration, stale and duplicate updates, verification states, and the Phase 7E reliability gate.

## Deliberately outside Version 1.0

These ideas are future scope, not partially advertised features:

- Real payment, refunds, subscriptions, and monthly passes.
- SMS delivery and phone verification.
- Passenger-submitted crowdsourcing.
- Gamification, points, levels, coins, and leaderboards.
- Generic multi-city digital twins and control centers.
- Fleet maintenance prediction, cost optimization, and operations management.
- Generic agency, station, route, and vehicle CRUD dashboards.
- Generic analytics and unrelated prediction dashboards.

## Current limitations

- Real BMTC tracking remains pending authorized live access and field validation.
- Demo fares are not transactions.
- Crowd forecasts are estimates unless explicitly backed by verified live occupancy.
- Exact passenger counts are not invented when the provider does not supply them.
- The in-memory ticket fallback is for local demonstration and is not persistent.
