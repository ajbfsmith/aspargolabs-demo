import "server-only";

import { supabaseAdmin } from "@/utils/supabase/admin";
import type { Json } from "@/types/database.types";
import {
  getDefaultCampaignId,
  isLandingCampaignSlug,
} from "@/lib/attribution/config";

export type LinkClickRow = {
  id: string;
  campaign_id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  clicked_at: string;
  ip: string | null;
  user_agent: string | null;
  journey_id: string | null;
  session_id: string | null;
};

export type JourneyRow = {
  id: string;
  session_id: string;
  patient_id: string | null;
  click_id: string | null;
  campaign_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  attributed_at: string | null;
  funnel_stage: string;
  stage_updated_at: string;
  questionnaire_id: string | null;
  treatment_id: string | null;
  order_id: string | null;
  transaction_id: string | null;
  order_total_cents: number | null;
  payment_amount_cents: number | null;
  is_first_time_order: number | null;
  test_mode: number;
  magic_link: string | null;
  last_question_id: string | null;
  converted_at: string | null;
  conversion_credited: number;
  created_at: string;
  updated_at: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

const FUNNEL_RANK: Record<string, number> = {
  click_logged: 0,
  patient_created: 1,
  treatment_started: 2,
  questionnaire_completed: 3,
  rx_written: 4,
  rx_denied: 4,
  order_placed: 5,
  payment_succeeded: 6,
  shipped: 7,
  abandoned: 8,
  payment_failed: 8,
  refunded: 8,
};

function shouldAdvanceStage(current: string, next: string): boolean {
  if (next === "abandoned" || next === "payment_failed" || next === "refunded") {
    return true;
  }
  return (FUNNEL_RANK[next] ?? 0) >= (FUNNEL_RANK[current] ?? 0);
}

export async function insertLinkClick(input: {
  click_id: string;
  campaign_id: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  ip?: string | null;
  user_agent?: string | null;
}): Promise<{ id: string; clicked_at: string }> {
  const clicked_at = nowIso();
  const { error } = await supabaseAdmin.from("link_clicks").insert({
    id: input.click_id,
    campaign_id: input.campaign_id,
    utm_source: input.utm_source ?? null,
    utm_medium: input.utm_medium ?? null,
    utm_campaign: input.utm_campaign ?? null,
    utm_content: input.utm_content ?? null,
    utm_term: input.utm_term ?? null,
    clicked_at,
    ip: input.ip ?? null,
    user_agent: input.user_agent ?? null,
  } as never);

  if (error) {
    throw new Error(`insertLinkClick failed: ${error.message}`);
  }
  return { id: input.click_id, clicked_at };
}

export async function getLinkClick(clickId: string): Promise<LinkClickRow | null> {
  const { data, error } = await supabaseAdmin
    .from("link_clicks")
    .select("*")
    .eq("id", clickId)
    .maybeSingle();

  if (error) throw new Error(`getLinkClick failed: ${error.message}`);
  return (data as LinkClickRow | null) ?? null;
}

export async function findRecentUnlinkedClick(input: {
  campaign_id?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  max_age_hours?: number;
}): Promise<string | null> {
  const maxAgeHours = input.max_age_hours ?? 48;
  const cutoff = new Date(
    Date.now() - maxAgeHours * 60 * 60 * 1000,
  ).toISOString();

  let query = supabaseAdmin
    .from("link_clicks")
    .select("id")
    .is("journey_id", null)
    .gte("clicked_at", cutoff)
    .order("clicked_at", { ascending: false })
    .limit(1);

  if (input.campaign_id) {
    query = query.eq("campaign_id", input.campaign_id);
  }
  if (input.utm_source) {
    query = query.eq("utm_source", input.utm_source);
  }
  if (input.utm_medium) {
    query = query.eq("utm_medium", input.utm_medium);
  }
  if (input.utm_campaign) {
    query = query.eq("utm_campaign", input.utm_campaign);
  }
  if (input.utm_content) {
    query = query.eq("utm_content", input.utm_content);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(`findRecentUnlinkedClick failed: ${error.message}`);
  }
  return (data as { id: string } | null)?.id ?? null;
}

export async function linkClickToJourney(
  clickId: string,
  journeyId: string,
  sessionId: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("link_clicks")
    .update({ journey_id: journeyId, session_id: sessionId } as never)
    .eq("id", clickId);

  if (error) throw new Error(`linkClickToJourney failed: ${error.message}`);
}

export async function insertWebhookEvent(input: {
  event_id: string;
  event_type: string;
  event_code?: string | null;
  session_id?: string | null;
  patient_id?: string | null;
  payload: Record<string, unknown>;
}): Promise<boolean> {
  const { data: existing } = await supabaseAdmin
    .from("bask_webhook_events")
    .select("id")
    .eq("id", input.event_id)
    .maybeSingle();

  if (existing) return false;

  const { error } = await supabaseAdmin.from("bask_webhook_events").insert({
    id: input.event_id,
    event_type: input.event_type,
    event_code: input.event_code ?? null,
    session_id: input.session_id ?? null,
    patient_id: input.patient_id ?? null,
    payload: input.payload as Json,
    received_at: nowIso(),
  } as never);

  if (error) throw new Error(`insertWebhookEvent failed: ${error.message}`);
  return true;
}

export async function markWebhookProcessed(
  eventId: string,
  errorMessage?: string | null,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("bask_webhook_events")
    .update({
      processed_at: nowIso(),
      processing_error: errorMessage ?? null,
    } as never)
    .eq("id", eventId);

  if (error) throw new Error(`markWebhookProcessed failed: ${error.message}`);
}

export async function resolveCampaignId(
  params: Record<string, unknown>,
  utmCampaign: string | null | undefined,
): Promise<string | null> {
  for (const key of ["sd_click", "sd_click_id"]) {
    const raw = params[key];
    if (raw) {
      const click = await getLinkClick(String(raw));
      if (click?.campaign_id) return click.campaign_id;
    }
  }
  if (isLandingCampaignSlug(utmCampaign ?? null)) {
    try {
      return getDefaultCampaignId();
    } catch {
      return null;
    }
  }
  return null;
}

export async function getJourneyBySession(
  sessionId: string,
): Promise<JourneyRow | null> {
  const { data, error } = await supabaseAdmin
    .from("bask_patient_journeys")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) throw new Error(`getJourneyBySession failed: ${error.message}`);
  return (data as JourneyRow | null) ?? null;
}

