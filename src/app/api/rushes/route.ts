export const dynamic = "force-dynamic";

import { randomUUID } from "crypto";
import { and, desc, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDatabaseSchema } from "@/lib/ensureSchema";
import { getSession, sessionUnavailable } from "@/lib/getSession";
import { requireClerkAuth } from "@/lib/requireAuth";
import {
  buildRushManifest,
  hashRushManifest,
  RushManifestValidationError,
  serializeRushManifest,
} from "@/lib/rushManifest";
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

/**
 * Returns published campaigns plus the signed-in organiser's drafts. There is
 * intentionally no unauthenticated draft discovery endpoint.
 */
export async function GET(req: Request) {
  const session = await getSession(req);

  try {
    await ensureDatabaseSchema();
  } catch (err) {
    console.error("[GET /api/rushes] schema:", err);
    return sessionUnavailable("Community Rush is temporarily unavailable.");
  }

  try {
    const where = session
      ? or(eq(rushCampaigns.status, "published"), eq(rushCampaigns.organizerId, session.id))
      : eq(rushCampaigns.status, "published");
    const campaigns = await db
      .select()
      .from(rushCampaigns)
      .where(where)
      .orderBy(desc(rushCampaigns.createdAt));

    return NextResponse.json({ campaigns: campaigns.map(campaignResponse) });
  } catch (err) {
    console.error("[GET /api/rushes]", err);
    return sessionUnavailable("Community Rush is temporarily unavailable.");
  }
}

/**
 * Creates an organiser-owned Rush draft, or publishes it in the same atomic
 * insert when `publish: true` is supplied. Publication records a canonical
 * manifest hash; this route never handles wallet or payout actions.
 */
export async function POST(req: Request) {
  const authResult = await requireClerkAuth(req);
  if (!authResult.ok) return authResult.response;

  try {
    await ensureDatabaseSchema();
  } catch (err) {
    console.error("[POST /api/rushes] schema:", err);
    return sessionUnavailable("Community Rush could not prepare storage.");
  }

  const session = await getSession(req);
  if (!session) return sessionUnavailable();

  try {
    const body = await req.json() as unknown;
    const id = randomUUID();
    const { campaign, manifest } = buildRushManifest(body, id);
    const now = new Date();
    const status = campaign.publish ? "published" : "draft";
    const manifestHash = campaign.publish ? hashRushManifest(manifest) : null;

    const [created] = await db
      .insert(rushCampaigns)
      .values({
        id,
        organizerId: session.id,
        slug: campaign.slug,
        name: manifest.title,
        community: campaign.community,
        summary: campaign.summary,
        status,
        verification: campaign.verification,
        manifestJson: serializeRushManifest(manifest),
        manifestHash,
        publishedAt: campaign.publish ? now : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({ campaign: campaignResponse(created) }, { status: 201 });
  } catch (err) {
    if (err instanceof RushManifestValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message.toLowerCase() : "";
    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json({ error: "That Community Rush slug is already in use." }, { status: 409 });
    }
    console.error("[POST /api/rushes]", err);
    return NextResponse.json({ error: "Could not create this Community Rush." }, { status: 500 });
  }
}
