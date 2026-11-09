export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDatabaseSchema } from "@/lib/ensureSchema";
import { readVaultCampaign } from "@/lib/rushVault";
import { rushCampaigns } from "@/lib/schema";

/**
 * Public, read-only Rush Vault status for a published Verified Rush. It reads
 * Stellar Testnet through an unsigned simulation and never accepts a key,
 * builds a payment, or submits a transaction.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    await ensureDatabaseSchema();
    const [campaign] = await db
      .select({ id: rushCampaigns.id, status: rushCampaigns.status, verification: rushCampaigns.verification, manifestHash: rushCampaigns.manifestHash })
      .from(rushCampaigns)
      .where(eq(rushCampaigns.slug, slug.toLowerCase()))
      .limit(1);

    if (!campaign || campaign.status !== "published" || campaign.verification !== "verified") {
      return NextResponse.json({ error: "No Verified Rush vault record exists for this campaign." }, { status: 404 });
    }

    const vault = await readVaultCampaign({ campaignId: campaign.id, manifestHash: campaign.manifestHash });
    return NextResponse.json({ vault }, { headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=60" } });
  } catch (err) {
    console.error("[GET /api/rushes/[slug]/vault]", err);
    return NextResponse.json({ error: "The Testnet vault could not be read right now." }, { status: 502 });
  }
}
