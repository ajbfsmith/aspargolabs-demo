-- Remove falsely attributed journeys (click_id with no bf-hezkue proof in webhooks),
-- simulation-linked journeys, and backfill journey UTMs from link_clicks.
-- Does not modify link_clicks or attribution_visits.

-- -----------------------------------------------------------------------------
-- 1. False-positive journeys: click_id set but Bask never sent bf-hezkue or click UUID
-- -----------------------------------------------------------------------------

CREATE TEMP TABLE _false_click_journeys ON COMMIT DROP AS
SELECT j.id, j.session_id, j.patient_id
FROM bask_patient_journeys j
WHERE j.click_id IS NOT NULL
  AND COALESCE(j.utm_campaign, '') NOT ILIKE 'bf-hezkue%'
  AND (
    j.campaign_id IS NULL
    OR j.campaign_id NOT IN (
      'fed96c9a-97ce-4d43-a556-30d3d45f1212',
      'e5d65151-a3e8-48e5-84ca-e6cd899ee3d1',
      '6870ca18-de76-4f13-80ed-9964f5cfd326',
      'd229d2cb-2e50-456c-8e34-c09b51a3559d',
      '6a8bde55-de8f-472d-8025-44d93bf051a3',
      '7aae963c-f4df-4925-93f2-4cea2a12965c'
    )
  )
  AND NOT EXISTS (
    SELECT 1
    FROM bask_webhook_events w
    WHERE w.session_id = j.session_id
      AND (
        w.payload::text ILIKE '%bf-hezkue%'
        OR w.payload::text ILIKE '%' || j.click_id || '%'
      )
  );

-- -----------------------------------------------------------------------------
-- 2. Simulation-linked journeys
-- -----------------------------------------------------------------------------

CREATE TEMP TABLE _sim_journeys ON COMMIT DROP AS
SELECT j.id, j.session_id, j.patient_id
FROM bask_patient_journeys j
INNER JOIN link_clicks lc ON lc.id = j.click_id
WHERE lc.is_simulation = true;

CREATE TEMP TABLE _purge_journeys ON COMMIT DROP AS
SELECT id, session_id, patient_id FROM _false_click_journeys
UNION
SELECT id, session_id, patient_id FROM _sim_journeys;

DELETE FROM bask_journey_events
WHERE journey_id IN (SELECT id FROM _purge_journeys);

DELETE FROM bask_patient_journeys
WHERE id IN (SELECT id FROM _purge_journeys);

DELETE FROM bask_webhook_events w
WHERE w.session_id IN (
  SELECT session_id FROM _purge_journeys WHERE session_id IS NOT NULL
)
AND NOT EXISTS (
  SELECT 1 FROM bask_patient_journeys j WHERE j.session_id = w.session_id
);

DELETE FROM bask_patients p
WHERE NOT EXISTS (
  SELECT 1 FROM bask_patient_journeys j WHERE j.patient_id = p.patient_id
);

-- -----------------------------------------------------------------------------
-- 3. Backfill journey UTMs from legitimately linked link_clicks
-- -----------------------------------------------------------------------------

UPDATE bask_patient_journeys j
SET
  campaign_id = lc.campaign_id,
  utm_source = lc.utm_source,
  utm_medium = lc.utm_medium,
  utm_campaign = lc.utm_campaign,
  utm_content = lc.utm_content,
  utm_term = lc.utm_term,
  attributed_at = COALESCE(j.attributed_at, j.created_at)
FROM link_clicks lc
WHERE j.click_id = lc.id
  AND j.utm_campaign IS NULL
  AND lc.utm_campaign ILIKE 'bf-hezkue%';
