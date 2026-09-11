import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { checkReleaseReadiness } from "../../shared/aiWorkflow.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const decedentId = body.decedent_id;
    if (!decedentId) return Response.json({ error: "decedent_id is required" }, { status: 400 });

    // Fetch decedent and related data
    const decedent = await base44.asServiceRole.entities.Decedent.get(decedentId);
    const [custodyLogs, examinations, releases, personalEffects] = await Promise.all([
      base44.asServiceRole.entities.CustodyLog.filter({ decedent_id: decedentId }),
      base44.asServiceRole.entities.Examination.filter({ decedent_id: decedentId }),
      base44.asServiceRole.entities.Release.filter({ decedent_id: decedentId }),
      base44.asServiceRole.entities.PersonalEffect.filter({ decedent_id: decedentId }),
    ]);

    const result = checkReleaseReadiness(decedent, custodyLogs, examinations, releases, personalEffects);

    // Log AI activity
    const now = new Date().toISOString();
    await base44.asServiceRole.entities.AIActivityLog.create({
      action_type: "release_check",
      decedent_id: decedentId,
      decedent_unique_id: decedent.unique_id,
      user_id: user.id,
      user_name: user.full_name || user.email,
      hospital_location: decedent.hospital_location,
      ai_action: `Release readiness check: ${result.status.toUpperCase()}`,
      ai_recommendation: result.status === "ready"
        ? "Case is ready for release. Final authorization required from authorized staff."
        : `Blocked: ${result.blockers.join(", ")}`,
      information_used: `${result.checks.length} checks performed`,
      suggested_change: result.status === "ready" ? "Proceed to final release authorization" : "Resolve blockers before release",
      staff_decision: "pending",
      timestamp: now,
      is_demo_data: !!decedent.is_demo_data,
    });

    return Response.json({
      status: "success",
      decedent_id: decedentId,
      unique_id: decedent.unique_id,
      readiness_status: result.status,
      blockers: result.blockers,
      warnings: result.warnings,
      checks: result.checks,
      checked_at: now,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}