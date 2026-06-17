import "server-only";

import { resolveClickIdFromWebhook } from "@/lib/attribution/click-resolution";
import {
  baskWebhookError,
  baskWebhookLog,
} from "@/lib/attribution/bask-webhook-log";
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

function strId(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  return String(val);
}

export function webhookEventId(body: Record<string, unknown>): string {
  if (body.eventId) return String(body.eventId);
  if (body.id) return String(body.id);
  const text = JSON.stringify(body, Object.keys(body).sort());
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `hash-${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

/** Bask docs use `data`; subscriber envelopes may use `params` instead. */
export function extractWebhookEventData(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const candidates = [body.data, body.params];
  for (const raw of candidates) {
    if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
      return raw as Record<string, unknown>;
    }
  }
  return {};
}

export function extractWebhookEventType(body: Record<string, unknown>): string {
  return strId(body.type) ?? strId(body.event) ?? "unknown";
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
  requestId = "no-request-id",
): Promise<Record<string, unknown>> {
  const eventType = extractWebhookEventType(body);
  const data = extractWebhookEventData(body);
  const bodyKeys = Object.keys(body);
  const dataKeys = Object.keys(data);
  const dataSource = typeof body.data === "object" && body.data !== null
    ? "data"
    : typeof body.params === "object" && body.params !== null
      ? "params"
      : "none";

  const eid = webhookEventId(body);
  const sessionId = strId(data.sessionId);
  const patientId = strId(data.patientId);
  const eventCode = data.eventCode;

  baskWebhookLog(requestId, "processor.parsed", {
    eventId: eid,
    eventType,
    dataSource,
    bodyKeys,
    dataKeys,
    sessionId,
    patientId,
    eventCode: strId(eventCode),
    signUpSearchParams: data.signUpSearchParams ?? null,
    checkoutSearchParams: data.checkoutSearchParams ?? null,
    data,
  });

  const inserted = await insertWebhookEvent({
    event_id: eid,
    event_type: eventType,
    event_code: strId(eventCode),
    session_id: sessionId,
    patient_id: patientId,
    payload: data,
    requestId,
  });

  if (!inserted) {
    baskWebhookLog(requestId, "processor.duplicate", { eventId: eid, eventType });
    return { status: "duplicate", event_id: eid, event_type: eventType };
  }

  try {
    const result = await applyEvent(
      eventType,
      data,
      eid,
      sessionId,
      patientId,
      eventCode,
      requestId,
    );
    await markWebhookProcessed(eid, null, requestId);
    baskWebhookLog(requestId, "processor.done", { eventId: eid, result });
    return { status: "ok", event_id: eid, event_type: eventType, ...result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    baskWebhookError(requestId, "processor.failed", err, { eventId: eid });
    await markWebhookProcessed(eid, message, requestId);
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
  requestId: string,
): Promise<Record<string, unknown>> {
  const contact = contactFromData(data);
  const params = searchParams(data);
  const utms = utmFields(params);

  baskWebhookLog(requestId, "applyEvent.start", {
    eventType,
    sessionId,
    patientId,
    contact,
    utms,
    params,
  });

  if (patientId) {
    baskWebhookLog(requestId, "applyEvent.upsertPatient", { patientId, contact });
    await upsertPatient({
      patient_id: patientId,
      session_id: sessionId,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      requestId,
    });
    baskWebhookLog(requestId, "applyEvent.upsertPatient.done", { patientId });
  } else {
    baskWebhookLog(requestId, "applyEvent.skipPatient", {
      reason: "no patientId in payload",
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
    const skipped = {
      skipped: true,
      reason: "no session_id",
      event_type: eventType,
      had_patient_id: Boolean(patientId),
      payload_keys: Object.keys(data),
    };
    baskWebhookLog(requestId, "applyEvent.skipped", skipped);
    return skipped;
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

  baskWebhookLog(requestId, "applyEvent.upsertJourney", { journeyFields });
  const updatedJourney = await upsertJourney(journeyFields, requestId);
  baskWebhookLog(requestId, "applyEvent.upsertJourney.done", {
    journeyId: updatedJourney.id,
    funnelStage: updatedJourney.funnel_stage,
  });

  if (eventType === "paymentSucceeded") {
    const testMode = data.testMode === true;
    const isFirst =
      updatedJourney.is_first_time_order === null ||
      updatedJourney.is_first_time_order === undefined
        ? 1
        : updatedJourney.is_first_time_order;
    const already = updatedJourney.conversion_credited;
    if (!testMode && isFirst && !already) {
      await upsertJourney(
        {
          session_id: sessionId,
          conversion_credited: 1,
          converted_at: nowIso(),
          funnel_stage: "payment_succeeded",
        },
        requestId,
      );
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
    patient_id: patientId,
  };
}
