import { useState } from "react";
import { Plus, Search, AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useDataSubjectRequests, useCreateDSR, useUpdateDSR } from "@/hooks/useCompliance";
import { useCustomers, useUserDealerId } from "@/hooks/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditEvent } from "@/hooks/useAuditLogs";
import { format, isPast } from "date-fns";
import { toast } from "sonner";

const DSR_TYPES = ["sar", "erasure", "rectification", "restriction", "objection", "portability"];
const STATUS_LABELS: Record<string, string> = { new: "New", in_review: "In Review", awaiting_id: "Awaiting ID", completed: "Completed", rejected: "Rejected" };

export default function DSRTab() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: dsrs, isLoading } = useDataSubjectRequests(statusFilter);
  const { data: customers } = useCustomers();
  const { data: dealerId } = useUserDealerId();
  const { user } = useAuth();
  const createDSR = useCreateDSR();
  const updateDSR = useUpdateDSR();

  const [form, setForm] = useState({ request_type: "sar", requester_name: "", requester_email: "", requester_phone: "", customer_id: "" });

  const handleCreate = async () => {
    if (!dealerId || !user || !form.requester_name) return;
    try {
      const created = await createDSR.mutateAsync({
        dealer_id: dealerId,
        request_type: form.request_type,
        requester_name: form.requester_name,
        requester_email: form.requester_email || null,
        requester_phone: form.requester_phone || null,
        customer_id: form.customer_id || null,
        assigned_to_user_id: user.id,
      });
      await logAuditEvent({
        dealerId, actorUserId: user.id, actionType: "dsr_created",
        entityType: "data_subject_request", entityId: (created as any).id,
        summary: `DSR ${(created as any).request_number} created: ${form.request_type.toUpperCase()}`,
      });
      toast.success("Data subject request created");
      setOpen(false);
      setForm({ request_type: "sar", requester_name: "", requester_email: "", requester_phone: "", customer_id: "" });
    } catch (err: any) { toast.error(err.message); }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    if (!user || !dealerId) return;
    await updateDSR.mutateAsync({ id, status: newStatus });
    await logAuditEvent({
      dealerId, actorUserId: user.id, actionType: "dsr_status_changed",
      entityType: "data_subject_request", entityId: id, summary: `DSR status → ${newStatus}`,
    });
    toast.success("Status updated");
  };

  const handleVerifyId = async (id: string, verified: boolean) => {
    if (!user || !dealerId) return;
    await updateDSR.mutateAsync({ id, identity_verified: verified });
    await logAuditEvent({
      dealerId, actorUserId: user.id, actionType: "dsr_identity_verified",
      entityType: "data_subject_request", entityId: id, summary: `Identity ${verified ? "verified" : "unverified"}`,
    });
    toast.success(verified ? "Identity verified" : "Verification removed");
  };

  const detail = detailId ? dsrs?.find((d: any) => d.id === detailId) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> New Request</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Data Subject Request</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Request Type</Label>
                <Select value={form.request_type} onValueChange={v => setForm(p => ({ ...p, request_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DSR_TYPES.map(t => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Requester Name *</Label><Input value={form.requester_name} onChange={e => setForm(p => ({ ...p, requester_name: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={form.requester_email} onChange={e => setForm(p => ({ ...p, requester_email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.requester_phone} onChange={e => setForm(p => ({ ...p, requester_phone: e.target.value }))} /></div>
              <div><Label>Link Customer (optional)</Label>
                <Select value={form.customer_id} onValueChange={v => setForm(p => ({ ...p, customer_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {customers?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={createDSR.isPending || !form.requester_name} className="w-full">Create Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Detail panel */}
      {detail && (
        <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{(detail as any).request_number} — {(detail as any).request_type?.toUpperCase()}</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <p><strong>Requester:</strong> {(detail as any).requester_name}</p>
              <p><strong>Email:</strong> {(detail as any).requester_email || "—"}</p>
              <p><strong>Received:</strong> {format(new Date((detail as any).received_at), "d MMM yyyy")}</p>
              <p><strong>Due:</strong> <span className={isPast(new Date((detail as any).due_at)) ? "text-red-400 font-medium" : ""}>{format(new Date((detail as any).due_at), "d MMM yyyy")}</span></p>
              <div className="flex items-center gap-3">
                <Label>Identity Verified</Label>
                <Switch checked={(detail as any).identity_verified} onCheckedChange={v => handleVerifyId((detail as any).id, v)} />
              </div>
              <div><Label>Status</Label>
                <Select value={(detail as any).status} onValueChange={v => handleStatusUpdate((detail as any).id, v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />)}</div>
      ) : !dsrs?.length ? (
        <p className="text-center py-12 text-muted-foreground text-sm">No data subject requests.</p>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Ref</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Type</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Requester</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Due</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">ID</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
            </tr></thead>
            <tbody>
              {dsrs.map((d: any) => {
                const overdue = !["completed", "rejected"].includes(d.status) && isPast(new Date(d.due_at));
                return (
                  <tr key={d.id} onClick={() => setDetailId(d.id)} className="border-b border-border/30 hover:bg-muted/20 cursor-pointer">
                    <td className="p-3 text-xs font-mono text-primary">{d.request_number}</td>
                    <td className="p-3 text-xs uppercase">{d.request_type}</td>
                    <td className="p-3 text-sm">{d.requester_name}</td>
                    <td className="p-3 text-xs hidden md:table-cell">
                      <span className={overdue ? "text-red-400 font-medium" : "text-muted-foreground"}>
                        {overdue && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                        {format(new Date(d.due_at), "d MMM yyyy")}
                      </span>
                    </td>
                    <td className="p-3">{d.identity_verified ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <span className="text-xs text-muted-foreground">No</span>}</td>
                    <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full border border-border/50 bg-muted/30">{STATUS_LABELS[d.status] || d.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