export async function getJourneyById(journeyId: string): Promise<JourneyRow | null> {
  const { data, error } = await supabaseAdmin
    .from("bask_patient_journeys")
    .select("*")
    .eq("id", journeyId)
    .maybeSingle();

  if (error) throw new Error(`getJourneyById failed: ${error.message}`);
  return (data as JourneyRow | null) ?? null;
}

export async function getLatestJourneyForPatient(
  patientId: string,
): Promise<JourneyRow | null> {
  const { data, error } = await supabaseAdmin
    .from("bask_patient_journeys")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`getLatestJourneyForPatient failed: ${error.message}`);
  }
  return (data as JourneyRow | null) ?? null;
}

export async function upsertPatient(input: {
  patient_id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  session_id?: string | null;
}): Promise<void> {
  const now = nowIso();
  const { data: existing } = await supabaseAdmin
    .from("bask_patients")
    .select("*")
    .eq("patient_id", input.patient_id)
    .maybeSingle();

  if (existing) {
    const updates: Record<string, unknown> = {
      last_seen_at: now,
      updated_at: now,
    };
    if (input.first_name) updates.first_name = input.first_name;
    if (input.last_name) updates.last_name = input.last_name;
    if (input.email) updates.email = input.email;
    if (input.phone) updates.phone = input.phone;
    if (input.session_id) updates.latest_session_id = input.session_id;

    const { error } = await supabaseAdmin
      .from("bask_patients")
      .update(updates as never)
      .eq("patient_id", input.patient_id);
    if (error) throw new Error(`upsertPatient update failed: ${error.message}`);
    return;
  }

  const { error } = await supabaseAdmin.from("bask_patients").insert({
    patient_id: input.patient_id,
    first_name: input.first_name ?? null,
    last_name: input.last_name ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    first_seen_at: now,
    last_seen_at: now,
    updated_at: now,
    latest_session_id: input.session_id ?? null,
  } as never);

  if (error) throw new Error(`upsertPatient insert failed: ${error.message}`);
}

