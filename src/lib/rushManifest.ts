import "server-only";

import { createHash } from "crypto";
import {
  canonicalize,
  validateRushManifest,
  type RushChallengeType,
  type RushManifest,
} from "@bountixx/rush-sdk";
import type { CommunityRushActivity, CommunityRushActivityKind } from "./rushCampaign";

export type RushVerification = "standard" | "verified";

export interface CreateRushCampaignInput {
  slug: string;
  community: string;
  summary: string;
  verification: RushVerification;
  activities: CommunityRushActivity[];
  publish?: boolean;
  manifest: Omit<RushManifest, "campaignId">;
}

export class RushManifestValidationError extends Error {}

const challengeTypes = new Set<RushChallengeType>([
  "coding", "trivia", "logic", "math", "writing", "design", "meme", "mixed",
]);
const payoutModes = new Set<RushManifest["payout"]>(["winner-takes-all", "ranked"]);
const resultPolicies = new Set<RushManifest["resultPolicy"]>([
  "deterministic", "organizer-reviewed",
]);
const activityKinds = new Set<CommunityRushActivityKind>(["arena", "quest", "workshop", "bounty"]);

function requiredText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new RushManifestValidationError(`${field} must be text.`);
  }
  const trimmed = value.trim();
  if (!trimmed) throw new RushManifestValidationError(`${field} is required.`);
  if (trimmed.length > maxLength) {
    throw new RushManifestValidationError(`${field} must be ${maxLength} characters or fewer.`);
  }
  return trimmed;
}

function parseDate(value: string, field: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RushManifestValidationError(`${field} must be a valid date-time.`);
  }
  return date.toISOString();
}

function parseAmount(value: unknown): string {
  const amount = requiredText(value, "manifest.prize.amount", 32);
  if (!/^\d+(?:\.\d{1,7})?$/.test(amount) || Number(amount) <= 0) {
    throw new RushManifestValidationError("manifest.prize.amount must be a positive decimal amount.");
  }
  return amount;
}

function parseActivities(value: unknown): CommunityRushActivity[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 12) {
    throw new RushManifestValidationError("activities must contain between 1 and 12 programme items.");
  }

  return value.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new RushManifestValidationError(`activities[${index}] must be an object.`);
    }
    const activity = item as Record<string, unknown>;
    if (typeof activity.kind !== "string" || !activityKinds.has(activity.kind as CommunityRushActivityKind)) {
      throw new RushManifestValidationError(`activities[${index}].kind is not supported.`);
    }
    if (typeof activity.points !== "number" || !Number.isInteger(activity.points) || activity.points < 0 || activity.points > 100_000) {
      throw new RushManifestValidationError(`activities[${index}].points must be a whole number from 0 to 100000.`);
    }
    return {
      kind: activity.kind as CommunityRushActivityKind,
      title: requiredText(activity.title, `activities[${index}].title`, 120),
      description: requiredText(activity.description, `activities[${index}].description`, 600),
      time: requiredText(activity.time, `activities[${index}].time`, 120),
      points: activity.points,
    };
  });
}

/**
 * Validates untrusted request input and creates the exact manifest that is
 * persisted. The campaign ID is generated server-side, rather than trusted
 * from an organiser request.
 */
export function buildRushManifest(
  input: unknown,
  campaignId: string,
): { campaign: Omit<CreateRushCampaignInput, "manifest">; manifest: RushManifest } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new RushManifestValidationError("Request body must be an object.");
  }
  const body = input as Record<string, unknown>;
  const manifestInput = body.manifest;
  if (!manifestInput || typeof manifestInput !== "object" || Array.isArray(manifestInput)) {
    throw new RushManifestValidationError("manifest is required.");
  }
  const manifest = manifestInput as Record<string, unknown>;
  const slug = requiredText(body.slug, "slug", 80).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new RushManifestValidationError("slug may use lowercase letters, numbers, and single hyphens.");
  }
  const verification = body.verification;
  if (verification !== "standard" && verification !== "verified") {
    throw new RushManifestValidationError("verification must be standard or verified.");
  }

  const startsAt = parseDate(requiredText(manifest.startsAt, "manifest.startsAt", 64), "manifest.startsAt");
  const endsAt = parseDate(requiredText(manifest.endsAt, "manifest.endsAt", 64), "manifest.endsAt");
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    throw new RushManifestValidationError("manifest.endsAt must be after manifest.startsAt.");
  }

  const challengeType = manifest.challengeType;
  if (typeof challengeType !== "string" || !challengeTypes.has(challengeType as RushChallengeType)) {
    throw new RushManifestValidationError("manifest.challengeType is not supported.");
  }
  if (manifest.rulesVersion !== 1) {
    throw new RushManifestValidationError("manifest.rulesVersion must be 1.");
  }
  if (typeof manifest.payout !== "string" || !payoutModes.has(manifest.payout as RushManifest["payout"])) {
    throw new RushManifestValidationError("manifest.payout is not supported.");
  }
  if (typeof manifest.resultPolicy !== "string" || !resultPolicies.has(manifest.resultPolicy as RushManifest["resultPolicy"])) {
    throw new RushManifestValidationError("manifest.resultPolicy is not supported.");
  }

  const prize = manifest.prize;
  if (!prize || typeof prize !== "object" || Array.isArray(prize)) {
    throw new RushManifestValidationError("manifest.prize is required.");
  }
  const prizeInput = prize as Record<string, unknown>;
  const asset = requiredText(prizeInput.asset, "manifest.prize.asset", 12).toUpperCase();
  const network = prizeInput.network;
  if (network !== "TESTNET" && network !== "PUBLIC") {
    throw new RushManifestValidationError("manifest.prize.network must be TESTNET or PUBLIC.");
  }

  if (verification === "standard" && asset !== "CROWNS") {
    throw new RushManifestValidationError("A standard Rush uses non-transferable CROWNS, not a crypto asset.");
  }
  if (verification === "verified") {
    if (asset !== "XLM" || network !== "TESTNET") {
      throw new RushManifestValidationError("Verified Rushes are limited to sponsor-funded XLM on TESTNET for this release.");
    }
    if (manifest.resultPolicy !== "deterministic") {
      throw new RushManifestValidationError("A Verified Rush requires deterministic result policy.");
    }
  }

  const normalizedManifest: RushManifest = {
    campaignId,
    arenaId: requiredText(manifest.arenaId, "manifest.arenaId", 128),
    title: requiredText(manifest.title, "manifest.title", 160),
    challengeType: challengeType as RushChallengeType,
    rulesVersion: 1,
    scoringMethod: requiredText(manifest.scoringMethod, "manifest.scoringMethod", 400),
    startsAt,
    endsAt,
    prize: { asset, amount: parseAmount(prizeInput.amount), network },
    payout: manifest.payout as RushManifest["payout"],
    resultPolicy: manifest.resultPolicy as RushManifest["resultPolicy"],
  };
  const sharedIssues = validateRushManifest(normalizedManifest);
  if (sharedIssues.length > 0) {
    const issue = sharedIssues[0];
    throw new RushManifestValidationError(`${issue.field}: ${issue.message}`);
  }

  return {
    campaign: {
      slug,
      community: requiredText(body.community, "community", 120),
      summary: requiredText(body.summary, "summary", 600),
      verification,
      activities: parseActivities(body.activities),
      publish: body.publish === true,
    },
    manifest: normalizedManifest,
  };
}

export function serializeRushManifest(manifest: RushManifest): string {
  return canonicalize(manifest);
}

export function hashRushManifest(manifest: RushManifest): string {
  return createHash("sha256").update(serializeRushManifest(manifest)).digest("hex");
}
