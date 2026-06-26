-- Standalone inbound visit logging (email, social, /go links). Not linked to link_clicks.

CREATE TABLE IF NOT EXISTS attribution_visits (
    id TEXT PRIMARY KEY,
    utm_source TEXT NOT NULL,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    dest_path TEXT NOT NULL DEFAULT '/',
    referrer TEXT,
    visited_at TIMESTAMPTZ NOT NULL,
    ip TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_attribution_visits_source ON attribution_visits(utm_source);
CREATE INDEX IF NOT EXISTS idx_attribution_visits_campaign ON attribution_visits(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_attribution_visits_visited_at ON attribution_visits(visited_at);
