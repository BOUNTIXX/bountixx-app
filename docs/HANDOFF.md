# Workspace Handoff

For the complete multi-repository state, read `../../HANDOFF.md` when working
inside the Drips workspace. This repository's source of product intent remains
`PRD.md`, `BRAND.md`, `ARCHITECTURE.md`, and `IMPLEMENTATION_PLAN.md`.

## App baseline

- `/rush` is a static Community Rush discovery and trust-model page.
- The dashboard links to `/rush`; the responsive navigation includes Rush.
- `src/lib/communityRush.ts` imports shared program types from
  `@bountixx/rush-sdk` and intentionally uses an explicitly labelled preview
  campaign, not a real Stellar programme or funded reward.
- `src/proxy.ts` is the current Next.js 16 Clerk proxy convention.
- A wallet remains unnecessary for every normal Arena flow.

## Community Rush persistence baseline

- `rush_campaigns` stores organiser-owned campaign drafts and published
  campaign records. It never stores wallet credentials, transaction payloads,
  or verifier keys.
- `POST /api/rushes` creates a draft by default. Sending `publish: true`
  publishes on creation and records a SHA-256 hash of the canonical SDK
  manifest. Published manifests must be treated as immutable.
- `GET /api/rushes` returns published campaigns plus the current organiser's
  own drafts. `GET /api/rushes/[slug]` exposes a published proof record or an
  organiser's draft; other drafts return 404.
- Existing Neon deployments can apply the additive table through
  `npm run db:patch`; normal request paths also run the idempotent schema
  patch. The generated Drizzle migration is forward-safe for fresh or already
  patched databases.

See `docs/RUSH_API.md` for the request contract and validation boundary.

## Do next

Build an organiser UI around the existing API, then add a public read-only
campaign/proof page. Do not add wallet or settlement controls until the
verifier HTTP boundary is available. Do not present a preview campaign as a
live Stellar event.
