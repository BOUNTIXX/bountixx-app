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
  campaign records, including an ordered programme of 1–12 arenas, quests,
  workshops, or bounties. It never stores wallet credentials, transaction
  payloads, or verifier keys.
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
- `rush_attestations` stores append-only, verifier-signed Proof Marks. The
  app accepts them only through its secret-protected internal ingestion route,
  after verifying the configured Ed25519 public key against the locked
  manifest. Required deployment-only secrets are
  `RUSH_VERIFIER_INGEST_SECRET` and `RUSH_VERIFIER_PUBLIC_KEY_PEM`; they must
  never be `NEXT_PUBLIC_*` values or live in a client bundle.
- `users.stellar_address` is an optional, user-managed Stellar public key for
  Testnet reward receipt. It is validated as a `G…` public address through
  `PATCH /api/wallet`; Bountixx never receives or stores any private key.
- `requestArenaProofMark()` connects an ended, linked Arena to the verifier
  using server-only `RUSH_VERIFIER_URL`, `RUSH_VERIFIER_SHARED_SECRET`, and
  `RUSH_VERIFIER_PUBLIC_KEY_PEM`. It derives the winner from persisted scored
  submissions and does nothing unless all verifier settings and the winner's
  public recipient are present. Do not add a browser or organiser shortcut to
  submit an arbitrary result.
- `GET /api/internal/rush-manifests/[campaignId]?arenaId=...` is a private
  verifier-only reader for a published, locked Verified Rush. It uses the
  deployment secret `RUSH_VERIFIER_MANIFEST_SECRET`; set the verifier's
  `RUSH_MANIFEST_READER_SECRET` to the same value. It is intentionally neither
  a browser endpoint nor a general campaign API.
- Existing Neon deployments can apply the additive table through
  `npm run db:patch`; normal request paths also run the idempotent schema
  patch. The generated Drizzle migration is forward-safe for fresh or already
  patched databases.

See `docs/RUSH_API.md` for the request contract and validation boundary.

## Do next

Deploy the verifier with a durable manifest reader, atomic idempotency store,
and secret-managed key, then configure the app's private bridge variables.
Do not add Testnet settlement controls until a verifier-backed proof has been
independently exercised. Do not present a preview campaign as a live Stellar
event.
