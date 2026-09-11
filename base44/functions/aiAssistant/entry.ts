import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const query = body.query;
    if (!query) return Response.json({ error: "query is required" }, { status: 400 });

    // Fetch relevant data for the assistant
    const [decedents, tasks, alerts, releases, storageUnits, transfers] = await Promise.all([
      base44.asServiceRole.entities.Decedent.list("-created_date", 200),
      base44.asServiceRole.entities.AITask.list("-created_date", 200),
      base44.asServiceRole.entities.AIAlert.filter({ status: "active" }),
      base44.asServiceRole.entities.Release.list("-created_date", 100),
      base44.asServiceRole.entities.StorageUnit.list("-created_date", 100),
      base44.asServiceRole.entities.HospitalTransfer.list("-created_date", 50),
    ]);

    // Build a context summary for the LLM
    const activeCases = decedents.filter((d) => d.status !== "released");
    const overdueTasks = tasks.filter((t) => t.due_datetime && new Date(t.due_datetime) < new Date() && !["completed", "cancelled"].includes(t.status));
    const coronerCases = decedents.filter((d) => ["homicide", "suicide", "accident"].includes(d.manner_of_death));
    const donationCases = decedents.filter((d) => d.is_donor === "yes");
    const approvedReleases = releases.filter((r) => r.status === "approved");
    const pendingTransfers = transfers.filter((t) => t.status === "pending" || t.status === "in_transit");

    const contextData = `
ACTIVE CASES (${activeCases.length}):
${activeCases.map((d) => `- ${d.unique_id}: ${[d.first_name, d.last_name].filter(Boolean).join(" ") || "Unidentified"} | Status: ${d.status} | Hospital: ${d.hospital_location} | ID: ${d.identification_status} | Donor: ${d.is_donor} | Manner: ${d.manner_of_death || "pending"}`).join("\n")}

ALL TASKS (${tasks.length}):
${tasks.filter(t => !["completed","cancelled"].includes(t.status)).slice(0, 30).map((t) => `- [${t.priority}] ${t.decedent_unique_id}: ${t.task_title} (Status: ${t.status}, Due: ${t.due_datetime || "N/A"})`).join("\n")}

OVERDUE TASKS (${overdueTasks.length}):
${overdueTasks.slice(0, 20).map((t) => `- ${t.decedent_unique_id}: ${t.task_title}`).join("\n")}

ACTIVE ALERTS (${alerts.length}):
${alerts.slice(0, 20).map((a) => `- [${a.alert_level}] ${a.title}: ${a.message}`).join("\n")}

CORONER CASES (${coronerCases.length}):
${coronerCases.map((d) => `- ${d.unique_id}: ${[d.first_name, d.last_name].filter(Boolean).join(" ") || "Unidentified"} | Hospital: ${d.hospital_location}`).join("\n")}

DONATION CASES (${donationCases.length}):
${donationCases.map((d) => `- ${d.unique_id}: ${[d.first_name, d.last_name].filter(Boolean).join(" ") || "Unidentified"} | Donation Status: ${d.donation_status}`).join("\n")}

APPROVED RELEASES (${approvedReleases.length}):
${approvedReleases.map((r) => `- ${r.decedent_unique_id} → ${r.receiving_party_name} (Status: ${r.status})`).join("\n")}

PENDING TRANSFERS (${pendingTransfers.length}):
${pendingTransfers.map((t) => `- ${t.decedent_unique_id}: ${t.from_hospital} → ${t.to_hospital} (Status: ${t.status})`).join("\n")}

STORAGE UNITS (${storageUnits.length}):
${storageUnits.map((u) => `- ${u.label} [${u.hospital_location}]: ${u.current_occupancy || 0}/${u.capacity} (${u.status})`).join("\n")}
`;

    const llmPrompt = `You are the Custiviant AI assistant for a hospital morgue management system. Answer the user's question based ONLY on the following verified platform data. Do not invent case information. If information is missing or uncertain, clearly state so. Cite specific case IDs when referencing cases.

USER QUESTION: ${query}

PLATFORM DATA:
${contextData}

Answer the question concisely and professionally. If the question is about a specific case, reference its case ID. If you cannot answer from the provided data, say so clearly.`;

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: llmPrompt,
      model: "automatic",
    });

    const answer = typeof llmResponse === "string" ? llmResponse : JSON.stringify(llmResponse);
    const now = new Date().toISOString();

    // Log AI activity
    await base44.asServiceRole.entities.AIActivityLog.create({
      action_type: "assistant_query",
      user_id: user.id,
      user_name: user.full_name || user.email,
      ai_action: `Assistant query: "${query.substring(0, 200)}"`,
      ai_recommendation: answer.substring(0, 500),
      information_used: `${decedents.length} cases, ${tasks.length} tasks, ${alerts.length} alerts`,
      staff_decision: "not_required",
      timestamp: now,
    });

    return Response.json({
      status: "success",
      query: query,
      answer: answer,
      answered_at: now,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}