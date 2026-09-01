This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Digital ticketing

The project includes a demo-ready digital ticket workflow at `/dashboard/tickets`:

1. Select a route, journey, and passenger count.
2. Issue an active ticket with a signed, scannable QR code.
3. Validate the ticket at `/dashboard/tickets/validate`.
4. A successful validation marks it as `USED`; expired and cancelled tickets are rejected.

Tickets are stored in MongoDB when available. If MongoDB is unreachable, the development demo uses in-memory storage. Payment processing is intentionally not included.

## BMTC transit module

The BMTC dashboard is available at `/dashboard/bmtc`, with nearby stops at `/dashboard/bmtc/nearby`. It currently uses deterministic Bengaluru demo data and labels it clearly in the interface. No legitimate real BMTC feed is configured in this repository. **Real BMTC feed configuration is pending.**

Phase 7C adds a server-side GTFS static and GTFS-Realtime provider without changing the Phase 7A or 7B frontend contracts. One ingestion loop fetches the upstream feed, normalizes it, rejects stale or duplicate updates, updates the in-memory cache and MongoDB in batches, and emits updates through the existing Socket.IO server. Browser clients never receive provider credentials and never poll the external provider directly.

Copy `.env.example` to `.env.local` and configure an approved, documented feed:

```env
BMTC_REALTIME_ENABLED=true
BMTC_PROVIDER_TYPE=GTFS_RT
BMTC_VEHICLE_POSITIONS_URL=
BMTC_TRIP_UPDATES_URL=
BMTC_ALERTS_URL=
BMTC_GTFS_STATIC_URL=
BMTC_API_KEY=
BMTC_API_KEY_HEADER=x-api-key
BMTC_FEED_SOURCE_NAME=
BMTC_FEED_TERMS_URL=
BMTC_REFRESH_INTERVAL_MS=30000
BMTC_STALE_AFTER_SECONDS=120
BMTC_REQUEST_TIMEOUT_MS=10000
```

`BMTC_FEED_SOURCE_NAME` and `BMTC_FEED_TERMS_URL` are required provenance fields. Use only an official feed, documented open-data endpoint, or permitted third-party provider. Do not use reverse-engineered app endpoints or unofficial scraper feeds. Configuration alone does not activate the live badge: the provider must successfully decode the feed and return at least one fresh vehicle update.

### Optional Moovit provider

Phase 7D adds Moovit as an optional server-side provider through Moovit's documented `RtGtfs` and `SaRtGtfs` GTFS-Realtime services. Moovit access is not bundled with this project. Obtain the API key, any required HMAC secret, metro ID, agency ID, usage limits, and Bengaluru/BMTC account entitlement directly from Moovit. Never guess a metro or agency ID.

Moovit remains disabled in `.env.example`. After authorized access has been supplied, select it explicitly:

```env
BMTC_REALTIME_ENABLED=true
BMTC_PROVIDER_TYPE=MOOVIT

MOOVIT_ENABLED=true
MOOVIT_API_BASE_URL=
MOOVIT_API_KEY=
MOOVIT_API_SECRET=
MOOVIT_AUTH_MODE=API_KEY
MOOVIT_HMAC_ENCODING=hex
MOOVIT_METRO_ID=
MOOVIT_AGENCY_ID=
MOOVIT_TRANSIT_TYPE=BUS
MOOVIT_GTFS_STATIC_URL=
MOOVIT_REQUEST_TIMEOUT_MS=10000
MOOVIT_REFRESH_INTERVAL_MS=30000
MOOVIT_STALE_AFTER_SECONDS=120
```

When `MOOVIT_API_BASE_URL` is blank, the provider uses Moovit's documented production API base. Use `MOOVIT_AUTH_MODE=HMAC` only when required for the account; this makes `MOOVIT_API_SECRET` mandatory. All credentials remain server-side and are excluded from provider-status responses and logs. `MOOVIT_GTFS_STATIC_URL` must point to compatible, legitimately obtained GTFS static data so real-time route and trip IDs can be matched to stops and agency metadata.

A successful HTTP response does not by itself enable `LIVE BMTC DATA`. The provider requires fresh bus positions, compatible route IDs, a broad Bengaluru geographic sanity check, and account-provided agency metadata matching BMTC. Fresh data that cannot prove BMTC identity is labelled `LIVE TRANSIT DATA — UNVERIFIED`; a wrong-region, stale, unauthorized, or failing feed activates demo fallback. Upstream `Cache-Control`, `ETag`, `Retry-After`, timeouts, and exponential backoff are respected.

