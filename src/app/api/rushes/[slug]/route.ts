export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDatabaseSchema } from "@/lib/ensureSchema";
import { getSession, sessionUnavailable } from "@/lib/getSession";
import { rushCampaigns } from "@/lib/schema";

function campaignResponse(campaign: typeof rushCampaigns.$inferSelect) {
  return {
    id: campaign.id,
    slug: campaign.slug,
    name: campaign.name,
    community: campaign.community,
    summary: campaign.summary,
    status: campaign.status,
    verification: campaign.verification,
    manifest: JSON.parse(campaign.manifestJson) as unknown,
    manifestHash: campaign.manifestHash,
    publishedAt: campaign.publishedAt,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
  };
}

/** Public for published proof records; drafts are visible only to their organiser. */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession(req);

  try {
    await ensureDatabaseSchema();
    const [campaign] = await db
      .select()
      .from(rushCampaigns)
      .where(eq(rushCampaigns.slug, slug.toLowerCase()))
      .limit(1);

    if (!campaign || (campaign.status !== "published" && campaign.organizerId !== session?.id)) {
      return NextResponse.json({ error: "Community Rush not found." }, { status: 404 });
    }

    return NextResponse.json({ campaign: campaignResponse(campaign) });
  } catch (err) {
    console.error("[GET /api/rushes/[slug]]", err);
    return sessionUnavailable("Community Rush is temporarily unavailable.");
  }
}
