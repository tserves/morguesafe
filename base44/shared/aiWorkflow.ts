// base44/shared/aiWorkflow.ts
// Shared AI workflow logic used by multiple backend functions.
// Pure functions that operate on data — backend functions handle SDK calls.

export const WORKFLOW_STAGES = [
  { key: "intake", label: "Intake", order: 1, department: "Intake" },
  { key: "identity_verification", label: "Identity Verification", order: 2, department: "Intake" },
  { key: "documentation", label: "Documentation", order: 3, department: "Administration" },
  { key: "storage_assignment", label: "Storage Assignment", order: 4, department: "Storage" },
  { key: "internal_reviews", label: "Internal Reviews", order: 5, department: "Pathology" },
  { key: "transfer_coordination", label: "Transfer Coordination", order: 6, department: "Release" },
  { key: "release_authorization", label: "Release Authorization", order: 7, department: "Release" },
  { key: "final_release", label: "Final Release", order: 8, department: "Release" },
  { key: "case_closure", label: "Case Closure", order: 9, department: "Administration" },
];

export const CASE_TYPES = {
  adult: { label: "Adult", color: "blue" },
  infant: { label: "Infant", color: "purple" },
  stillbirth: { label: "Stillbirth", color: "indigo" },
  referred: { label: "Referred Case", color: "cyan" },
  coroner: { label: "Coroner's Case", color: "red" },
  donation: { label: "Organ/Tissue Donation", color: "green" },
  unidentified: { label: "Unidentified Person", color: "amber" },
  other: { label: "Other", color: "slate" },
};

export function detectCaseType(decedent: any): string {
  if (decedent.is_donor === "yes" || ["approved_for_recovery", "recovery_scheduled"].includes(decedent.donation_status)) {
    return "donation";
  }
  if (decedent.estimated_age !== undefined && decedent.estimated_age !== null && decedent.estimated_age < 1) {
    return "infant";
  }
  if (decedent.identification_status === "unidentified") {
    return "unidentified";
  }
  if (["homicide", "suicide", "accident"].includes(decedent.manner_of_death)) {
    return "coroner";
  }
  if (decedent.source_type === "funeral_home") {
    return "referred";
  }
  return "adult";
}

export function getCurrentStageKey(decedent: any): string {
  const statusMap: Record<string, string> = {
    intake: "intake",
    storage: "storage_assignment",
    examination: "internal_reviews",
    holding: "transfer_coordination",
    released: "final_release",
    transferred: "transfer_coordination",
  };
  return statusMap[decedent.status] || "intake";
}

