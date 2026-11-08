# Platform Architecture

## Repository map

| Repository | Responsibility |
| --- | --- |
| `bountixx-app` | Next.js product UI, Arena, Community Rush organizer/player experience, and product APIs. |
| `bountixx-rush-contracts` | Soroban contracts for Rush Vault funding, settlement, refund, and proof recording. |
| `bountixx-rush-verifier` | Deterministic scoring adapters and result-attestation service. |
| `bountixx-rush-sdk` | Public TypeScript types and client helpers for integrating Community Rush. |

## Verified Rush flow

1. An organizer configures a Community Rush in the app.
2. The app creates a canonical challenge manifest and records its hash.
3. The sponsor funds a Rush Vault on Stellar Testnet or Mainnet.
4. Players compete in Bountixx using normal Arena mechanics.
5. The verifier evaluates submissions and signs a result attestation.
6. The app records the outcome through the contract; the contract releases the defined sponsor reward or enables an eligible refund.
7. The app presents a public proof page linking the manifest, result, and transaction data.

## Trust boundary

Soroban does not execute arbitrary coding or creative-work evaluation. The verifier is the authorized attester for the first release. Its signed payload is recorded and checked by the contract. The UI must disclose this clearly.

## Integration order

1. Copy the stable Bountixx reference app into this repo.
2. Add a feature-flagged Community Rush information architecture and fixture data.
3. Add Stellar wallet connection and Testnet read-only status.
4. Integrate the SDK, verifier, and contracts as each repository becomes functional.
