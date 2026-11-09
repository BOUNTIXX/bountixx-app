export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDatabaseSchema } from "@/lib/ensureSchema";
import { getSession, sessionUnavailable } from "@/lib/getSession";
import { rushCampaigns } from "@/lib/schema";
import {
  buildRushManifest,
  hashRushManifest,
  RushManifestValidationError,
  serializeRushManifest,
} from "@/lib/rushManifest";
import { requireClerkAuth } from "@/lib/requireAuth";
import type { CommunityRushActivity } from "@/lib/rushCampaign";

function activitiesFromJson(value: string): CommunityRushActivity[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as CommunityRushActivity[] : [];
  } catch {
    return [];
  }
}

function campaignResponse(campaign: typeof rushCampaigns.$inferSelect, isOwner = false) {
  return {
    id: campaign.id,
    slug: campaign.slug,
    name: campaign.name,
    community: campaign.community,
    summary: campaign.summary,
    status: campaign.status,
    verification: campaign.verification,
    manifest: JSON.parse(campaign.manifestJson) as unknown,
    activities: activitiesFromJson(campaign.activitiesJson),
    manifestHash: campaign.manifestHash,
    publishedAt: campaign.publishedAt,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
    isOwner,
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

    return NextResponse.json({ campaign: campaignResponse(campaign, campaign.organizerId === session?.id) });
  } catch (err) {
    console.error("[GET /api/rushes/[slug]]", err);
    return sessionUnavailable("Community Rush is temporarily unavailable.");
  }
}

/**
 * Replaces an organiser's draft or locks it as a published proof record.
 * Published manifests are intentionally never editable through this route.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const authResult = await requireClerkAuth(req);
  if (!authResult.ok) return authResult.response;

  const { slug } = await params;

  try {
    await ensureDatabaseSchema();
    const session = await getSession(req);
    if (!session) return sessionUnavailable();

    const [existing] = await db
      .select()
      .from(rushCampaigns)
      .where(eq(rushCampaigns.slug, slug.toLowerCase()))
      .limit(1);

    if (!existing || existing.organizerId !== session.id) {
      return NextResponse.json({ error: "Community Rush not found." }, { status: 404 });
    }
    if (existing.status !== "draft") {
      return NextResponse.json(
        { error: "Published Community Rush manifests are locked. Create a successor campaign for a new version." },
        { status: 409 },
      );
    }

    const body = await req.json() as unknown;
    const { campaign, manifest } = buildRushManifest(body, existing.id);
    if (campaign.slug !== existing.slug) {
      return NextResponse.json({ error: "A draft slug cannot be changed after creation." }, { status: 400 });
    }

    const now = new Date();
    const status = campaign.publish ? "published" : "draft";
    const [updated] = await db
      .update(rushCampaigns)
      .set({
        name: manifest.title,
        community: campaign.community,
        summary: campaign.summary,
        status,
        verification: campaign.verification,
        manifestJson: serializeRushManifest(manifest),
        activitiesJson: JSON.stringify(campaign.activities),
        manifestHash: campaign.publish ? hashRushManifest(manifest) : null,
        publishedAt: campaign.publish ? now : null,
        updatedAt: now,
      })
      .where(eq(rushCampaigns.id, existing.id))
      .returning();

    return NextResponse.json({ campaign: campaignResponse(updated, true) });
  } catch (err) {
    if (err instanceof RushManifestValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[PATCH /api/rushes/[slug]]", err);
    return NextResponse.json({ error: "Could not save this Community Rush." }, { status: 500 });
  }
}
