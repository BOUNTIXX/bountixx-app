export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { RushManifest } from "@bountixx/rush-sdk";
import { db } from "@/lib/db";
import { ensureDatabaseSchema } from "@/lib/ensureSchema";
import { isVerifierRequestAuthorized } from "@/lib/rushAttestation";
import { rushCampaigns } from "@/lib/schema";

/**
 * Private verifier-only manifest reader. It deliberately accepts campaign IDs
 * rather than public slugs and returns only a published, locked Verified Rush.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const secret = process.env.RUSH_VERIFIER_MANIFEST_SECRET;
  if (!secret) return NextResponse.json({ error: "Verifier manifest access is not configured." }, { status: 503 });
  if (!isVerifierRequestAuthorized(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers: { "cache-control": "no-store" } });
  }

  const { campaignId } = await params;
  const arenaId = new URL(req.url).searchParams.get("arenaId");
  if (!arenaId || arenaId.length > 128) {
    return NextResponse.json({ error: "arenaId is required." }, { status: 400, headers: { "cache-control": "no-store" } });
  }

  try {
    await ensureDatabaseSchema();
    const [campaign] = await db.select().from(rushCampaigns).where(eq(rushCampaigns.id, campaignId)).limit(1);
    if (!campaign || campaign.status !== "published" || campaign.verification !== "verified" || !campaign.manifestHash) {
      return NextResponse.json({ error: "Locked manifest not found." }, { status: 404, headers: { "cache-control": "no-store" } });
    }
    const manifest = JSON.parse(campaign.manifestJson) as RushManifest;
    if (manifest.campaignId !== campaign.id || manifest.arenaId !== arenaId) {
      return NextResponse.json({ error: "Locked manifest not found." }, { status: 404, headers: { "cache-control": "no-store" } });
    }
    return NextResponse.json(
      { manifest, manifestHash: campaign.manifestHash },
      { headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } },
    );
  } catch (error) {
    console.error("[GET /api/internal/rush-manifests/[campaignId]]", error);
    return NextResponse.json({ error: "Locked manifest reader is unavailable." }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