async function incrementPatientJourneyCount(patientId: string): Promise<void> {
  const { data } = await supabaseAdmin
    .from("bask_patients")
    .select("total_journeys")
    .eq("patient_id", patientId)
    .maybeSingle();

  const current = (data as { total_journeys?: number } | null)?.total_journeys ?? 0;
  const { error } = await supabaseAdmin
    .from("bask_patients")
    .update({
      total_journeys: current + 1,
      updated_at: nowIso(),
    } as never)
    .eq("patient_id", patientId);

  if (error) {
    throw new Error(`incrementPatientJourneyCount failed: ${error.message}`);
  }
}

export async function incrementPatientConversionCount(
  patientId: string,
): Promise<void> {
  const { data } = await supabaseAdmin
    .from("bask_patients")
    .select("total_conversions")
    .eq("patient_id", patientId)
    .maybeSingle();

  const current =
    (data as { total_conversions?: number } | null)?.total_conversions ?? 0;
  const { error } = await supabaseAdmin
    .from("bask_patients")
    .update({
      total_conversions: current + 1,
      updated_at: nowIso(),
    } as never)
    .eq("patient_id", patientId);

  if (error) {
    throw new Error(`incrementPatientConversionCount failed: ${error.message}`);
  }
}

export type JourneyFields = Partial<JourneyRow> & { session_id: string };

export async function upsertJourney(fields: JourneyFields): Promise<JourneyRow> {
  const sessionId = fields.session_id;
  const now = nowIso();
  const existing = await getJourneyBySession(sessionId);

  if (existing) {
    const updates: Record<string, unknown> = { updated_at: now };
    for (const [key, val] of Object.entries(fields)) {
      if (key === "session_id" || key === "id" || val === undefined || val === null) {
        continue;
      }
      if (key === "funnel_stage") {
        if (shouldAdvanceStage(existing.funnel_stage, String(val))) {
          updates.funnel_stage = val;
          updates.stage_updated_at = now;
        }
        continue;
      }
      updates[key] = val;
    }

    const { error } = await supabaseAdmin
      .from("bask_patient_journeys")
      .update(updates as never)
      .eq("id", existing.id);

    if (error) throw new Error(`upsertJourney update failed: ${error.message}`);
    return (await getJourneyById(existing.id)) ?? existing;
  }

  const journeyId = crypto.randomUUID();
  const stage = fields.funnel_stage ?? "patient_created";
  const { error } = await supabaseAdmin.from("bask_patient_journeys").insert({
    id: journeyId,
    session_id: sessionId,
    patient_id: fields.patient_id ?? null,
    click_id: fields.click_id ?? null,
    campaign_id: fields.campaign_id ?? null,
    utm_source: fields.utm_source ?? null,
    utm_medium: fields.utm_medium ?? null,
    utm_campaign: fields.utm_campaign ?? null,
    utm_content: fields.utm_content ?? null,
    utm_term: fields.utm_term ?? null,
    attributed_at: fields.attributed_at ?? null,
    funnel_stage: stage,
    stage_updated_at: now,
    questionnaire_id: fields.questionnaire_id ?? null,
    treatment_id: fields.treatment_id ?? null,
    order_id: fields.order_id ?? null,
    transaction_id: fields.transaction_id ?? null,
    order_total_cents: fields.order_total_cents ?? null,
    payment_amount_cents: fields.payment_amount_cents ?? null,
    is_first_time_order: fields.is_first_time_order ?? null,
    test_mode: fields.test_mode ?? 0,
    magic_link: fields.magic_link ?? null,
    last_question_id: fields.last_question_id ?? null,
    converted_at: fields.converted_at ?? null,
    conversion_credited: fields.conversion_credited ?? 0,
    created_at: now,
    updated_at: now,
  } as never);

  if (error) throw new Error(`upsertJourney insert failed: ${error.message}`);

  if (fields.patient_id) {
    await incrementPatientJourneyCount(fields.patient_id);
  }

  return (await getJourneyById(journeyId)) ?? {
    id: journeyId,
    session_id: sessionId,
    funnel_stage: stage,
  } as JourneyRow;
}

export async function appendJourneyEvent(input: {
  journey_id: string;
  webhook_event_id?: string | null;
  event_type: string;
  event_code?: string | null;
  summary: string;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("bask_journey_events").insert({
    id: crypto.randomUUID(),
    journey_id: input.journey_id,
    webhook_event_id: input.webhook_event_id ?? null,
    event_type: input.event_type,
    event_code: input.event_code ?? null,
    summary: input.summary,
    occurred_at: nowIso(),
  } as never);

  if (error) throw new Error(`appendJourneyEvent failed: ${error.message}`);
}
