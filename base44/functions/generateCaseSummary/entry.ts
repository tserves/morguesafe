import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import {
  detectCaseType,
  getCurrentStageKey,
  checkReleaseReadiness,
  timeSince,
  WORKFLOW_STAGES,
} from "../../shared/aiWorkflow.ts";

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
    const [custodyLogs, examinations, releases, personalEffects, tasks, alerts, workflowStages] = await Promise.all([
      base44.asServiceRole.entities.CustodyLog.filter({ decedent_id: decedentId }),
      base44.asServiceRole.entities.Examination.filter({ decedent_id: decedentId }),
      base44.asServiceRole.entities.Release.filter({ decedent_id: decedentId }),
      base44.asServiceRole.entities.PersonalEffect.filter({ decedent_id: decedentId }),
      base44.asServiceRole.entities.AITask.filter({ decedent_id: decedentId }),
      base44.asServiceRole.entities.AIAlert.filter({ decedent_id: decedentId }),
      base44.asServiceRole.entities.AIWorkflowStage.filter({ decedent_id: decedentId }),
    ]);

    const caseType = detectCaseType(decedent);
    const currentStage = getCurrentStageKey(decedent);
    const readiness = checkReleaseReadiness(decedent, custodyLogs, examinations, releases, personalEffects);

    const completedStages = workflowStages.filter((s) => s.stage_status === "completed").map((s) => s.stage);
    const outstandingTasks = tasks.filter((t) => !["completed", "cancelled"].includes(t.status));
    const activeAlerts = alerts.filter((a) => a.status === "active");
    const latestLog = custodyLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    // Build structured summary data
    const summaryData = {
      current_status: decedent.status,
      hospital: decedent.hospital_location,
      storage_location: decedent.storage_location_label || "Not assigned",
      completed_stages: completedStages,
      outstanding_tasks: outstandingTasks.map((t) => `${t.task_title} (Priority: ${t.priority})`),
      missing_documents: !decedent.documentation_complete ? ["Case documentation incomplete"] : [],
      active_holds: readiness.blockers,
      responsible_departments: [...new Set(tasks.map((t) => t.assigned_department).filter(Boolean))],
      latest_activity: latestLog ? `${latestLog.action_type} by ${latestLog.performed_by} on ${new Date(latestLog.timestamp).toLocaleString()}` : "No activity recorded",
      time_at_current_stage: timeSince(decedent.arrival_datetime),
      recommended_next_actions: outstandingTasks.slice(0, 5).map((t) => t.task_title),
      release_blockers: readiness.blockers,
    };

    // Generate natural language summary via LLM
    const llmPrompt = `You are the Custiviant AI assistant for a hospital morgue management system. Generate a concise, professional case summary based on the following verified case data. Do not invent information. If something is unknown, state it clearly.

Case ID: ${decedent.unique_id}
Decedent: ${[decedent.first_name, decedent.last_name].filter(Boolean).join(" ") || "Unidentified"}
Hospital: ${decedent.hospital_location}
Case Type: ${caseType}
Current Status: ${decedent.status}
Current Workflow Stage: ${currentStage}
Storage Location: ${decedent.storage_location_label || "Not assigned"}
Identification Status: ${decedent.identification_status}
Documentation Complete: ${decedent.documentation_complete ? "Yes" : "No"}
Personal Effects Logged: ${decedent.personal_effects_logged ? "Yes" : "No"}
Is Donor: ${decedent.is_donor}
Donation Status: ${decedent.donation_status || "N/A"}
Manner of Death: ${decedent.manner_of_death || "Pending"}
Requires Autopsy: ${decedent.requires_autopsy ? "Yes" : "No"}
Arrival: ${decedent.arrival_datetime}
Time at Current Stage: ${summaryData.time_at_current_stage}

Completed Workflow Stages: ${completedStages.join(", ") || "None"}
Outstanding Tasks (${outstandingTasks.length}): ${outstandingTasks.map((t) => t.task_title).join("; ") || "None"}
Active Alerts (${activeAlerts.length}): ${activeAlerts.map((a) => a.title).join("; ") || "None"}
Release Readiness: ${readiness.status.toUpperCase()}
Release Blockers: ${readiness.blockers.join("; ") || "None"}
Latest Activity: ${summaryData.latest_activity}

Generate a professional case summary covering: current status, completed stages, outstanding items, active holds, recommended next actions, and conditions preventing release (if any). Use clear, clinical language. Label this as AI-generated content.`;

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: llmPrompt,
      model: "automatic",
    });

    const summaryText = typeof llmResponse === "string" ? llmResponse : JSON.stringify(llmResponse);
    const now = new Date().toISOString();

    // Save the summary
    const savedSummary = await base44.asServiceRole.entities.CaseSummary.create({
      decedent_id: decedentId,
      decedent_unique_id: decedent.unique_id,
      summary_text: summaryText,
      summary_data: summaryData,
      generated_by: user.full_name || user.email,
      generated_datetime: now,
      status: "draft",
      hospital_location: decedent.hospital_location,
      is_demo_data: !!decedent.is_demo_data,
    });

    // Log AI activity
    await base44.asServiceRole.entities.AIActivityLog.create({
      action_type: "summary_generated",
      decedent_id: decedentId,
      decedent_unique_id: decedent.unique_id,
      user_id: user.id,
      user_name: user.full_name || user.email,
      hospital_location: decedent.hospital_location,
      ai_action: "Generated AI case summary",
      ai_recommendation: summaryText.substring(0, 500),
      information_used: `Case data, ${custodyLogs.length} custody logs, ${tasks.length} tasks, ${alerts.length} alerts`,
      staff_decision: "pending",
      timestamp: now,
      is_demo_data: !!decedent.is_demo_data,
    });

    return Response.json({
      status: "success",
      summary_id: savedSummary.id,
      summary_text: summaryText,
      summary_data: summaryData,
      generated_at: now,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}