Moovit occupancy values use the existing crowd-level mapper. Exact passenger counts remain `null`, and Phase 7B predictions continue when live occupancy is absent. Existing ETA, crowd, recommendation, MongoDB, Socket.IO, and authenticated dashboard API paths are reused without a client-side Moovit request loop.

Run the safe configuration diagnostic without starting the dashboard:

```bash
npm run test:moovit-provider
```

It reports only connectivity, authentication status, configured-ID presence, entity counts, freshness, and verification status. It never prints credentials or authorization headers.

The provider automatically falls back to demo data when real mode is disabled, configuration is incomplete, requests fail, the feed is empty, or all vehicle updates are stale. The authenticated `GET /api/bmtc/provider-status` endpoint and dashboard health card expose these states:

- `LIVE`: a configured real feed returned fresh vehicle data.
- `DEGRADED`: the configured feed failed or became stale; safe fallback is active.
- `OFFLINE`: the configured feed failed at least three consecutive health checks.
- `DEMO`: real mode is disabled, invalid, or fixture mode is selected.

Vehicles older than `BMTC_STALE_AFTER_SECONDS` (120 seconds by default) are marked non-live and excluded from `/api/bmtc/vehicles` unless `includeStale=true` is supplied. HTTP requests have a timeout, `429` retry hints are respected, and repeated failures use exponential backoff.

GTFS-Realtime supports `VehiclePosition`, `TripUpdate`, and `Alert` messages. ETA priority is live TripUpdate, GPS estimate, historical estimate, scheduled time, then demo fallback. The current implementation uses live TripUpdate and GPS values when supplied and preserves the existing fallbacks. GPS-derived ETAs are never labeled as TripUpdate ETAs.

If `occupancy_status` or `occupancy_percentage` is supplied, it maps to the existing `LOW`, `MEDIUM`, `HIGH`, and `VERY_HIGH` crowd levels with `LIVE_OCCUPANCY` as the source. Exact passenger counts remain `null` unless a valid source explicitly supplies an exact count. When occupancy is missing, Phase 7B crowd intelligence continues to estimate a level and clearly labels it as predicted.

To import a configured GTFS static archive into MongoDB with idempotent upserts:

```bash
npm run import:bmtc-gtfs
```

You can also pass a local ZIP file:

```bash
npm run import:bmtc-gtfs -- C:\path\to\feed.zip
```

For local integration testing without a network provider, set `BMTC_REALTIME_ENABLED=true` and `BMTC_PROVIDER_TYPE=FIXTURE`. Fixture mode exercises normalized GTFS data but always remains visibly labeled as demo data.

The Phase 7A APIs require an authenticated dashboard session and expose nearby stops, routes, vehicle positions, vehicle details, stop arrivals, recommendations, crowd predictions, alerts, and provider status.

### Phase 7B crowd intelligence

The BMTC module now compares only direction- and destination-compatible buses. Its deterministic recommendation score combines ETA (35%), predicted crowd (35%), delay (15%), crowd confidence (10%), and route fit (5%). Unknown passenger counts remain `null`.

Additional authenticated endpoints include:

- `GET /api/bmtc/recommendations`
- `GET /api/bmtc/crowd-predictions`
- `GET /api/bmtc/routes/[routeNumber]/intelligence`
- `GET|POST /api/bmtc/alerts`
- `DELETE /api/bmtc/alerts/[id]`

Route intelligence pages show an eight-point crowd trend, rush-hour estimate, active vehicle crowd levels, and the least-crowded service window. Results remain visibly marked as demo data unless the real provider passes its freshness checks.

## Verification

```bash
npm test
npm run build
```

`npm test` covers QR tamper rejection, expiry, duplicate-use rules, cancellation eligibility, crowd-calculation boundaries, destination compatibility, wrong-direction rejection, recommendation weighting, deterministic crowd/rush predictions, alert cooldown behavior, provider fallback, GTFS ZIP and protobuf parsing, normalization, occupancy mapping, TripUpdate ETA, stale vehicles, duplicate updates, provider health recovery, Moovit configuration and HMAC signing, documented endpoint construction, service alerts, cache directives, rate limits, timeouts, wrong-region rejection, and BMTC verification states.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
