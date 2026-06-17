import { IntakeMonitorClient } from "@/app/intake-monitor/IntakeMonitorClient";
import { intakeStore } from "@/lib/storage/supabase-intake-store";

/** Requires live Supabase — must not prerender at build time (Vercel has no DB during build). */
export const dynamic = "force-dynamic";

async function loadMonitorData() {
  try {
    const sessions = await intakeStore.listRecentSessions(200);
    const fieldsBySessionId = await intakeStore.getFieldsBySessionIds(
      sessions.map((s) => s.id),
    );
    return { sessions, fieldsBySessionId };
  } catch (err) {
    console.error("IntakeMonitorPage: failed to load sessions", err);
    return { sessions: [], fieldsBySessionId: {} };
  }
}

export default async function IntakeMonitorPage() {
  const { sessions, fieldsBySessionId } = await loadMonitorData();

  return (
    <IntakeMonitorClient
      initialSessions={sessions}
      initialFieldsBySessionId={fieldsBySessionId}
    />
  );
}
