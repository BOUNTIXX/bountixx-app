import "server-only";

import { createPublicKey, timingSafeEqual, verify } from "crypto";
import { unsignedAttestation, type ResultAttestation } from "@bountixx/rush-sdk";
import type { RushManifest } from "@bountixx/rush-sdk";

export class RushAttestationValidationError extends Error {}

export type LockedVerifiedCampaign = {
  id: string;
  status: "draft" | "published" | "archived";
  verification: "standard" | "verified";
  manifestHash: string | null;
  manifest: RushManifest;
};

const hashPattern = /^[a-f0-9]{64}$/;

function requiredText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") throw new RushAttestationValidationError(`${field} must be text.`);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) throw new RushAttestationValidationError(`${field} is invalid.`);
  return trimmed;
}

function requiredHash(value: unknown, field: string): string {
  const hash = requiredText(value, field, 64);
  if (!hashPattern.test(hash)) throw new RushAttestationValidationError(`${field} must be a lowercase SHA-256 digest.`);
  return hash;
}

function requiredDate(value: unknown, field: string): string {
  const date = new Date(requiredText(value, field, 64));
  if (Number.isNaN(date.getTime())) throw new RushAttestationValidationError(`${field} must be a valid date-time.`);
  return date.toISOString();
}

/**
 * Checks a verifier payload before it becomes an append-only public Proof Mark.
 * The caller must additionally authenticate the service-to-service request.
 */
export function validateAttestationPayload(input: unknown, campaign: LockedVerifiedCampaign): ResultAttestation {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new RushAttestationValidationError("attestation must be an object.");
  }
  if (campaign.status !== "published" || campaign.verification !== "verified" || !campaign.manifestHash) {
    throw new RushAttestationValidationError("Only a published Verified Rush can receive an attestation.");
  }

  const value = input as Record<string, unknown>;
  if (value.version !== 1) throw new RushAttestationValidationError("attestation.version must be 1.");
  const attestation: ResultAttestation = {
    version: 1,
    manifestHash: requiredHash(value.manifestHash, "attestation.manifestHash"),
    campaignId: requiredText(value.campaignId, "attestation.campaignId", 128),
    arenaId: requiredText(value.arenaId, "attestation.arenaId", 128),
    winnerAddress: requiredText(value.winnerAddress, "attestation.winnerAddress", 128),
    resultHash: requiredHash(value.resultHash, "attestation.resultHash"),
    issuedAt: requiredDate(value.issuedAt, "attestation.issuedAt"),
    verifierKeyId: requiredText(value.verifierKeyId, "attestation.verifierKeyId", 128),
    signature: requiredText(value.signature, "attestation.signature", 2048),
  };

  if (attestation.manifestHash !== campaign.manifestHash || attestation.campaignId !== campaign.id || attestation.arenaId !== campaign.manifest.arenaId) {
    throw new RushAttestationValidationError("The attestation does not match this locked campaign manifest.");
  }
  return attestation;
}

export function verifyAttestationSignature(attestation: ResultAttestation, verifierPublicKeyPem: string): boolean {
  try {
    const { signature, ...unsigned } = attestation;
    return verify(null, Buffer.from(unsignedAttestation(unsigned)), createPublicKey(verifierPublicKeyPem), Buffer.from(signature, "base64url"));
  } catch {
    return false;
  }
}

/** Exact-length, constant-time comparison for the verifier's internal credential. */
export function isVerifierRequestAuthorized(value: string | null, secret: string | undefined): boolean {
  if (!secret || !value?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(value.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
