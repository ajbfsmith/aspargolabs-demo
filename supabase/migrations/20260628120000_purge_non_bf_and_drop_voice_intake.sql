-- Purge non–bf-hezkue Bask attribution rows; drop voice intake tables.
-- Does not modify link_clicks or attribution_visits.

-- -----------------------------------------------------------------------------
-- 1. Keep only bf-hezkue journeys (and linked events / patients / webhooks)
-- -----------------------------------------------------------------------------

CREATE TEMP TABLE _bf_journeys ON COMMIT DROP AS
SELECT j.id, j.session_id, j.patient_id
FROM bask_patient_journeys j
WHERE j.utm_campaign ILIKE 'bf-hezkue%'
   OR j.campaign_id IN (
        'fed96c9a-97ce-4d43-a556-30d3d45f1212',
        'e5d65151-a3e8-48e5-84ca-e6cd899ee3d1',
        '6870ca18-de76-4f13-80ed-9964f5cfd326',
        'd229d2cb-2e50-456c-8e34-c09b51a3559d',
        '6a8bde55-de8f-472d-8025-44d93bf051a3',
        '7aae963c-f4df-4925-93f2-4cea2a12965c'
      )
   OR j.click_id IN (
        SELECT lc.id FROM link_clicks lc
        WHERE lc.utm_campaign ILIKE 'bf-hezkue%'
      );

DELETE FROM bask_journey_events
WHERE journey_id NOT IN (SELECT id FROM _bf_journeys);

DELETE FROM bask_patient_journeys
WHERE id NOT IN (SELECT id FROM _bf_journeys);

DELETE FROM bask_webhook_events w
WHERE NOT (
  w.session_id IN (SELECT session_id FROM _bf_journeys WHERE session_id IS NOT NULL)
  OR w.payload::text ILIKE '%bf-hezkue%'
);

DELETE FROM bask_patients p
WHERE NOT EXISTS (
  SELECT 1 FROM bask_patient_journeys j
  WHERE j.patient_id = p.patient_id
);

-- -----------------------------------------------------------------------------
-- 2. Drop voice intake tables (unused)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'call_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.call_sessions;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'intake_fields'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.intake_fields;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'intake_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.intake_events;
  END IF;
END $$;

DROP TABLE IF EXISTS public.final_reconciliations CASCADE;
DROP TABLE IF EXISTS public.captured_future_slots CASCADE;
DROP TABLE IF EXISTS public.intake_events CASCADE;
DROP TABLE IF EXISTS public.intake_fields CASCADE;
DROP TABLE IF EXISTS public.call_sessions CASCADE;

DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
