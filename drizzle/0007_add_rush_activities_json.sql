-- Ordered campaign activities are stored alongside the immutable rules
-- manifest. This remains additive for deployments already patched at runtime.
ALTER TABLE rush_campaigns ADD COLUMN IF NOT EXISTS activities_json text NOT NULL DEFAULT '[]';
