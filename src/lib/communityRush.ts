import type { CommunityRushActivityType, CommunityRushProgram } from "@bountixx/rush-sdk";

/**
 * Community Rush is the organiser layer around Bountixx arenas.
 *
 * This module deliberately contains only publishable campaign metadata. A
 * verified result, wallet address, attestation, or contract identifier must
 * come from the Rush SDK + verifier once the integration environment is set.
 */

export type RushTrack = CommunityRushActivityType;
export type CommunityRush = CommunityRushProgram;

/**
 * Starter content for the product surface. It is intentionally marked as a
 * preview campaign: it is not an announcement, endorsement, or funded Stellar
 * program. Organisers replace this through the future Rush admin flow.
 */
export const featuredRush: CommunityRush = {
  slug: "stellar-build-week-preview",
  name: "Stellar Build Week",
  community: "Community Rush preview",
  status: "preview",
  startsAt: "Your campaign date",
  endsAt: "Your campaign date",
  summary:
    "A reusable campaign format for a community that wants builders, learners, and competitors moving through the same season.",
  rewardLabel: "Crowns now. Sponsor-funded XLM only after verification.",
  verification: "Verified Rush",
  tracks: [
    {
      kind: "workshop",
      title: "Wallet Warm-up",
      description: "A guided onboarding session with a short proof-of-learning check.",
      time: "Session 01",
      points: 150,
    },
    {
      kind: "quest",
      title: "Protocol Quest",
      description: "Turn a concept into a working on-chain interaction and explain your choices.",
      time: "Session 02",
      points: 300,
    },
    {
      kind: "arena",
      title: "Build Sprint Arena",
      description: "A time-boxed team challenge judged against published, deterministic checks.",
      time: "Session 03",
      points: 500,
    },
    {
      kind: "bounty",
      title: "Open Fix Bounty",
      description: "A scoped contribution with a maintainer-defined acceptance checklist.",
      time: "Open window",
      points: 750,
    },
  ],
};

export const rushPrinciples = [
  {
    label: "Open the door",
    detail: "Anyone can play an arena without a wallet or a transaction.",
  },
  {
    label: "Make proof visible",
    detail: "The rules, scoring method, and result record are visible before a verified reward is issued.",
  },
  {
    label: "Pay only for verified work",
    detail: "Sponsor-funded rewards settle only after the Rush verifier signs a final result on Testnet.",
  },
] as const;
