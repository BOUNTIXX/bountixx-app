# Community Rush manifest API

The app owns organiser-facing campaign metadata. It uses
`@bountixx/rush-sdk` for the manifest contract, but it does not hold Stellar
keys, submit transactions, or invoke a Rush Vault.

## Persistence model

`rush_campaigns` holds a canonical JSON snapshot of the rules manifest plus an
ordered JSON programme of activities. A draft has no `manifestHash`. Publishing
at creation sets a SHA-256 hash over the SDK's canonical JSON form and records
`publishedAt`.

Published campaigns are proof records. Do not add a route that edits their
manifest or silently changes the stored canonical JSON. If a future revision
is needed, create a new campaign or design a versioned successor flow first.

## `POST /api/rushes`

Requires a signed-in organiser. It accepts the following shape:

```json
{
  "slug": "stellar-builder-rush",
  "community": "Example developer community",
  "summary": "A short public description of the programme.",
  "verification": "standard",
  "publish": false,
  "activities": [
    {
      "kind": "arena",
      "title": "Build the verifier",
      "description": "Complete the scored builder challenge.",
      "time": "Week 1 · Online",
      "points": 250
    }
  ],
  "manifest": {
    "arenaId": "planned-arena-id",
    "title": "Builder Rush",
    "challengeType": "coding",
    "rulesVersion": 1,
    "scoringMethod": "Published deterministic test cases",
    "startsAt": "2026-12-01T09:00:00.000Z",
    "endsAt": "2026-12-08T17:00:00.000Z",
    "prize": { "asset": "CROWNS", "amount": "500", "network": "TESTNET" },
    "payout": "ranked",
    "resultPolicy": "deterministic"
  }
}
```

The server generates `manifest.campaignId`; a client cannot select it.

Validation rules:

- A `standard` Rush uses `CROWNS`, Bountixx's non-transferable points.
- A `verified` Rush currently permits only sponsor-funded `XLM` on `TESTNET`
  and requires deterministic results.
- `PUBLIC` is rejected for verified campaigns in this release. A stored
  campaign is not proof of funding or a promise of a payout.
- The shared SDK validates manifest invariants; the app also validates
  organiser metadata and release-specific safety restrictions.
- Each campaign has one to twelve programme activities. Activity kinds are
  `arena`, `quest`, `workshop`, and `bounty`; their title, participant-facing
  description, schedule/location label, and non-negative Crown value are
  validated and retained with the campaign.

## Read routes

- `GET /api/rushes` returns all published campaigns and the current
  organiser's drafts.
- `GET /api/rushes/:slug` returns a published campaign to anyone. A draft is
  returned only to the organiser who owns it. Other callers receive `404`.

## `PATCH /api/rushes/:slug`

Requires the draft's organiser. Send the same body shape as `POST`, retaining
the original slug. The request replaces the current draft snapshot. Send
`publish: true` to lock and publish it; the response contains its immutable
canonical manifest hash. Published campaigns reject updates with `409`.

The manifest is deliberately public only after publication. Do not expose
drafts through unauthenticated discovery or use this API as a payout endpoint.

## Proof Marks and verifier ingestion

`GET /api/rushes/:slug/attestations` exposes only the signed Proof Marks for a
published campaign. It returns `404` for drafts and never exposes any verifier
credential.

`POST /api/rushes/:slug/attestations` is an internal service-to-service route,
not a browser API. It accepts a complete SDK `ResultAttestation` only when all
of the following hold:

- `Authorization: Bearer <RUSH_VERIFIER_INGEST_SECRET>` matches exactly;
- `RUSH_VERIFIER_PUBLIC_KEY_PEM` cryptographically verifies the Ed25519
  signature;
- the campaign is published, is `verified`, and its stored manifest hash and
  arena ID match the attestation.

The route stores the canonical proof object append-only and replays an exact
result/signature pair safely. It does not invoke Soroban or represent a stored
Proof Mark as a settled reward.