export function timeSince(isoDatetime: string): string {
  if (!isoDatetime) return "—";
  const diff = Date.now() - new Date(isoDatetime).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "< 1 hour";
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""}`;
}

export interface ReleaseReadinessResult {
  status: "ready" | "conditionally_ready" | "not_ready";
  blockers: string[];
  warnings: string[];
  checks: { label: string; passed: boolean; isBlocker: boolean; detail?: string }[];
}

export function checkReleaseReadiness(
  decedent: any,
  custodyLogs: any[],
  examinations: any[],
  releases: any[],
  personalEffects: any[]
): ReleaseReadinessResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const checks: ReleaseReadinessResult["checks"] = [];

  // 1. Identity confirmed
  const identityOk = decedent.identification_status === "identified";
  checks.push({ label: "Identity confirmed", passed: identityOk, isBlocker: true, detail: decedent.identification_status });
  if (!identityOk) blockers.push("Identity not confirmed");

  // 2. Documentation complete
  const docOk = !!decedent.documentation_complete;
  checks.push({ label: "Required documents completed", passed: docOk, isBlocker: true });
  if (!docOk) blockers.push("Required documentation incomplete");

  // 3. Coroner authorization (if applicable)
  const isCoronerCase = ["homicide", "suicide", "accident"].includes(decedent.manner_of_death);
  if (isCoronerCase) {
    const hasCoronerAuth = custodyLogs.some(
      (log) => log.action_type === "documentation_updated" && (log.notes?.toLowerCase().includes("coroner") || log.notes?.toLowerCase().includes("authorization"))
    );
    checks.push({ label: "Coroner authorization recorded", passed: hasCoronerAuth, isBlocker: true });
    if (!hasCoronerAuth) blockers.push("Coroner authorization not recorded");
  }

  // 4. Donation workflow completed
  if (decedent.is_donor === "yes") {
    const donationComplete = ["recovery_completed", "declined", "not_eligible"].includes(decedent.donation_status);
    checks.push({ label: "Donation workflow completed", passed: donationComplete, isBlocker: true, detail: decedent.donation_status });
    if (!donationComplete) blockers.push("Donation workflow not completed");
  }

  // 5. Personal effects documented
  const effectsOk = !!decedent.personal_effects_logged;
  checks.push({ label: "Personal effects documented", passed: effectsOk, isBlocker: false });
  if (!effectsOk) warnings.push("Personal effects not fully documented");

  // 6. Release authorization approved
  const approvedRelease = releases.find((r) => r.decedent_id === decedent.id && r.status === "approved");
  checks.push({ label: "Release authorization approved", passed: !!approvedRelease, isBlocker: true });
  if (!approvedRelease) blockers.push("Release authorization not approved");

  // 7. Storage and movement history complete
  const hasStorageHistory = custodyLogs.some((log) => log.action_type === "moved_to_storage" || log.action_type === "scan_in");
  checks.push({ label: "Storage and movement history complete", passed: hasStorageHistory, isBlocker: false });
  if (!hasStorageHistory) warnings.push("Storage/movement history may be incomplete");

  // 8. Receiving party verified (if release record exists)
  if (approvedRelease) {
    const receivingOk = !!approvedRelease.receiving_party_name && !!approvedRelease.identity_verified_by;
    checks.push({ label: "Receiving party verified", passed: receivingOk, isBlocker: true });
    if (!receivingOk) blockers.push("Receiving party identity not verified");
  }

  // Determine status
  let status: "ready" | "conditionally_ready" | "not_ready" = "ready";
  if (blockers.length > 0) status = "not_ready";
  else if (warnings.length > 0) status = "conditionally_ready";

  return { status, blockers, warnings, checks };
}

export interface GeneratedTask {
  task_title: string;
  task_description: string;
  task_type: string;
  priority: string;
  reason: string;
  assigned_department?: string;
}

export interface GeneratedAlert {
  alert_type: string;
  alert_level: string;
  title: string;
  message: string;
}

export function generateTasksAndAlerts(
  decedent: any,
  custodyLogs: any[],
  examinations: any[],
  releases: any[],
  personalEffects: any[],
  storageUnits: any[],
  existingTasks: any[]
): { tasks: GeneratedTask[]; alerts: GeneratedAlert[] } {
  const tasks: GeneratedTask[] = [];
  const alerts: GeneratedAlert[] = [];
  const caseId = decedent.unique_id || "—";

  // Dedup key: don't generate a task if one with same title+type already exists and is active
  const hasActiveTask = (title: string, type: string) =>
    existingTasks.some((t) => t.task_title === title && t.task_type === type && !["completed", "cancelled"].includes(t.status));

  // Missing identification info
  if (decedent.identification_status !== "unidentified") {
    if (!decedent.first_name) {
      if (!hasActiveTask("Complete decedent identification", "missing_info")) {
        tasks.push({
          task_title: "Complete decedent identification",
          task_description: "The decedent record is missing the first name. Complete identification to proceed.",
          task_type: "missing_info",
          priority: "high",
          reason: "First name is missing from intake record",
          assigned_department: "Intake",
        });
      }
    }
    if (!decedent.date_of_birth) {
      if (!hasActiveTask("Record date of birth", "missing_info")) {
        tasks.push({
          task_title: "Record date of birth",
          task_description: "Date of birth has not been recorded for this case.",
          task_type: "missing_info",
          priority: "medium",
          reason: "Date of birth is missing",
          assigned_department: "Intake",
        });
      }
    }
  }

  // Next of kin
  if (!decedent.next_of_kin_name) {
    if (!hasActiveTask("Record next of kin information", "missing_info")) {
      tasks.push({
        task_title: "Record next of kin information",
        task_description: "Next of kin name and contact information are required for release coordination.",
        task_type: "missing_info",
        priority: "high",
        reason: "Next of kin information is missing",
        assigned_department: "Administration",
      });
    }
  }

  // Storage unconfirmed
  if (!decedent.storage_location_id && decedent.status !== "released" && decedent.status !== "transferred") {
    if (!hasActiveTask("Assign storage location", "storage_unconfirmed")) {
      tasks.push({
        task_title: "Assign storage location",
        task_description: "This case does not have a confirmed storage assignment.",
        task_type: "storage_unconfirmed",
        priority: "high",
        reason: "No storage location has been assigned",
        assigned_department: "Storage",
      });
    }
    alerts.push({
      alert_type: "incomplete_intake",
      alert_level: "attention",
      title: "Storage not assigned",
      message: `Case ${caseId} has no confirmed storage location.`,
    });
  }

  // Documentation incomplete
  if (!decedent.documentation_complete) {
    if (!hasActiveTask("Complete required documentation", "document_review")) {
      tasks.push({
        task_title: "Complete required documentation",
        task_description: "Case documentation has not been marked as complete.",
        task_type: "document_review",
        priority: "high",
        reason: "Documentation completeness flag is not set",
        assigned_department: "Administration",
      });
    }
  }

  // Coroner followup
  if (["homicide", "suicide", "accident"].includes(decedent.manner_of_death)) {
    const hasCoronerLog = custodyLogs.some(
      (log) => log.notes?.toLowerCase().includes("coroner") || log.notes?.toLowerCase().includes("authorization")
    );
    if (!hasCoronerLog) {
      if (!hasActiveTask("Obtain coroner authorization", "coroner_followup")) {
        tasks.push({
          task_title: "Obtain coroner authorization",
          task_description: "This case involves a non-natural manner of death. Coroner authorization is required before release.",
          task_type: "coroner_followup",
          priority: "critical",
          reason: "Coroner case requires authorization before release",
          assigned_department: "Release",
        });
      }
      alerts.push({
        alert_type: "coroner_pending",
        alert_level: "urgent",
        title: "Coroner authorization pending",
        message: `Case ${caseId} requires coroner authorization before release.`,
      });
    }
  }

  // Donation followup
  if (decedent.is_donor === "yes" && decedent.donation_status === "pending_assessment") {
    if (!hasActiveTask("Complete donation assessment", "donation_followup")) {
      tasks.push({
        task_title: "Complete donation assessment",
        task_description: "Organ/tissue donation assessment has not been completed.",
        task_type: "donation_followup",
        priority: "high",
        reason: "Donation assessment is pending",
        assigned_department: "Pathology",
      });
    }
    alerts.push({
      alert_type: "donation_pending",
      alert_level: "attention",
      title: "Donation assessment pending",
      message: `Case ${caseId} has a pending donation assessment.`,
    });
  }

  // Prolonged stay
  if (decedent.arrival_datetime && decedent.status !== "released") {
    const daysSince = (Date.now() - new Date(decedent.arrival_datetime).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 7) {
      if (!hasActiveTask("Review prolonged length of stay", "stage_delay")) {
        tasks.push({
          task_title: "Review prolonged length of stay",
          task_description: `This case has been active for ${Math.round(daysSince)} days, exceeding the 7-day threshold.`,
          task_type: "stage_delay",
          priority: "medium",
          reason: `Case has been active for ${Math.round(daysSince)} days`,
          assigned_department: "Administration",
        });
      }
      alerts.push({
        alert_type: "prolonged_stay",
        alert_level: "attention",
        title: "Prolonged length of stay",
        message: `Case ${caseId} has been in the morgue for ${Math.round(daysSince)} days.`,
      });
    }
  }

  // Unidentified
  if (decedent.identification_status === "unidentified") {
    alerts.push({
      alert_type: "missing_identification",
      alert_level: "urgent",
      title: "Unidentified decedent",
      message: `Case ${caseId} remains unidentified. Enhanced identity verification workflow is active.`,
    });
    if (!hasActiveTask("Initiate enhanced identity verification", "missing_info")) {
      tasks.push({
        task_title: "Initiate enhanced identity verification",
        task_description: "Decedent is unidentified. Enhanced verification procedures should be initiated.",
        task_type: "missing_info",
        priority: "high",
        reason: "Decedent identification status is 'unidentified'",
        assigned_department: "Intake",
      });
    }
  }

  // Release approaching (approved release but not completed)
  const approvedRelease = releases.find((r) => r.decedent_id === decedent.id && r.status === "approved");
  if (approvedRelease && approvedRelease.release_datetime) {
    const hoursUntil = (new Date(approvedRelease.release_datetime).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil > 0 && hoursUntil < 24) {
      alerts.push({
        alert_type: "upcoming_release",
        alert_level: "attention",
        title: "Upcoming scheduled release",
        message: `Case ${caseId} is scheduled for release in ${Math.round(hoursUntil)} hours.`,
      });
      if (!hasActiveTask("Prepare for upcoming release", "release_approaching")) {
        tasks.push({
          task_title: "Prepare for upcoming release",
          task_description: `Release is scheduled in ${Math.round(hoursUntil)} hours. Ensure all requirements are met.`,
          task_type: "release_approaching",
          priority: "high",
          reason: "Release is scheduled within 24 hours",
          assigned_department: "Release",
        });
      }
    }
  }

  // Blocked from release
  if (decedent.status !== "released") {
    const readiness = checkReleaseReadiness(decedent, custodyLogs, examinations, releases, personalEffects);
    if (readiness.status === "not_ready" && approvedRelease) {
      alerts.push({
        alert_type: "release_blocked",
        alert_level: "critical",
        title: "Release blocked — unresolved requirements",
        message: `Case ${caseId} has an approved release but ${readiness.blockers.length} blocker(s) remain: ${readiness.blockers.join(", ")}.`,
      });
    }
  }

  // Storage capacity alert
  if (storageUnits && storageUnits.length > 0) {
    const occupiedCount = storageUnits.filter((u) => u.status === "occupied").length;
    const totalCount = storageUnits.length;
    if (totalCount > 0 && occupiedCount / totalCount > 0.85) {
      alerts.push({
        alert_type: "storage_capacity",
        alert_level: "urgent",
        title: "Storage capacity concern",
        message: `${occupiedCount}/${totalCount} storage units occupied at this hospital (${Math.round((occupiedCount / totalCount) * 100)}%).`,
      });
    }
  }

  return { tasks, alerts };
}

export function buildWorkflowChecklist(decedent: any): Record<string, any[]> {
  const caseType = detectCaseType(decedent);
  const checklists: Record<string, any[]> = {};

  // Intake checklist
  checklists.intake = [
    { item: "Intake form completed", completed: !!decedent.first_name || decedent.identification_status === "unidentified" },
    { item: "Arrival datetime recorded", completed: !!decedent.arrival_datetime },
    { item: "Condition on arrival documented", completed: !!decedent.condition_on_arrival },
    { item: "Intake officer assigned", completed: !!decedent.intake_officer },
  ];

  // Identity verification checklist
  checklists.identity_verification = [
    { item: "Identity status set", completed: !!decedent.identification_status },
    { item: "Physical description recorded", completed: !!decedent.physical_description },
    { item: "Identifying marks documented", completed: !!decedent.identifying_marks },
  ];

  // Documentation checklist
  checklists.documentation = [
    { item: "Documentation marked complete", completed: !!decedent.documentation_complete },
    { item: "Next of kin recorded", completed: !!decedent.next_of_kin_name },
    { item: "Personal effects logged", completed: !!decedent.personal_effects_logged },
  ];

  // Storage assignment checklist
  checklists.storage_assignment = [
    { item: "Storage location assigned", completed: !!decedent.storage_location_id },
  ];

  // Internal reviews checklist
  checklists.internal_reviews = [
    { item: "Autopsy requirement determined", completed: decedent.requires_autopsy !== undefined },
  ];

  // Donation-specific checklist
  if (caseType === "donation") {
    checklists.internal_reviews.push(
      { item: "Donor registration verified", completed: !!decedent.donor_registration_number },
      { item: "Donation coordinator assigned", completed: !!decedent.donation_coordinator_name },
      { item: "Organs/tissues for donation specified", completed: !!(decedent.organs_for_donation?.length || decedent.tissues_for_donation?.length) },
    );
  }

  // Transfer coordination checklist
  checklists.transfer_coordination = [
    { item: "Receiving party identified", completed: false },
  ];

  // Release authorization checklist
  checklists.release_authorization = [
    { item: "Release authorization obtained", completed: false },
  ];

  // Final release checklist
  checklists.final_release = [
    { item: "Release completed", completed: decedent.status === "released" },
  ];

  // Case closure checklist
  checklists.case_closure = [
    { item: "Case closed", completed: decedent.status === "released" },
  ];

  return checklists;
}

export function getRecommendedStorageUnit(
  decedent: any,
  storageUnits: any[]
): any | null {
  const available = storageUnits.filter((u) => u.status === "available" && (u.current_occupancy || 0) < (u.capacity || 1));
  if (available.length === 0) return null;

  // Prefer refrigerated tray for standard cases, isolation for infection control, decomp for decomposed
  const condition = decedent.condition_on_arrival;
  if (condition === "decomposed") {
    return available.find((u) => u.unit_type === "decomp_unit") || available[0];
  }
  if (condition === "traumatic_injuries" || condition === "burned") {
    return available.find((u) => u.unit_type === "isolation_unit") || available[0];
  }
  return available.find((u) => u.unit_type === "refrigerated_tray") || available[0];
}