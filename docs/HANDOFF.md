# Workspace Handoff

For the complete multi-repository state, read `../../Bountixx_HANDOFF.md` when working
inside the Drips workspace. This repository's source of product intent remains
`PRD.md`, `BRAND.md`, `ARCHITECTURE.md`, and `IMPLEMENTATION_PLAN.md`.

## App baseline

- `/rush` is a Community Rush discovery, trust-model, and published-campaign
  directory page. The directory deliberately displays only published records.
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
  own drafts, marking records that caller owns. `GET /api/rushes/[slug]`
  exposes a published proof record or an organiser's draft; other drafts
  return 404. `PATCH /api/rushes/[slug]` replaces an owned draft or locks it
  as published; published manifests reject edits.
- `/rush/new`, `/rush/manage`, `/rush/[slug]`, and `/rush/[slug]/edit` make
  this persistence usable. Only the new/manage/edit screens are proxy-protected;
  published proof pages remain public.
- Verified Rush proof pages display the public Testnet vault reference from
  `NEXT_PUBLIC_RUSH_VAULT_TESTNET_ID`. The reference is explicitly not proof
  that an individual campaign has been funded.
- Existing Neon deployments can apply the additive table through
  `npm run db:patch`; normal request paths also run the idempotent schema
  patch. The generated Drizzle migration is forward-safe for fresh or already
  patched databases.

See `docs/RUSH_API.md` for the request contract and validation boundary.

## Do next

Connect a deployed verifier only after its durable manifest reader,
idempotency store, and secret-managed key are available. Then add a
server-to-server result submission path and a read-only attestation/proof
display. Do not add wallet or settlement controls until a Testnet deployment
has been independently exercised. Do not present a preview campaign as a live
Stellar event.
