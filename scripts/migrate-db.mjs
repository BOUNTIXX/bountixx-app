#!/usr/bin/env node
/**
 * Apply idempotent schema patches to Neon (rooms + users columns).
 * Usage: DATABASE_URL=postgresql://... node scripts/migrate-db.mjs
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);

const steps = [
  ["questions_json", () => sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS questions_json text`],
  ["prize_pool", () => sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS prize_pool integer DEFAULT 0`],
  ["language", () => sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS language text`],
  ["starter_code", () => sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS starter_code text`],
  ["last_seen_at", () => sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at timestamp`],
  ["coins default", () => sql`ALTER TABLE users ALTER COLUMN coins_balance SET DEFAULT 1000`],
  [
    "launch coin backfill",
    () => sql`
      UPDATE users u
      SET coins_balance = 1000
      WHERE u.coins_balance < 1000
        AND NOT EXISTS (
          SELECT 1
          FROM coin_transactions ct
          WHERE ct.user_id = u.id
            AND ct.reference = 'main_event_launch'
            AND ct.type = 'gifted'
        )
    `,
  ],
  ["prize_pool backfill", () => sql`UPDATE rooms SET prize_pool = 0 WHERE prize_pool IS NULL`],
  ["prize_pool default", () => sql`ALTER TABLE rooms ALTER COLUMN prize_pool SET DEFAULT 0`],
  [
    "rush campaign enums",
    () => sql`
      DO $$ BEGIN
        CREATE TYPE rush_campaign_status AS ENUM ('draft', 'published', 'archived');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE rush_verification AS ENUM ('standard', 'verified');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `,
  ],
  [
    "rush_campaigns table",
    () => sql`
      CREATE TABLE IF NOT EXISTS rush_campaigns (
        id text PRIMARY KEY,
        organizer_id text NOT NULL REFERENCES users(id),
        slug text NOT NULL UNIQUE,
        name text NOT NULL,
        community text NOT NULL,
        summary text NOT NULL,
        status rush_campaign_status NOT NULL DEFAULT 'draft',
        verification rush_verification NOT NULL DEFAULT 'standard',
        manifest_json text NOT NULL,
        manifest_hash text,
        published_at timestamp,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `,
  ],
  [
    "rush_campaigns.activities_json",
    () => sql`ALTER TABLE rush_campaigns ADD COLUMN IF NOT EXISTS activities_json text NOT NULL DEFAULT '[]'`,
  ],
  [
    "rush_attestations table",
    () => sql`
      CREATE TABLE IF NOT EXISTS rush_attestations (
        id text PRIMARY KEY,
        campaign_id text NOT NULL REFERENCES rush_campaigns(id),
        manifest_hash text NOT NULL,
        arena_id text NOT NULL,
        winner_address text NOT NULL,
        result_hash text NOT NULL,
        issued_at timestamp NOT NULL,
        verifier_key_id text NOT NULL,
        signature text NOT NULL,
        attestation_json text NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        UNIQUE (campaign_id, result_hash)
      )
    `,
  ],
];

for (const [label, run] of steps) {
  console.log(`→ ${label}`);
  await run();
}

console.log("✓ Database schema is up to date");
