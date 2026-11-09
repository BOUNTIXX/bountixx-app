import "server-only";

import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import type { RushManifest } from "@bountixx/rush-sdk";
import { db } from "./db";
import { validateAttestationPayload, verifyAttestationSignature } from "./rushAttestation";
import { rushAttestations, rushCampaigns, submissions, users } from "./schema";

type VerifierResponse = { attestation?: unknown; error?: string };

/**
 * Requests an attestation only from a completed Arena's persisted winner. This
 * is a no-op until the private verifier deployment is configured. A delivery
 * failure never changes the Arena's established result.
 */
export async function requestArenaProofMark(roomId: string): Promise<void> {
  const verifierUrl = process.env.RUSH_VERIFIER_URL?.replace(/\/+$/, "");
  const sharedSecret = process.env.RUSH_VERIFIER_SHARED_SECRET;
  const publicKey = process.env.RUSH_VERIFIER_PUBLIC_KEY_PEM;
  if (!verifierUrl || !sharedSecret || !publicKey) return;

  try {
    const candidates = await db.select().from(rushCampaigns).where(and(eq(rushCampaigns.status, "published"), eq(rushCampaigns.verification, "verified")));
    const campaign = candidates.find((candidate) => {
      try { return (JSON.parse(candidate.manifestJson) as RushManifest).arenaId === roomId; } catch { return false; }
    });
    if (!campaign?.manifestHash) return;

    const [alreadyStored] = await db.select({ id: rushAttestations.id }).from(rushAttestations).where(eq(rushAttestations.campaignId, campaign.id)).limit(1);
    if (alreadyStored) return;
    const [winnerSubmission] = await db.select().from(submissions).where(and(eq(submissions.roomId, roomId), eq(submissions.isWinner, true))).limit(1);
    if (!winnerSubmission) return;
    const [winner] = await db.select({ stellarAddress: users.stellarAddress }).from(users).where(eq(users.id, winnerSubmission.userId)).limit(1);
    if (!winner?.stellarAddress) return;

    const winnerSubmissions = await db.select({ id: submissions.id, testsPassed: submissions.testsPassed }).from(submissions).where(and(eq(submissions.roomId, roomId), eq(submissions.userId, winnerSubmission.userId)));
    if (winnerSubmissions.length === 0) return;
    const manifest = JSON.parse(campaign.manifestJson) as RushManifest;
    const result = {
      campaignId: campaign.id, arenaId: roomId, winnerAddress: winner.stellarAddress,
      score: winnerSubmissions.reduce((total, submission) => total + submission.testsPassed, 0),
      submissionIds: winnerSubmissions.map((submission) => submission.id).sort(), resolvedAt: winnerSubmission.submittedAt.toISOString(),
    };
    const idempotencyKey = `arena-proof:${campaign.id}:${winnerSubmission.id}`;
    const response = await fetch(`${verifierUrl}/v1/attestations`, {
      method: "POST",
      headers: { authorization: `Bearer ${sharedSecret}`, "content-type": "application/json" },
      body: JSON.stringify({ idempotencyKey, campaignId: campaign.id, arenaId: roomId, manifestHash: campaign.manifestHash, result }),
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({})) as VerifierResponse;
    if (!response.ok || !body.attestation) {
      console.error("[rushVerifierBridge] verifier rejected Arena proof:", body.error ?? response.status);
      return;
    }
    const attestation = validateAttestationPayload(body.attestation, { id: campaign.id, status: campaign.status, verification: campaign.verification, manifestHash: campaign.manifestHash, manifest });
    if (!verifyAttestationSignature(attestation, publicKey)) {
      console.error("[rushVerifierBridge] verifier returned an invalid signature.");
      return;
    }
    const [existing] = await db.select({ id: rushAttestations.id }).from(rushAttestations).where(and(eq(rushAttestations.campaignId, campaign.id), eq(rushAttestations.resultHash, attestation.resultHash))).limit(1);
    if (existing) return;
    await db.insert(rushAttestations).values({
      id: randomUUID(), campaignId: campaign.id, manifestHash: attestation.manifestHash, arenaId: attestation.arenaId,
      winnerAddress: attestation.winnerAddress, resultHash: attestation.resultHash, issuedAt: new Date(attestation.issuedAt),
      verifierKeyId: attestation.verifierKeyId, signature: attestation.signature, attestationJson: JSON.stringify(attestation),
    });
  } catch (error) {
    console.error("[rushVerifierBridge] proof request failed:", error);
  }
}
