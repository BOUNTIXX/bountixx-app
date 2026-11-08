# Bountixx Product Requirements

## Product

Bountixx is an AI-structured multiplayer challenge arena. A host supplies a raw challenge, Bountixx turns it into a fair playable room, rivals compete live, and a deterministic system resolves the outcome. The product should feel ruthless, kinetic, and social, never like a generic assessment product.

## Two product layers

### Arena

The core Bountixx experience: public or private coding, trivia, logic, math, writing, design, meme, debate, and pop-culture rooms. Users play with non-transferable Bountixx Crowns. No wallet is needed.

### Community Rush

An optional branded program layer for communities such as Stellar. A community can group Arenas, quests, workshops, bounties, team challenges, and eventually hackathon flows into a campaign. Verified Rushes use the Stellar protocol stack for funded prize vaults, signed result proofs, and wallet payouts.

## Naming system

| Term | Meaning |
| --- | --- |
| Crowns | Bountixx's non-transferable in-app currency. Never market it as crypto or redeemable value. |
| Community Rush | A branded community campaign made of one or more challenges or quests. |
| Rush Vault | A sponsor-funded Stellar/Soroban prize escrow. |
| Lumen Reward | An actual XLM reward paid to a Stellar wallet. Use `XLM` where precision matters. |
| Proof Mark | A verifiable record of a participant's verified Rush result. |

Product language: **Play for Crowns. Compete in a Rush. Earn Lumen Rewards. Leave with Proof.**

## First verified use case

Stellar Builder Rush: a community-sponsored sequence of Stellar onboarding, SDK, Soroban-debugging, and build challenges. Casual Arena mode remains available throughout. Community Rush must work for other communities later without becoming Stellar-only.

## Requirements

1. Community Rush must be an additive mode, not a replacement for Arena.
2. A Verified Rush must show its sponsor, rules, reward token and amount, schedule, and verification state.
3. Challenge rules are locked before an event starts; the app displays a manifest hash and proof link.
4. Evaluation remains deterministic/off-chain where appropriate. Never claim that subjective or AI evaluation is fully on-chain.
5. Stellar wallet connection is optional and requested only for funding, claiming, or viewing Verified Rush actions.
6. No paid-entry, winner-takes-all crypto mode is in scope. Rewards are sponsor-funded, skill-based, and subject to organizer terms.

## Out of scope for the first release

- Building a general jobs marketplace, grant platform, or social network.
- Full end-to-end hackathon management. Campaigns may host mini-build challenges first.
- A transferable Bountixx token.
- Custody of user keys or funds.
