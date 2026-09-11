import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import {
  generateTasksAndAlerts,
  detectCaseType,
  getCurrentStageKey,
  buildWorkflowChecklist,
} from "../../shared/aiWorkflow.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const hospitalFilter = body.hospital_location || null;
    const decedentId = body.decedent_id || null;

    // Fetch all data in bulk (avoid per-decedent queries that hit rate limits)
    const [allDecedents, allCustodyLogs, allExaminations, allReleases, allPersonalEffects, allStorageUnits, allExistingTasks, allExistingAlerts] = await Promise.all([
      base44.asServiceRole.entities.Decedent.list("-created_date", 200),
      base44.asServiceRole.entities.CustodyLog.list("-created_date", 500),
      base44.asServiceRole.entities.Examination.list("-created_date", 200),
      base44.asServiceRole.entities.Release.list("-created_date", 200),
      base44.asServiceRole.entities.PersonalEffect.list("-created_date", 200),
      base44.asServiceRole.entities.StorageUnit.list("-created_date", 200),
      base44.asServiceRole.entities.AITask.list("-created_date", 200),
      base44.asServiceRole.entities.AIAlert.list("-created_date", 200),
    ]);

    // Filter decedents
    let decedents = decedentId ? allDecedents.filter((d) => d.id === decedentId) : allDecedents;
    if (hospitalFilter) decedents = decedents.filter((d) => d.hospital_location === hospitalFilter);
    decedents = decedents.filter((d) => d.status !== "released");

    let totalTasksCreated = 0;
    let totalAlertsCreated = 0;
    const caseSummaries: any[] = [];
    const tasksToCreate: any[] = [];
    const alertsToCreate: any[] = [];
    const activityLogsToCreate: any[] = [];
    const stagesToCreate: any[] = [];

    for (const decedent of decedents) {
      // Filter related data in memory
      const custodyLogs = allCustodyLogs.filter((c) => c.decedent_id === decedent.id);
      const examinations = allExaminations.filter((e) => e.decedent_id === decedent.id);
      const releases = allReleases.filter((r) => r.decedent_id === decedent.id);
      const personalEffects = allPersonalEffects.filter((p) => p.decedent_id === decedent.id);
      const storageUnits = allStorageUnits.filter((u) => u.hospital_location === decedent.hospital_location);
      const existingTasks = allExistingTasks.filter((t) => t.decedent_id === decedent.id);

      const { tasks, alerts } = generateTasksAndAlerts(
        decedent, custodyLogs, examinations, releases, personalEffects, storageUnits, existingTasks
      );

      const now = new Date().toISOString();

      // Queue tasks for creation
      for (const task of tasks) {
        const dueDate = new Date(Date.now() + (task.priority === "critical" ? 12 : task.priority === "high" ? 24 : 48) * 60 * 60 * 1000).toISOString();
        tasksToCreate.push({
          decedent_id: decedent.id,
          decedent_unique_id: decedent.unique_id,
          decedent_name: [decedent.first_name, decedent.last_name].filter(Boolean).join(" ") || "Unidentified",
          task_title: task.task_title,
          task_description: task.task_description,
          task_type: task.task_type,
          priority: task.priority,
          status: "new",
          reason: task.reason,
          assigned_department: task.assigned_department || null,
          due_datetime: dueDate,
          hospital_location: decedent.hospital_location,
          generated_by_ai: true,
          is_demo_data: !!decedent.is_demo_data,
        });
        activityLogsToCreate.push({
          action_type: "task_generated",
          decedent_id: decedent.id,
          decedent_unique_id: decedent.unique_id,
          user_id: user.id,
          user_name: user.full_name || user.email,
          hospital_location: decedent.hospital_location,
          ai_action: `Generated task: ${task.task_title}`,
          ai_recommendation: task.task_description,
          information_used: `Case status: ${decedent.status}, identification: ${decedent.identification_status}`,
          staff_decision: "pending",
          timestamp: now,
          is_demo_data: !!decedent.is_demo_data,
        });
        totalTasksCreated++;
      }

      // Queue alerts (dedup against existing active alerts)
      for (const alert of alerts) {
        const exists = allExistingAlerts.some((a) => a.decedent_id === decedent.id && a.alert_type === alert.alert_type && a.status === "active");
        if (exists) continue;
        // Also check if we already queued the same alert
        const alreadyQueued = alertsToCreate.some((a) => a.decedent_id === decedent.id && a.alert_type === alert.alert_type);
        if (alreadyQueued) continue;

        alertsToCreate.push({
          decedent_id: decedent.id,
          decedent_unique_id: decedent.unique_id,
          alert_type: alert.alert_type,
          alert_level: alert.alert_level,
          title: alert.title,
          message: alert.message,
          status: "active",
          hospital_location: decedent.hospital_location,
          is_demo_data: !!decedent.is_demo_data,
        });
        activityLogsToCreate.push({
          action_type: "alert_raised",
          decedent_id: decedent.id,
          decedent_unique_id: decedent.unique_id,
          user_id: user.id,
          user_name: user.full_name || user.email,
          hospital_location: decedent.hospital_location,
          ai_action: `Raised alert: ${alert.title}`,
          ai_recommendation: alert.message,
          staff_decision: "pending",
          timestamp: now,
          is_demo_data: !!decedent.is_demo_data,
        });
        totalAlertsCreated++;
      }

      // Queue workflow stages (only if none exist yet)
      const existingStages = await base44.asServiceRole.entities.AIWorkflowStage.filter({ decedent_id: decedent.id });
      if (existingStages.length === 0) {
        const checklists = buildWorkflowChecklist(decedent);
        const currentStageKey = getCurrentStageKey(decedent);
        const stageOrder = ["intake", "identity_verification", "documentation", "storage_assignment",
          "internal_reviews", "transfer_coordination", "release_authorization",
          "final_release", "case_closure"];
        const currentOrder = stageOrder.indexOf(currentStageKey) + 1;
        for (const stage of stageOrder) {
          const order = stageOrder.indexOf(stage) + 1;
          let stageStatus = "not_started";
          if (stage === currentStageKey) stageStatus = "in_progress";
          if (order < currentOrder) stageStatus = "completed";
          stagesToCreate.push({
            decedent_id: decedent.id,
            decedent_unique_id: decedent.unique_id,
            stage,
            stage_status: stageStatus,
            stage_order: order,
            checklist_items: checklists[stage] || [],
            hospital_location: decedent.hospital_location,
            is_demo_data: !!decedent.is_demo_data,
          });
        }
      }

      caseSummaries.push({
        decedent_id: decedent.id,
        unique_id: decedent.unique_id,
        case_type: detectCaseType(decedent),
        tasks_generated: tasks.length,
        alerts_generated: alerts.length,
      });
    }

    // Bulk create all queued items
    if (tasksToCreate.length > 0) await base44.asServiceRole.entities.AITask.bulkCreate(tasksToCreate);
    if (alertsToCreate.length > 0) await base44.asServiceRole.entities.AIAlert.bulkCreate(alertsToCreate);
    if (activityLogsToCreate.length > 0) await base44.asServiceRole.entities.AIActivityLog.bulkCreate(activityLogsToCreate);
    if (stagesToCreate.length > 0) await base44.asServiceRole.entities.AIWorkflowStage.bulkCreate(stagesToCreate);

    return Response.json({
      status: "success",
      cases_analyzed: decedents.length,
      tasks_created: totalTasksCreated,
      alerts_created: totalAlertsCreated,
      stages_created: stagesToCreate.length,
      case_summaries: caseSummaries,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}