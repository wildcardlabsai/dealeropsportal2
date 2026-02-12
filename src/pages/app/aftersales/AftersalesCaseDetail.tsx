import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Paperclip, Clock, AlertTriangle, User, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAftersalesCase, useUpdateAftersalesCase,
  useAftersalesUpdates, useCreateAftersalesUpdate,
  useAftersalesAttachments, useUploadAftersalesAttachment,
} from "@/hooks/useAftersalesCases";
import { useUserDealerId } from "@/hooks/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInHours } from "date-fns";

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  investigating: { label: "Investigating", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  awaiting_customer: { label: "Awaiting Customer", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  awaiting_garage: { label: "Awaiting Garage", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  approved_repair: { label: "Approved Repair", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  in_repair: { label: "In Repair", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  resolved: { label: "Resolved", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground border-border" },
};

const outcomeOptions = [
  { value: "repair", label: "Repair" },
  { value: "refund", label: "Full Refund" },
  { value: "partial_refund", label: "Partial Refund" },
  { value: "goodwill", label: "Goodwill Gesture" },
  { value: "reject", label: "Rejected" },
  { value: "diagnostic_only", label: "Diagnostic Only" },
  { value: "other", label: "Other" },
];

const updateTypeOptions = [
  { value: "note", label: "Internal Note" },
  { value: "status_change", label: "Status Change" },
  { value: "customer_contact", label: "Customer Contact" },
  { value: "garage_update", label: "Garage Update" },
  { value: "cost_update", label: "Cost Update" },
];

export default function AftersalesCaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dealerId } = useUserDealerId();
  const { data: cas, isLoading } = useAftersalesCase(id);
  const { data: updates } = useAftersalesUpdates(id);
  const { data: attachments } = useAftersalesAttachments(id);
  const updateCase = useUpdateAftersalesCase();
  const createUpdate = useCreateAftersalesUpdate();
  const uploadAttachment = useUploadAftersalesAttachment();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("note");
  const [newStatus, setNewStatus] = useState("");

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 rounded-lg bg-primary animate-pulse" /></div>;
  }

  if (!cas) {
    return <div className="text-center py-20 text-muted-foreground">Case not found</div>;
  }

  const slaHours = differenceInHours(new Date(), new Date(cas.created_at));
  const slaRemaining = cas.sla_target_hours - slaHours;
  const slaBreached = !cas.first_response_at && slaRemaining <= 0 && cas.status !== "closed" && cas.status !== "resolved";

  const handleStatusChange = async (status: string) => {
    if (!dealerId || !user) return;
    const oldStatus = cas.status;
    try {
      const extraFields: Record<string, unknown> = {};
      if (status === "resolved") extraFields.resolved_at = new Date().toISOString();
      if (status === "closed") extraFields.closed_at = new Date().toISOString();
      if (!cas.first_response_at && status !== "new") extraFields.first_response_at = new Date().toISOString();

      await updateCase.mutateAsync({ id: cas.id, status: status as any, ...extraFields });
      await createUpdate.mutateAsync({
        dealer_id: dealerId,
        case_id: cas.id,
        created_by_user_id: user.id,
        update_type: "status_change",
        message: `Status changed from ${oldStatus} to ${status}`,
        old_status: oldStatus,
        new_status: status,
      });
      toast.success("Status updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !dealerId || !user) return;
    try {
      await createUpdate.mutateAsync({
        dealer_id: dealerId,
        case_id: cas.id,
        created_by_user_id: user.id,
        update_type: noteType,
        message: newNote,
      });
      if (!cas.first_response_at) {
        await updateCase.mutateAsync({ id: cas.id, first_response_at: new Date().toISOString() });
      }
      setNewNote("");
      toast.success("Update added");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAttachment.mutateAsync({ caseId: cas.id, file });
      await createUpdate.mutateAsync({
        dealer_id: dealerId!,
        case_id: cas.id,
        created_by_user_id: user!.id,
        update_type: "document_added",
        message: `Uploaded file: ${file.name}`,
      });
      toast.success("File uploaded");
    } catch (err: any) {
      toast.error(err.message);
    }
    e.target.value = "";
  };

  const handleOutcomeChange = async (outcome: string) => {
    try {
      await updateCase.mutateAsync({ id: cas.id, outcome: outcome as any });
      toast.success("Outcome updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCostUpdate = async (field: string, value: string) => {
    try {
      await updateCase.mutateAsync({ id: cas.id, [field]: parseFloat(value) || null });
      toast.success("Updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/aftersales")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{cas.case_number}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusConfig[cas.status]?.color || ""}`}>
              {statusConfig[cas.status]?.label || cas.status}
            </span>
            {slaBreached && (
              <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-3 w-3" /> SLA Breached
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{cas.summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="p-5 rounded-xl border border-border/50 bg-card/50">
            <h3 className="text-sm font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{cas.description}</p>
          </div>

          {/* Timeline */}
          <div className="p-5 rounded-xl border border-border/50 bg-card/50">
            <h3 className="text-sm font-semibold mb-4">Timeline</h3>

            {/* Add note form */}
            <div className="mb-4 space-y-2">
              <div className="flex gap-2">
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {updateTypeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add an update..."
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={handleAddNote} disabled={!newNote.trim()} size="icon" className="self-end">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Timeline entries */}
            <div className="space-y-3">
              {updates?.map((u: any) => (
                <div key={u.id} className="flex gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium capitalize">{u.update_type?.replace("_", " ")}</span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(u.created_at), "d MMM yyyy HH:mm")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{u.message}</p>
                  </div>
                </div>
              ))}
              {(!updates || updates.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No updates yet</p>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="p-5 rounded-xl border border-border/50 bg-card/50">
            <h3 className="text-sm font-semibold mb-3">Attachments</h3>
            <div className="space-y-2">
              {attachments?.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{a.file_name}</span>
                    <span className="text-[10px] text-muted-foreground">{a.file_size ? `${(a.file_size / 1024).toFixed(0)}KB` : ""}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={async () => {
                      const { data } = await supabase.storage.from("aftersales-attachments").createSignedUrl(a.file_path, 60);
                      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {(!attachments || attachments.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-2">No attachments</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <div className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</h3>
            <Select value={cas.status} onValueChange={handleStatusChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Outcome */}
          <div className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outcome</h3>
            <Select value={cas.outcome || ""} onValueChange={handleOutcomeChange}>
              <SelectTrigger><SelectValue placeholder="Set outcome" /></SelectTrigger>
              <SelectContent>
                {outcomeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Costs */}
          <div className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financials</h3>
            <div>
              <Label className="text-[10px] text-muted-foreground">Cost Estimate (£)</Label>
              <Input
                type="number"
                defaultValue={cas.cost_estimate ?? ""}
                onBlur={(e) => handleCostUpdate("cost_estimate", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Goodwill Amount (£)</Label>
              <Input
                type="number"
                defaultValue={cas.goodwill_amount ?? ""}
                onBlur={(e) => handleCostUpdate("goodwill_amount", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* SLA */}
          <div className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SLA</h3>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Target: {cas.sla_target_hours}h</span>
            </div>
            {cas.first_response_at ? (
              <p className="text-xs text-emerald-400">First response: {format(new Date(cas.first_response_at), "d MMM HH:mm")}</p>
            ) : slaBreached ? (
              <p className="text-xs text-red-400 font-medium">Breached by {Math.abs(slaRemaining)}h</p>
            ) : (
              <p className="text-xs text-amber-400">{slaRemaining}h remaining</p>
            )}
          </div>

          {/* Details */}
          <div className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{cas.issue_category}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><span className="capitalize">{cas.priority}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Complaint Date</span><span>{cas.complaint_date}</span></div>
              {cas.customers && (
                <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{(cas.customers as any).first_name} {(cas.customers as any).last_name}</span></div>
              )}
              {cas.vehicles && (
                <div className="flex justify-between"><span className="text-muted-foreground">Vehicle</span><span>{(cas.vehicles as any).vrm}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{format(new Date(cas.created_at), "d MMM yyyy")}</span></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
