import { IntakeMonitorClient } from "@/app/intake-monitor/IntakeMonitorClient";
import { intakeStore } from "@/lib/storage/supabase-intake-store";

/** Requires live Supabase — must not prerender at build time (Vercel has no DB during build). */
export const dynamic = "force-dynamic";

export default async function IntakeMonitorPage() {
  try {
    const sessions = await intakeStore.listRecentSessions(200);
    const fieldsBySessionId = await intakeStore.getFieldsBySessionIds(
      sessions.map((s) => s.id),
    );
    return (
      <IntakeMonitorClient
        initialSessions={sessions}
        initialFieldsBySessionId={fieldsBySessionId}
      />
    );
  } catch (err) {
    console.error("IntakeMonitorPage: failed to load sessions", err);
    return (
      <IntakeMonitorClient initialSessions={[]} initialFieldsBySessionId={{}} />
    );
  }
}
