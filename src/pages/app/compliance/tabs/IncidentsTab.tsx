import { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useComplianceIncidents, useCreateIncident, useUpdateIncident } from "@/hooks/useCompliance";
import { useUserDealerId } from "@/hooks/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditEvent } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { toast } from "sonner";

const SEVERITIES = ["low", "medium", "high", "critical"];
const STATUS_LABELS: Record<string, string> = { open: "Open", monitoring: "Monitoring", closed: "Closed" };

const severityStyles: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-amber-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

export default function IncidentsTab() {
  const [open, setOpen] = useState(false);
  const { data: incidents, isLoading } = useComplianceIncidents();
  const { data: dealerId } = useUserDealerId();
  const { user } = useAuth();
  const createIncident = useCreateIncident();
  const updateIncident = useUpdateIncident();

  const [form, setForm] = useState({ title: "", description: "", severity: "low", occurred_at: new Date().toISOString().split("T")[0] });

  const handleCreate = async () => {
    if (!dealerId || !user || !form.title || !form.description) return;
    try {
      await createIncident.mutateAsync({
        dealer_id: dealerId,
        title: form.title,
        description: form.description,
        severity: form.severity,
        occurred_at: form.occurred_at,
        created_by_user_id: user.id,
      });
      await logAuditEvent({
        dealerId, actorUserId: user.id, actionType: "incident_created",
        entityType: "compliance_incident", summary: `Incident logged: ${form.title}`,
      });
      toast.success("Incident logged");
      setOpen(false);
      setForm({ title: "", description: "", severity: "low", occurred_at: new Date().toISOString().split("T")[0] });
    } catch (err: any) { toast.error(err.message); }
  };

  const handleClose = async (id: string) => {
    if (!user || !dealerId) return;
    await updateIncident.mutateAsync({ id, status: "closed" });
    await logAuditEvent({ dealerId, actorUserId: user.id, actionType: "incident_closed", entityType: "compliance_incident", entityId: id, summary: "Incident closed" });
    toast.success("Incident closed");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Log Incident</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Compliance Incident</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>Description *</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Severity</Label>
                  <Select value={form.severity} onValueChange={v => setForm(p => ({ ...p, severity: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SEVERITIES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Occurred At</Label><Input type="date" value={form.occurred_at} onChange={e => setForm(p => ({ ...p, occurred_at: e.target.value }))} /></div>
              </div>
              <Button onClick={handleCreate} disabled={createIncident.isPending || !form.title} className="w-full">Log Incident</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />)}</div>
      ) : !incidents?.length ? (
        <p className="text-center py-12 text-muted-foreground text-sm">No incidents recorded.</p>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc: any) => (
            <Card key={inc.id} className="glass">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className={`h-4 w-4 ${severityStyles[inc.severity] || ""}`} />
                      <h3 className="text-sm font-medium">{inc.title}</h3>
                      <span className={`text-[10px] font-medium uppercase ${severityStyles[inc.severity] || ""}`}>{inc.severity}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{inc.description}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(inc.occurred_at), "d MMM yyyy")} · {STATUS_LABELS[inc.status]}</p>
                  </div>
                  {inc.status !== "closed" && (
                    <Button size="sm" variant="outline" onClick={() => handleClose(inc.id)}>Close</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
