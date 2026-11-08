-- Existing deployments receive additive schema updates through
-- `ensureDatabaseSchema` / `npm run db:patch`. Keep this Drizzle migration
-- forward-safe for a fresh database and for deployments already patched.
DO $$ BEGIN
  CREATE TYPE rush_campaign_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE rush_verification AS ENUM ('standard', 'verified');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
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
);
