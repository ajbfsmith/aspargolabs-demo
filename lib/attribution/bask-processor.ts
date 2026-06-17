import "server-only";

import { resolveClickIdFromWebhook } from "@/lib/attribution/click-resolution";
import {
  appendJourneyEvent,
  incrementPatientConversionCount,
  insertWebhookEvent,
  linkClickToJourney,
  getJourneyBySession,
  getLatestJourneyForPatient,
  markWebhookProcessed,
  resolveCampaignId,
  upsertJourney,
  upsertPatient,
  type JourneyFields,
} from "@/lib/attribution/attribution-store";

function nowIso(): string {
  return new Date().toISOString();
}

export function webhookEventId(body: Record<string, unknown>): string {
  if (body.id) return String(body.id);
  const text = JSON.stringify(body, Object.keys(body).sort());
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `hash-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function strId(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  return String(val);
}

function searchParams(data: Record<string, unknown>): Record<string, unknown> {
  const raw = data.signUpSearchParams ?? data.checkoutSearchParams ?? {};
  return typeof raw === "object" && raw !== null
    ? (raw as Record<string, unknown>)
    : {};
}

function utmFields(params: Record<string, unknown>) {
  return {
    utm_source: strId(params.utm_source),
    utm_medium: strId(params.utm_medium),
    utm_campaign: strId(params.utm_campaign),
    utm_content: strId(params.utm_content),
    utm_term: strId(params.utm_term),
  };
}

function contactFromData(data: Record<string, unknown>) {
  return {
    first_name: strId(data.patientFirstName),
    last_name: strId(data.patientLastName),
    email: strId(data.patientEmail),
    phone: strId(data.phoneNumber),
  };
}

export async function processBaskWebhookBody(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const eventType = strId(body.type) ?? "unknown";
  const data =
    typeof body.data === "object" && body.data !== null
      ? (body.data as Record<string, unknown>)
      : {};

  const eid = webhookEventId(body);
  const sessionId = strId(data.sessionId);
  const patientId = strId(data.patientId);
  const eventCode = data.eventCode;

  const inserted = await insertWebhookEvent({
    event_id: eid,
    event_type: eventType,
    event_code: strId(eventCode),
    session_id: sessionId,
    patient_id: patientId,
    payload: data,
  });

  if (!inserted) {
    return { status: "duplicate", event_id: eid };
  }

  try {
    const result = await applyEvent(
      eventType,
      data,
      eid,
      sessionId,
      patientId,
      eventCode,
    );
    await markWebhookProcessed(eid);
    return { status: "ok", event_id: eid, ...result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[bask-processor]", eid, err);
    await markWebhookProcessed(eid, message);
    throw err;
  }
}

async function applyEvent(
  eventType: string,
  data: Record<string, unknown>,
  webhookEventIdValue: string,
  sessionId: string | null,
  patientId: string | null,
  eventCode: unknown,
): Promise<Record<string, unknown>> {
  const contact = contactFromData(data);
  const params = searchParams(data);
  const utms = utmFields(params);

  if (patientId) {
    await upsertPatient({
      patient_id: patientId,
      session_id: sessionId,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
    });
  }

  let journey = sessionId ? await getJourneyBySession(sessionId) : null;
  if (!journey && patientId) {
    journey = await getLatestJourneyForPatient(patientId);
    if (journey) sessionId = journey.session_id;
  }

  if (!sessionId && eventType === "newPatient") {
    sessionId = strId(data.sessionId) ?? crypto.randomUUID();
  }

  if (!sessionId) {
    return { skipped: true, reason: "no session_id" };
  }

  const journeyFields: JourneyFields = { session_id: sessionId };
  if (patientId) journeyFields.patient_id = patientId;

  if (!journey) {
    const campaignId = await resolveCampaignId(params, utms.utm_campaign);
    const clickId = await resolveClickIdFromWebhook(params, {
      campaign_id: campaignId,
      utms,
    });
    Object.assign(journeyFields, utms);
    journeyFields.click_id = clickId;
    journeyFields.campaign_id = campaignId;
    if (campaignId) journeyFields.attributed_at = nowIso();
    journeyFields.questionnaire_id = strId(data.questionnaireId);
  }

  let summary = eventType;
  let newStage: string | null = null;

  if (eventType === "newPatient") {
    newStage = "patient_created";
    summary = "Patient account created";
    if (!journeyFields.click_id) {
      const campaignId =
        journeyFields.campaign_id ??
        (await resolveCampaignId(params, utms.utm_campaign));
      journeyFields.click_id = await resolveClickIdFromWebhook(params, {
        campaign_id: campaignId,
        utms,
      });
    }
  } else if (eventType === "abandonedSession") {
    newStage = "abandoned";
    summary = "Questionnaire session abandoned";
    journeyFields.magic_link = strId(data.magicLink);
    journeyFields.last_question_id = strId(data.lastQuestionId);
  } else if (eventType === "newTreatment") {
    newStage = "treatment_started";
    summary = "Treatment created (checkout submitted)";
    journeyFields.treatment_id = strId(data.treatmentId);
  } else if (eventType === "treatmentUpdated") {
    const code = eventCode ? String(eventCode).toLowerCase() : "";
    if (code === "questionnaire_completed") {
      newStage = "questionnaire_completed";
      summary = "Questionnaire completed";
    } else if (code === "rx_written") {
      newStage = "rx_written";
      summary = "Prescription written";
    } else if (code === "rx_denied") {
      newStage = "rx_denied";
      summary = "Prescription denied";
    } else {
      summary = `Treatment updated (${code || "unknown"})`;
    }
    journeyFields.treatment_id = strId(data.treatmentId);
  } else if (eventType === "newOrder") {
    newStage = "order_placed";
    summary = "Order placed";
    journeyFields.order_id = strId(data.orderId);
    journeyFields.treatment_id = strId(data.treatmentId);
    journeyFields.transaction_id = strId(data.transactionId);
    if (data.orderTotal !== undefined && data.orderTotal !== null) {
      journeyFields.order_total_cents = Number(data.orderTotal);
    }
    if (data.isFirstTimeOrder !== undefined) {
      journeyFields.is_first_time_order = data.isFirstTimeOrder ? 1 : 0;
    }
    if (!journeyFields.campaign_id) {
      const cid = await resolveCampaignId(params, utms.utm_campaign);
      if (cid) journeyFields.campaign_id = cid;
    }
  } else if (eventType === "orderShipped") {
    newStage = "shipped";
    summary = "Order shipped";
    journeyFields.order_id = strId(data.orderId);
  } else if (eventType === "paymentSucceeded") {
    newStage = "payment_succeeded";
    summary = "Payment succeeded";
    if (data.amount !== undefined && data.amount !== null) {
      journeyFields.payment_amount_cents = Number(data.amount);
    }
    journeyFields.transaction_id = strId(data.transactionId);
    journeyFields.test_mode = data.testMode === true ? 1 : 0;
  } else if (eventType === "paymentFailed" || eventType === "paymentCanceled") {
    newStage = "payment_failed";
    summary = eventType;
    journeyFields.test_mode = data.testMode === true ? 1 : 0;
  } else if (eventType === "paymentRefunded") {
    newStage = "refunded";
    summary = "Payment refunded";
  } else if (eventType === "magicLink") {
    summary = "Magic link sent";
    journeyFields.magic_link = strId(data.magicLink ?? data.magicLinkCode);
  } else {
    summary = `Bask event: ${eventType}`;
  }

  if (newStage) journeyFields.funnel_stage = newStage;

  const updatedJourney = await upsertJourney(journeyFields);

  if (eventType === "paymentSucceeded") {
    const testMode = data.testMode === true;
    const isFirst =
      updatedJourney.is_first_time_order === null ||
      updatedJourney.is_first_time_order === undefined
        ? 1
        : updatedJourney.is_first_time_order;
    const already = updatedJourney.conversion_credited;
    if (!testMode && isFirst && !already) {
      await upsertJourney({
        session_id: sessionId,
        conversion_credited: 1,
        converted_at: nowIso(),
        funnel_stage: "payment_succeeded",
      });
      if (patientId) {
        await incrementPatientConversionCount(patientId);
      }
    }
  }

  const clickId = updatedJourney.click_id ?? journeyFields.click_id ?? null;
  if (clickId) {
    await linkClickToJourney(clickId, updatedJourney.id, sessionId);
  }

  await appendJourneyEvent({
    journey_id: updatedJourney.id,
    webhook_event_id: webhookEventIdValue,
    event_type: eventType,
    event_code: strId(eventCode),
    summary,
  });

  return {
    journey_id: updatedJourney.id,
    session_id: sessionId,
  };
}
