import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "./db";

let schemaPromise: Promise<void> | null = null;

async function safeStep(label: string, run: () => Promise<unknown>): Promise<void> {
  try {
    await run();
  } catch (err) {
    console.error(`[ensureSchema] ${label} failed:`, err);
  }
}

async function runSchemaStatements(): Promise<void> {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(url);

  await safeStep("rooms.questions_json", () =>
    sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS questions_json text`,
  );
  await safeStep("rooms.prize_pool", () =>
    sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS prize_pool integer DEFAULT 0`,
  );
  await safeStep("rooms.language", () =>
    sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS language text`,
  );
  await safeStep("rooms.starter_code", () =>
    sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS starter_code text`,
  );
  await safeStep("submissions.question_index", () =>
    sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS question_index integer DEFAULT 0`,
  );
  await safeStep("submissions.question_index backfill", () =>
    sql`UPDATE submissions SET question_index = 0 WHERE question_index IS NULL`,
  );
  await safeStep("users.last_seen_at", () =>
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at timestamp`,
  );
  await safeStep("users.coins_balance default", () =>
    sql`ALTER TABLE users ALTER COLUMN coins_balance SET DEFAULT 1000`,
  );
  await safeStep("launch coin backfill", () =>
    sql`
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
  );
  await safeStep("rooms.prize_pool backfill", () =>
    sql`UPDATE rooms SET prize_pool = 0 WHERE prize_pool IS NULL`,
  );
  await safeStep("rooms.prize_pool default", () =>
    sql`ALTER TABLE rooms ALTER COLUMN prize_pool SET DEFAULT 0`,
  );
  await safeStep("dismissed_recent_rooms table", () =>
    sql`
      CREATE TABLE IF NOT EXISTS dismissed_recent_rooms (
        user_id text NOT NULL REFERENCES users(id),
        room_id text NOT NULL,
        dismissed_at timestamp DEFAULT now() NOT NULL,
        PRIMARY KEY (user_id, room_id)
      )
    `,
  );
  await safeStep("rush_campaign enums", () =>
    sql`
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
  );
  await safeStep("rush_campaigns table", () =>
    sql`
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
  );
}

/** Ensures Neon has columns required by the current app code. */
export async function ensureDatabaseSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = runSchemaStatements().catch((err) => {
      schemaPromise = null;
      console.error("[ensureSchema] schema run failed:", err);
    });
  }
  await schemaPromise;
}
