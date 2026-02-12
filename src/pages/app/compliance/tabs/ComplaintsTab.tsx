import { useState } from "react";
import { Plus, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useComplaints, useCreateComplaint, useUpdateComplaint } from "@/hooks/useCompliance";
import { useCustomers, useUserDealerId } from "@/hooks/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditEvent } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { toast } from "sonner";

const CHANNELS = ["phone", "email", "in_person", "letter", "other"];
const CATEGORIES = ["service", "vehicle_quality", "finance", "warranty", "aftersales", "other"];
const STATUS_LABELS: Record<string, string> = { open: "Open", under_investigation: "Under Investigation", resolved: "Resolved", closed: "Closed" };

export default function ComplaintsTab() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: complaints, isLoading } = useComplaints(statusFilter);
  const { data: customers } = useCustomers();
  const { data: dealerId } = useUserDealerId();
  const { user } = useAuth();
  const createComplaint = useCreateComplaint();
  const updateComplaint = useUpdateComplaint();

  const [form, setForm] = useState({ customer_id: "", customer_name: "", channel: "phone", category: "other", description: "" });
  const [resolutionText, setResolutionText] = useState("");

  const filtered = complaints?.filter((c: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.complaint_ref?.toLowerCase().includes(s) || c.customer_name?.toLowerCase().includes(s) || c.description?.toLowerCase().includes(s);
  });

  const handleCreate = async () => {
    if (!dealerId || !user || (!form.customer_name && !form.customer_id)) return;
    const custName = form.customer_id
      ? customers?.find((c: any) => c.id === form.customer_id)
        ? `${customers.find((c: any) => c.id === form.customer_id)!.first_name} ${customers.find((c: any) => c.id === form.customer_id)!.last_name}`
        : form.customer_name
      : form.customer_name;
    try {
      const created = await createComplaint.mutateAsync({
        dealer_id: dealerId,
        customer_id: form.customer_id || null,
        customer_name: custName,
        channel: form.channel,
        category: form.category,
        description: form.description,
        assigned_to_user_id: user.id,
      });
      await logAuditEvent({
        dealerId, actorUserId: user.id, actionType: "complaint_created",
        entityType: "complaint", entityId: (created as any).id,
        summary: `Complaint ${(created as any).complaint_ref} created`,
      });
      toast.success("Complaint logged");
      setOpen(false);
      setForm({ customer_id: "", customer_name: "", channel: "phone", category: "other", description: "" });
    } catch (err: any) { toast.error(err.message); }
  };

  const handleResolve = async (id: string) => {
    if (!user || !dealerId) return;
    await updateComplaint.mutateAsync({ id, status: "resolved", resolution_summary: resolutionText || null, resolution_at: new Date().toISOString() });
    await logAuditEvent({ dealerId, actorUserId: user.id, actionType: "complaint_resolved", entityType: "complaint", entityId: id, summary: "Complaint resolved" });
    toast.success("Complaint resolved");
    setDetailId(null);
    setResolutionText("");
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!user || !dealerId) return;
    await updateComplaint.mutateAsync({ id, status: newStatus });
    await logAuditEvent({ dealerId, actorUserId: user.id, actionType: "complaint_status_changed", entityType: "complaint", entityId: id, summary: `Status → ${newStatus}` });
    toast.success("Status updated");
  };

  const exportCSV = () => {
    if (!filtered?.length) return;
    const rows = filtered.map((c: any) => [c.complaint_ref, c.customer_name, c.category, c.channel, c.status, c.received_at ? format(new Date(c.received_at), "yyyy-MM-dd") : "", c.description?.replace(/,/g, " ")]);
    const csv = "Ref,Customer,Category,Channel,Status,Received,Description\n" + rows.map((r: any) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "complaints.csv"; a.click();
  };

  const detail = detailId ? filtered?.find((c: any) => c.id === detailId) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-3 w-3 mr-1" /> CSV</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Log Complaint</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Complaint</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Link Customer (optional)</Label>
                  <Select value={form.customer_id} onValueChange={v => setForm(p => ({ ...p, customer_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select or type name" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {customers?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {!form.customer_id && <div><Label>Customer Name *</Label><Input value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} /></div>}
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Channel</Label>
                    <Select value={form.channel} onValueChange={v => setForm(p => ({ ...p, channel: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CHANNELS.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Description *</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
                <Button onClick={handleCreate} disabled={createComplaint.isPending} className="w-full">Log Complaint</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {detail && (
        <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{(detail as any).complaint_ref}</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <p><strong>Customer:</strong> {(detail as any).customer_name}</p>
              <p><strong>Category:</strong> {(detail as any).category?.replace(/_/g, " ")}</p>
              <p><strong>Channel:</strong> {(detail as any).channel?.replace(/_/g, " ")}</p>
              <p><strong>Received:</strong> {format(new Date((detail as any).received_at), "d MMM yyyy")}</p>
              <p><strong>Description:</strong> {(detail as any).description}</p>
              <div><Label>Status</Label>
                <Select value={(detail as any).status} onValueChange={v => handleStatusChange((detail as any).id, v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {(detail as any).status !== "resolved" && (detail as any).status !== "closed" && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <Label>Resolution Summary</Label>
                  <Textarea value={resolutionText} onChange={e => setResolutionText(e.target.value)} rows={2} />
                  <Button size="sm" onClick={() => handleResolve((detail as any).id)}>Mark Resolved</Button>
                </div>
              )}
              {(detail as any).resolution_summary && <p className="text-emerald-400 text-xs"><strong>Resolution:</strong> {(detail as any).resolution_summary}</p>}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isLoading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />)}</div>
      ) : !filtered?.length ? (
        <p className="text-center py-12 text-muted-foreground text-sm">No complaints logged.</p>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Ref</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Customer</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Category</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Channel</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Received</th>
            </tr></thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} onClick={() => setDetailId(c.id)} className="border-b border-border/30 hover:bg-muted/20 cursor-pointer">
                  <td className="p-3 text-xs font-mono text-primary">{c.complaint_ref}</td>
                  <td className="p-3 text-sm">{c.customer_name}</td>
                  <td className="p-3 text-xs capitalize hidden md:table-cell">{c.category?.replace(/_/g, " ")}</td>
                  <td className="p-3 text-xs capitalize hidden md:table-cell">{c.channel?.replace(/_/g, " ")}</td>
                  <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full border border-border/50 bg-muted/30">{STATUS_LABELS[c.status] || c.status}</span></td>
                  <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell">{format(new Date(c.received_at), "d MMM yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
