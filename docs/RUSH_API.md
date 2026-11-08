# Community Rush manifest API

The app owns organiser-facing campaign metadata. It uses
`@bountixx/rush-sdk` for the manifest contract, but it does not hold Stellar
keys, submit transactions, or invoke a Rush Vault.

## Persistence model

`rush_campaigns` holds a canonical JSON snapshot of the manifest. A draft has
no `manifestHash`. Publishing at creation sets a SHA-256 hash over the SDK's
canonical JSON form and records `publishedAt`.

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

## Read routes

- `GET /api/rushes` returns all published campaigns and the current
  organiser's drafts.
- `GET /api/rushes/:slug` returns a published campaign to anyone. A draft is
  returned only to the organiser who owns it. Other callers receive `404`.

The manifest is deliberately public only after publication. Do not expose
drafts through unauthenticated discovery or use this API as a payout endpoint.
