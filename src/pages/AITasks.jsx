import React, { useState, useEffect } from "react";
import { Brain, Filter, CheckCircle2, X, AlertTriangle, User, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLocation } from "@/lib/LocationContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import HospitalBadge from "@/components/HospitalBadge";
import AITaskCard from "@/components/ai/AITaskCard";
import { HOSPITAL_LIST } from "@/lib/hospitals";

const STATUSES = ["new", "assigned", "in_progress", "waiting", "blocked", "completed", "escalated", "cancelled"];
const PRIORITIES = ["critical", "high", "medium", "low"];

export default function AITasks() {
  const { selectedLocation } = useLocation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dismissTask, setDismissTask] = useState(null);
  const [dismissReason, setDismissReason] = useState("");
  const [reassignTask, setReassignTask] = useState(null);
  const [reassignTo, setReassignTo] = useState("");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.AITask.list("-created_date", 200);
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const filterTasks = (items) => {
    if (selectedLocation !== "all") items = items.filter((t) => t.hospital_location === selectedLocation);
    if (search) {
      const s = search.toLowerCase();
      items = items.filter((t) => t.task_title?.toLowerCase().includes(s) || t.decedent_unique_id?.toLowerCase().includes(s));
    }
    if (statusFilter === "active") {
      items = items.filter((t) => !["completed", "cancelled"].includes(t.status));
    } else if (statusFilter !== "all") {
      items = items.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter !== "all") {
      items = items.filter((t) => t.priority === priorityFilter);
    }
    return items;
  };

  const filteredTasks = filterTasks(tasks);
  const activeCount = tasks.filter((t) => !["completed", "cancelled"].includes(t.status)).length;
  const overdueCount = tasks.filter((t) => t.due_datetime && new Date(t.due_datetime) < new Date() && !["completed", "cancelled"].includes(t.status)).length;

  const handleComplete = async (task) => {
    try {
      await base44.entities.AITask.update(task.id, {
        status: "completed",
        completion_notes: "Marked complete by user",
        completion_evidence: "Manual completion",
      });
      await base44.entities.AIActivityLog.create({
        action_type: "task_completed",
        decedent_id: task.decedent_id,
        decedent_unique_id: task.decedent_unique_id,
        ai_action: `Task completed: ${task.task_title}`,
        staff_decision: "approved",
        final_action: "Task marked complete",
        timestamp: new Date().toISOString(),
        hospital_location: task.hospital_location,
      });
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  const handleDismiss = async () => {
    if (!dismissTask || !dismissReason.trim()) return;
    try {
      await base44.entities.AITask.update(dismissTask.id, {
        status: "cancelled",
        dismissal_reason: dismissReason,
        dismissed_by: "current_user",
      });
      await base44.entities.AIActivityLog.create({
        action_type: "task_dismissed",
        decedent_id: dismissTask.decedent_id,
        decedent_unique_id: dismissTask.decedent_unique_id,
        ai_action: `Task dismissed: ${dismissTask.task_title}`,
        ai_recommendation: dismissTask.task_description,
        staff_decision: "rejected",
        final_action: `Dismissed: ${dismissReason}`,
        timestamp: new Date().toISOString(),
        hospital_location: dismissTask.hospital_location,
      });
      setDismissTask(null);
      setDismissReason("");
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  const handleEscalate = async (task) => {
    try {
      await base44.entities.AITask.update(task.id, {
        status: "escalated",
        escalation_level: (task.escalation_level || 0) + 1,
      });
      await base44.entities.AIActivityLog.create({
        action_type: "escalation",
        decedent_id: task.decedent_id,
        decedent_unique_id: task.decedent_unique_id,
        ai_action: `Task escalated: ${task.task_title}`,
        staff_decision: "modified",
        final_action: `Escalated to level ${(task.escalation_level || 0) + 1}`,
        timestamp: new Date().toISOString(),
        hospital_location: task.hospital_location,
      });
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  const handleReassign = async () => {
    if (!reassignTask || !reassignTo.trim()) return;
    try {
      await base44.entities.AITask.update(reassignTask.id, {
        assigned_to_name: reassignTo,
        status: "assigned",
      });
      setReassignTask(null);
      setReassignTo("");
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-purple-500" />
            <h1 className="text-2xl font-bold">AI Tasks</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {activeCount} active tasks · {overdueCount} overdue · {selectedLocation === "all" ? "All hospitals" : HOSPITAL_LIST.find((h) => h.id === selectedLocation)?.name}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-48" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-300 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No tasks match the current filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTasks.map((task) => (
            <AITaskCard
              key={task.id}
              task={task}
              onComplete={handleComplete}
              onDismiss={(t) => { setDismissTask(t); setDismissReason(""); }}
              onEscalate={handleEscalate}
              onReassign={(t) => { setReassignTask(t); setReassignTo(t.assigned_to_name || ""); }}
            />
          ))}
        </div>
      )}

      {/* Dismiss Dialog */}
      <Dialog open={!!dismissTask} onOpenChange={(o) => !o && setDismissTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dismiss AI Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">A reason is required when dismissing an AI-generated task.</p>
            <div>
              <Label>Task</Label>
              <p className="text-sm font-medium mt-1">{dismissTask?.task_title}</p>
            </div>
            <div>
              <Label>Reason for dismissal</Label>
              <Textarea value={dismissReason} onChange={(e) => setDismissReason(e.target.value)} placeholder="Explain why this task is being dismissed..." className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDismissTask(null)}>Cancel</Button>
            <Button onClick={handleDismiss} disabled={!dismissReason.trim()}>Dismiss Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Dialog */}
      <Dialog open={!!reassignTask} onOpenChange={(o) => !o && setReassignTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Task</Label>
              <p className="text-sm font-medium mt-1">{reassignTask?.task_title}</p>
            </div>
            <div>
              <Label>Assign to</Label>
              <Input value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} placeholder="Staff member name..." className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignTask(null)}>Cancel</Button>
            <Button onClick={handleReassign} disabled={!reassignTo.trim()}>Reassign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}