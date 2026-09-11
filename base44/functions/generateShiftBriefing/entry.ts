import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const hospitalFilter = body.hospital_location || null;
    const briefingType = body.briefing_type || "shift_handoff";

    // Fetch all active decedents
    let decedents = await base44.asServiceRole.entities.Decedent.list("-created_date", 200);
    if (hospitalFilter && hospitalFilter !== "all") {
      decedents = decedents.filter((d) => d.hospital_location === hospitalFilter);
    }

    // Fetch related data
    const [allTasks, allAlerts, allReleases, allTransfers, storageUnits] = await Promise.all([
      base44.asServiceRole.entities.AITask.list("-created_date", 200),
      base44.asServiceRole.entities.AIAlert.filter({ status: "active" }),
      base44.asServiceRole.entities.Release.list("-created_date", 100),
      base44.asServiceRole.entities.HospitalTransfer.list("-created_date", 50),
      base44.asServiceRole.entities.StorageUnit.list("-created_date", 100),
    ]);

    // Filter by hospital if needed
    let tasks = allTasks;
    let alerts = allAlerts;
    let releases = allReleases;
    let transfers = allTransfers;
    let units = storageUnits;
    if (hospitalFilter && hospitalFilter !== "all") {
      tasks = tasks.filter((t) => t.hospital_location === hospitalFilter);
      alerts = alerts.filter((a) => a.hospital_location === hospitalFilter);
      releases = releases.filter((r) => r.hospital_location === hospitalFilter);
      transfers = transfers.filter((t) => t.from_hospital === hospitalFilter || t.to_hospital === hospitalFilter);
      units = units.filter((u) => u.hospital_location === hospitalFilter);
    }

    // Compute briefing data
    const now = new Date();
    const lastShiftStart = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago

    const newCases = decedents.filter((d) => new Date(d.created_date) > lastShiftStart);
    const releasedCases = decedents.filter((d) => d.status === "released");
    const scheduledReleases = releases.filter((r) => r.status === "approved" && r.release_datetime);
    const urgentTasks = tasks.filter((t) => t.priority === "critical" || t.priority === "high");
    const overdueTasks = tasks.filter((t) => t.due_datetime && new Date(t.due_datetime) < now && !["completed", "cancelled"].includes(t.status));
    const activeTransfers = transfers.filter((t) => t.status === "pending" || t.status === "in_transit");
    const capacityIssues = units.filter((u) => (u.current_occupancy || 0) >= (u.capacity || 1));

    const briefingData = {
      new_cases: newCases.length,
      released_cases: releasedCases.length,
      scheduled_releases: scheduledReleases.map((r) => `${r.decedent_unique_id} → ${r.receiving_party_name}`),
      active_holds: alerts.filter((a) => a.alert_type === "case_on_hold" || a.alert_type === "release_blocked").map((a) => a.title),
      urgent_tasks: urgentTasks.slice(0, 10).map((t) => `${t.decedent_unique_id}: ${t.task_title}`),
      overdue_tasks: overdueTasks.slice(0, 10).map((t) => `${t.decedent_unique_id}: ${t.task_title}`),
      missing_docs: alerts.filter((a) => a.alert_type === "incomplete_intake" || a.alert_type === "doc_discrepancy").map((a) => a.title),
      follow_ups: tasks.filter((t) => t.task_type === "coroner_followup" || t.task_type === "donation_followup").map((t) => `${t.decedent_unique_id}: ${t.task_title}`),
      transfers_in_progress: activeTransfers.map((t) => `${t.decedent_unique_id}: ${t.from_hospital} → ${t.to_hospital}`),
      capacity_issues: capacityIssues.map((u) => `${u.label} (${u.current_occupancy}/${u.capacity})`),
      previous_shift_changes: [],
    };

    // Generate briefing text via LLM
    const hospitalLabel = hospitalFilter === "all" || !hospitalFilter ? "All Hospitals" : hospitalFilter;
    const llmPrompt = `You are the Custiviant AI assistant generating a ${briefingType} briefing for a hospital morgue system. Generate a clear, professional briefing based on the following verified data. Do not invent information.

Hospital: ${hospitalLabel}
Briefing Type: ${briefingType}
Time: ${now.toISOString()}

DATA:
- New cases since last shift: ${briefingData.new_cases}
- Released cases: ${briefingData.released_cases}
- Scheduled releases: ${briefingData.scheduled_releases.join("; ") || "None"}
- Active holds: ${briefingData.active_holds.join("; ") || "None"}
- Urgent tasks: ${briefingData.urgent_tasks.join("; ") || "None"}
- Overdue tasks: ${briefingData.overdue_tasks.join("; ") || "None"}
- Missing documentation: ${briefingData.missing_docs.join("; ") || "None"}
- Cases requiring follow-up: ${briefingData.follow_ups.join("; ") || "None"}
- Transfers in progress: ${briefingData.transfers_in_progress.join("; ") || "None"}
- Storage capacity issues: ${briefingData.capacity_issues.join("; ") || "None"}

Generate a structured shift briefing with sections for: New Admissions, Releases, Urgent Items, Follow-ups, and Storage/Capacity. Label this as AI-generated content.`;

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: llmPrompt,
      model: "automatic",
    });

    const briefingText = typeof llmResponse === "string" ? llmResponse : JSON.stringify(llmResponse);

    // Save the briefing
    const savedBriefing = await base44.asServiceRole.entities.ShiftBriefing.create({
      briefing_type: briefingType,
      briefing_text: briefingText,
      briefing_data: briefingData,
      hospital_location: hospitalFilter || "all",
      generated_by: user.full_name || user.email,
      generated_datetime: now.toISOString(),
      status: "draft",
    });

    // Log AI activity
    await base44.asServiceRole.entities.AIActivityLog.create({
      action_type: "briefing_generated",
      user_id: user.id,
      user_name: user.full_name || user.email,
      hospital_location: hospitalFilter || null,
      ai_action: `Generated ${briefingType} briefing for ${hospitalLabel}`,
      ai_recommendation: briefingText.substring(0, 500),
      information_used: `${decedents.length} cases, ${tasks.length} tasks, ${alerts.length} alerts`,
      staff_decision: "pending",
      timestamp: now.toISOString(),
    });

    return Response.json({
      status: "success",
      briefing_id: savedBriefing.id,
      briefing_text: briefingText,
      briefing_data: briefingData,
      generated_at: now.toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}