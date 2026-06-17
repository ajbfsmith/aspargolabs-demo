-- =============================================================================
-- Bask attribution: clicks, patients, journeys, webhooks, timeline
-- campaign_id is opaque TEXT (Social Dash UUID) — no FK to external campaigns
-- =============================================================================

CREATE TABLE IF NOT EXISTS link_clicks (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    clicked_at TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    journey_id TEXT,
    session_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_link_clicks_campaign ON link_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_journey ON link_clicks(journey_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_session ON link_clicks(session_id);

CREATE TABLE IF NOT EXISTS bask_patients (
    patient_id TEXT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    latest_session_id TEXT,
    total_journeys INTEGER NOT NULL DEFAULT 0,
    total_conversions INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_bask_patients_email ON bask_patients(email);

CREATE TABLE IF NOT EXISTS bask_patient_journeys (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    patient_id TEXT REFERENCES bask_patients(patient_id),
    click_id TEXT REFERENCES link_clicks(id),
    campaign_id TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    attributed_at TEXT,
    funnel_stage TEXT NOT NULL DEFAULT 'patient_created',
    stage_updated_at TEXT NOT NULL,
    questionnaire_id TEXT,
    treatment_id TEXT,
    order_id TEXT,
    transaction_id TEXT,
    order_total_cents INTEGER,
    payment_amount_cents INTEGER,
    is_first_time_order INTEGER,
    test_mode INTEGER NOT NULL DEFAULT 0,
    magic_link TEXT,
    last_question_id TEXT,
    converted_at TEXT,
    conversion_credited INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bask_journeys_patient ON bask_patient_journeys(patient_id);
CREATE INDEX IF NOT EXISTS idx_bask_journeys_campaign ON bask_patient_journeys(campaign_id);
CREATE INDEX IF NOT EXISTS idx_bask_journeys_utm_campaign ON bask_patient_journeys(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_bask_journeys_stage ON bask_patient_journeys(funnel_stage);
CREATE INDEX IF NOT EXISTS idx_bask_journeys_click ON bask_patient_journeys(click_id);

CREATE TABLE IF NOT EXISTS bask_webhook_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    event_code TEXT,
    session_id TEXT,
    patient_id TEXT,
    payload JSONB NOT NULL,
    received_at TEXT NOT NULL,
    processed_at TEXT,
    processing_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_bask_webhook_session ON bask_webhook_events(session_id);
CREATE INDEX IF NOT EXISTS idx_bask_webhook_patient ON bask_webhook_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_bask_webhook_type ON bask_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_bask_webhook_received ON bask_webhook_events(received_at);

CREATE TABLE IF NOT EXISTS bask_journey_events (
    id TEXT PRIMARY KEY,
    journey_id TEXT NOT NULL REFERENCES bask_patient_journeys(id) ON DELETE CASCADE,
    webhook_event_id TEXT REFERENCES bask_webhook_events(id),
    event_type TEXT NOT NULL,
    event_code TEXT,
    summary TEXT,
    occurred_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bask_journey_events_journey ON bask_journey_events(journey_id);

ALTER TABLE link_clicks
    ADD CONSTRAINT fk_link_clicks_journey
    FOREIGN KEY (journey_id) REFERENCES bask_patient_journeys(id) ON DELETE SET NULL;
