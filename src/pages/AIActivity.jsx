import React, { useState, useEffect } from "react";
import { Brain, Search, Filter } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLocation } from "@/lib/LocationContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HospitalBadge from "@/components/HospitalBadge";
import { HOSPITAL_LIST } from "@/lib/hospitals";

const ACTION_LABELS = {
  recommendation: "Recommendation",
  task_generated: "Task Generated",
  alert_raised: "Alert Raised",
  summary_generated: "Summary Generated",
  briefing_generated: "Briefing Generated",
  document_processed: "Document Processed",
  release_check: "Release Check",
  assistant_query: "Assistant Query",
  workflow_update: "Workflow Update",
  escalation: "Escalation",
  task_dismissed: "Task Dismissed",
  task_completed: "Task Completed",
  alert_acknowledged: "Alert Acknowledged",
};

const DECISION_CONFIG = {
  approved: { label: "Approved", className: "bg-green-100 text-green-700" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  modified: { label: "Modified", className: "bg-blue-100 text-blue-700" },
  not_required: { label: "N/A", className: "bg-muted text-muted-foreground" },
};

export default function AIActivity() {
  const { selectedLocation } = useLocation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.AIActivityLog.list("-created_date", 200);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filteredLogs = logs.filter((log) => {
    if (selectedLocation !== "all" && log.hospital_location !== selectedLocation) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!log.ai_action?.toLowerCase().includes(s) && !log.user_name?.toLowerCase().includes(s) && !log.decedent_unique_id?.toLowerCase().includes(s)) return false;
    }
    if (actionFilter !== "all" && log.action_type !== actionFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Brain className="w-5 h-5 text-purple-500" />
        <h1 className="text-2xl font-bold">AI Activity Log</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Complete audit trail of every AI recommendation and automated action.</p>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search activity..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-56" />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading activity logs...</div>
      ) : filteredLogs.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No AI activity recorded yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => {
            const decision = DECISION_CONFIG[log.staff_decision] || DECISION_CONFIG.pending;
            return (
              <Card key={log.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="secondary" className="text-xs">{ACTION_LABELS[log.action_type] || log.action_type}</Badge>
                      {log.decedent_unique_id && <span className="font-mono text-xs text-muted-foreground">{log.decedent_unique_id}</span>}
                      {log.hospital_location && <HospitalBadge hospitalId={log.hospital_location} size="xs" />}
                      <Badge className={decision.className} variant="secondary">{decision.label}</Badge>
                    </div>
                    <p className="text-sm font-medium">{log.ai_action}</p>
                    {log.ai_recommendation && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{log.ai_recommendation}</p>
                    )}
                    {log.final_action && (
                      <p className="text-xs text-green-700 mt-1">→ {log.final_action}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{log.user_name || "System"}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}