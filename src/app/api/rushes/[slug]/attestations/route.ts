export const dynamic = "force-dynamic";

import { randomUUID } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { RushManifest } from "@bountixx/rush-sdk";
import { db } from "@/lib/db";
import { ensureDatabaseSchema } from "@/lib/ensureSchema";
import {
  isVerifierRequestAuthorized,
  RushAttestationValidationError,
  validateAttestationPayload,
  verifyAttestationSignature,
} from "@/lib/rushAttestation";
import { rushAttestations, rushCampaigns } from "@/lib/schema";

function parseAttestation(value: string): unknown {
  try { return JSON.parse(value); } catch { return null; }
}

/** Returns public Proof Marks for a published campaign. Drafts expose nothing. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    await ensureDatabaseSchema();
    const [campaign] = await db.select().from(rushCampaigns).where(eq(rushCampaigns.slug, slug.toLowerCase())).limit(1);
    if (!campaign || campaign.status !== "published") return NextResponse.json({ error: "Community Rush not found." }, { status: 404 });
    const attestations = await db.select().from(rushAttestations).where(eq(rushAttestations.campaignId, campaign.id)).orderBy(desc(rushAttestations.issuedAt));
    return NextResponse.json({ attestations: attestations.map((row) => parseAttestation(row.attestationJson)).filter(Boolean) });
  } catch (error) {
    console.error("[GET /api/rushes/[slug]/attestations]", error);
    return NextResponse.json({ error: "Proof Marks are temporarily unavailable." }, { status: 503 });
  }
}

/**
 * Internal verifier ingestion only. This is deliberately not Clerk-authenticated
 * and never callable by a browser: it requires both a configured shared secret
 * and an Ed25519 signature made by the configured verifier public key.
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const secret = process.env.RUSH_VERIFIER_INGEST_SECRET;
  const publicKey = process.env.RUSH_VERIFIER_PUBLIC_KEY_PEM;
  if (!secret || !publicKey) return NextResponse.json({ error: "Verifier ingestion is not configured." }, { status: 503 });
  if (!isVerifierRequestAuthorized(req.headers.get("authorization"), secret)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { slug } = await params;
  try {
    await ensureDatabaseSchema();
    const [campaign] = await db.select().from(rushCampaigns).where(eq(rushCampaigns.slug, slug.toLowerCase())).limit(1);
    if (!campaign) return NextResponse.json({ error: "Community Rush not found." }, { status: 404 });
    const manifest = JSON.parse(campaign.manifestJson) as RushManifest;
    const body = await req.json() as unknown;
    const attestation = validateAttestationPayload(body, {
      id: campaign.id,
      status: campaign.status,
      verification: campaign.verification,
      manifestHash: campaign.manifestHash,
      manifest,
    });
    if (!verifyAttestationSignature(attestation, publicKey)) {
      return NextResponse.json({ error: "The verifier signature is invalid." }, { status: 400 });
    }

    const [existing] = await db.select().from(rushAttestations).where(and(eq(rushAttestations.campaignId, campaign.id), eq(rushAttestations.resultHash, attestation.resultHash))).limit(1);
    if (existing) {
      if (existing.signature !== attestation.signature) return NextResponse.json({ error: "A different Proof Mark already exists for this result." }, { status: 409 });
      return NextResponse.json({ attestation: parseAttestation(existing.attestationJson), replayed: true });
    }

    await db.insert(rushAttestations).values({
      id: randomUUID(), campaignId: campaign.id, manifestHash: attestation.manifestHash,
      arenaId: attestation.arenaId, winnerAddress: attestation.winnerAddress,
      resultHash: attestation.resultHash, issuedAt: new Date(attestation.issuedAt),
      verifierKeyId: attestation.verifierKeyId, signature: attestation.signature,
      attestationJson: JSON.stringify(attestation),
    });
    return NextResponse.json({ attestation, replayed: false }, { status: 201 });
  } catch (error) {
    if (error instanceof RushAttestationValidationError || error instanceof SyntaxError) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid attestation." }, { status: 400 });
    }
    console.error("[POST /api/rushes/[slug]/attestations]", error);
    return NextResponse.json({ error: "Could not store this Proof Mark." }, { status: 500 });
  }
}
