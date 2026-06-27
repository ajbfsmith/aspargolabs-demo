-- Internal flag: simulation/test clicks. Never sent to Bask or exposed in redirect URLs.
ALTER TABLE link_clicks
    ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT false;

-- One-time: mark all existing rows as simulation (pre-production test data).
UPDATE link_clicks SET is_simulation = true WHERE is_simulation = false;
