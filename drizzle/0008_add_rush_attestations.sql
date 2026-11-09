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
);
