import React from "react";
import { CheckCircle2, X, Clock, AlertTriangle, User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PRIORITY_CONFIG = {
  low: { label: "Low", className: "bg-slate-100 text-slate-700" },
  medium: { label: "Medium", className: "bg-blue-100 text-blue-700" },
  high: { label: "High", className: "bg-amber-100 text-amber-700" },
  critical: { label: "Critical", className: "bg-red-100 text-red-700" },
};

const STATUS_CONFIG = {
  new: { label: "New", className: "bg-blue-100 text-blue-700" },
  assigned: { label: "Assigned", className: "bg-indigo-100 text-indigo-700" },
  in_progress: { label: "In Progress", className: "bg-purple-100 text-purple-700" },
  waiting: { label: "Waiting", className: "bg-amber-100 text-amber-700" },
  blocked: { label: "Blocked", className: "bg-red-100 text-red-700" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
  escalated: { label: "Escalated", className: "bg-red-200 text-red-800" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

export default function AITaskCard({ task, onComplete, onDismiss, onEscalate, onReassign, compact = false }) {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.new;
  const isCompleted = task.status === "completed";
  const isCancelled = task.status === "cancelled";

  return (
    <div className={cn(
      "border rounded-lg p-3 transition-all",
      isCompleted && "bg-green-50/50 border-green-200",
      isCancelled && "bg-muted/30 border-border opacity-60",
      !isCompleted && !isCancelled && task.priority === "critical" && "bg-red-50/50 border-red-200",
      !isCompleted && !isCancelled && task.priority !== "critical" && "bg-card border-border hover:border-primary/30"
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge className={priority.className} variant="secondary">{priority.label}</Badge>
            <Badge className={status.className} variant="secondary">{status.label}</Badge>
            {task.escalation_level > 0 && (
              <Badge className="bg-red-200 text-red-800" variant="secondary">
                <AlertTriangle className="w-3 h-3 mr-1" />Escalated ×{task.escalation_level}
              </Badge>
            )}
          </div>
          <p className={cn("text-sm font-medium", isCompleted && "line-through text-muted-foreground")}>{task.task_title}</p>
          {!compact && <p className="text-xs text-muted-foreground mt-1">{task.task_description}</p>}
        </div>
      </div>

      {!compact && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 flex-wrap">
          {task.decedent_unique_id && (
            <span className="font-mono">{task.decedent_unique_id}</span>
          )}
          {task.assigned_department && (
            <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{task.assigned_department}</span>
          )}
          {task.assigned_to_name && (
            <span className="flex items-center gap-1"><User className="w-3 h-3" />{task.assigned_to_name}</span>
          )}
          {task.due_datetime && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Due {new Date(task.due_datetime).toLocaleDateString()}</span>
          )}
        </div>
      )}

      {!compact && task.reason && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mb-2">
          <span className="font-medium">AI Reason: </span>{task.reason}
        </div>
      )}

      {!isCompleted && !isCancelled && (
        <div className="flex items-center gap-2 mt-2">
          <Button size="sm" variant="outline" onClick={() => onComplete?.(task)} className="h-7 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Complete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDismiss?.(task)} className="h-7 text-xs">
            <X className="w-3.5 h-3.5 mr-1" />Dismiss
          </Button>
          {task.escalation_level < 3 && (
            <Button size="sm" variant="ghost" onClick={() => onEscalate?.(task)} className="h-7 text-xs text-orange-600">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />Escalate
            </Button>
          )}
          {onReassign && (
            <Button size="sm" variant="ghost" onClick={() => onReassign?.(task)} className="h-7 text-xs">
              <User className="w-3.5 h-3.5 mr-1" />Reassign
            </Button>
          )}
        </div>
      )}

      {isCompleted && task.completion_notes && (
        <p className="text-xs text-green-700 mt-2">✓ {task.completion_notes}</p>
      )}
      {isCancelled && task.dismissal_reason && (
        <p className="text-xs text-muted-foreground mt-2">Dismissed: {task.dismissal_reason}</p>
      )}
    </div>
  );
}