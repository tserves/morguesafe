import React from "react";
import { Check, Clock, Lock, SkipForward, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "intake", label: "Intake" },
  { key: "identity_verification", label: "Identity Verification" },
  { key: "documentation", label: "Documentation" },
  { key: "storage_assignment", label: "Storage Assignment" },
  { key: "internal_reviews", label: "Internal Reviews" },
  { key: "transfer_coordination", label: "Transfer Coordination" },
  { key: "release_authorization", label: "Release Authorization" },
  { key: "final_release", label: "Final Release" },
  { key: "case_closure", label: "Case Closure" },
];

export default function WorkflowStages({ stages = [], compact = false }) {
  const stageMap = {};
  stages.forEach((s) => { stageMap[s.stage] = s; });

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {STAGES.map((stage, idx) => {
          const data = stageMap[stage.key];
          const status = data?.stage_status || "not_started";
          return (
            <React.Fragment key={stage.key}>
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium",
                  status === "completed" && "bg-green-100 text-green-700",
                  status === "in_progress" && "bg-blue-100 text-blue-700",
                  status === "blocked" && "bg-red-100 text-red-700",
                  status === "skipped" && "bg-muted text-muted-foreground line-through",
                  status === "not_started" && "bg-muted/50 text-muted-foreground"
                )}
              >
                {status === "completed" && <Check className="w-2.5 h-2.5" />}
                {status === "in_progress" && <Clock className="w-2.5 h-2.5" />}
                {status === "blocked" && <Lock className="w-2.5 h-2.5" />}
                {status === "skipped" && <SkipForward className="w-2.5 h-2.5" />}
                {status === "not_started" && <Circle className="w-2.5 h-2.5" />}
                <span>{stage.label}</span>
              </div>
              {idx < STAGES.length - 1 && <div className="w-1 h-px bg-border" />}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {STAGES.map((stage, idx) => {
        const data = stageMap[stage.key];
        const status = data?.stage_status || "not_started";
        return (
          <div key={stage.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 shrink-0",
                  status === "completed" && "bg-green-500 border-green-500 text-white",
                  status === "in_progress" && "bg-blue-500 border-blue-500 text-white",
                  status === "blocked" && "bg-red-500 border-red-500 text-white",
                  status === "skipped" && "bg-muted border-border text-muted-foreground",
                  status === "not_started" && "bg-card border-border text-muted-foreground"
                )}
              >
                {status === "completed" ? <Check className="w-3.5 h-3.5" /> :
                 status === "in_progress" ? <Clock className="w-3.5 h-3.5" /> :
                 status === "blocked" ? <Lock className="w-3.5 h-3.5" /> :
                 status === "skipped" ? <SkipForward className="w-3.5 h-3.5" /> :
                 idx + 1}
              </div>
              {idx < STAGES.length - 1 && <div className={cn("w-0.5 h-6 mt-0.5", status === "completed" ? "bg-green-300" : "bg-border")} />}
            </div>
            <div className="flex-1 pb-2">
              <p className={cn("text-sm font-medium", status === "not_started" && "text-muted-foreground")}>{stage.label}</p>
              {data?.blocked_reason && <p className="text-xs text-red-600 mt-0.5">{data.blocked_reason}</p>}
              {data?.checklist_items && data.checklist_items.length > 0 && status === "in_progress" && (
                <div className="mt-1 space-y-0.5">
                  {data.checklist_items.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div className={cn("w-3 h-3 rounded-sm border flex items-center justify-center", item.completed ? "bg-green-500 border-green-500" : "border-border")}>
                        {item.completed && <Check className="w-2 h-2 text-white" />}
                      </div>
                      <span className={item.completed ? "text-muted-foreground line-through" : "text-foreground"}>{item.item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}