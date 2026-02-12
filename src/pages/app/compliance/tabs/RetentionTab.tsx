import { useState, useEffect } from "react";
import { Save, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRetentionSettings, useUpsertRetentionSettings, useRetentionQueue, useUpdateRetentionItem } from "@/hooks/useCompliance";
import { useUserDealerId } from "@/hooks/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditEvent } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { toast } from "sonner";

const ENTITY_FIELDS = [
  { key: "customers_retention_months", label: "Customers" },
  { key: "invoices_retention_months", label: "Invoices" },
  { key: "aftersales_retention_months", label: "Aftersales" },
  { key: "warranty_retention_months", label: "Warranties" },
  { key: "vehicle_checks_retention_months", label: "Vehicle Checks" },
  { key: "tasks_retention_months", label: "Tasks" },
  { key: "courtesy_loans_retention_months", label: "Courtesy Loans" },
];

const QUEUE_STATUS_LABELS: Record<string, string> = { pending: "Pending", approved: "Approved", deleted: "Deleted", skipped: "Skipped" };

export default function RetentionTab() {
  const { data: settings } = useRetentionSettings();
  const { data: queueItems } = useRetentionQueue();
  const { data: dealerId } = useUserDealerId();
  const { user } = useAuth();
  const upsertSettings = useUpsertRetentionSettings();
  const updateItem = useUpdateRetentionItem();

  const [form, setForm] = useState<Record<string, any>>({
    customers_retention_months: 72, invoices_retention_months: 72, aftersales_retention_months: 72,
    warranty_retention_months: 72, vehicle_checks_retention_months: 24, tasks_retention_months: 24,
    courtesy_loans_retention_months: 24, auto_delete_enabled: false,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        customers_retention_months: settings.customers_retention_months,
        invoices_retention_months: settings.invoices_retention_months,
        aftersales_retention_months: settings.aftersales_retention_months,
        warranty_retention_months: settings.warranty_retention_months,
        vehicle_checks_retention_months: settings.vehicle_checks_retention_months,
        tasks_retention_months: settings.tasks_retention_months,
        courtesy_loans_retention_months: settings.courtesy_loans_retention_months,
        auto_delete_enabled: settings.auto_delete_enabled,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!dealerId || !user) return;
    await upsertSettings.mutateAsync({ dealer_id: dealerId, ...form });
    await logAuditEvent({
      dealerId, actorUserId: user.id, actionType: "retention_settings_updated",
      entityType: "retention_settings", summary: "Data retention settings updated", afterData: form,
    });
    toast.success("Retention settings saved");
  };

  const handleApprove = async (id: string) => {
    if (!user || !dealerId) return;
    await updateItem.mutateAsync({ id, status: "approved", approved_by_user_id: user.id, approved_at: new Date().toISOString() });
    await logAuditEvent({ dealerId, actorUserId: user.id, actionType: "retention_approved", entityType: "retention_queue", entityId: id, summary: "Retention item approved for deletion" });
    toast.success("Approved for deletion");
  };

  const handleSkip = async (id: string) => {
    if (!user || !dealerId) return;
    await updateItem.mutateAsync({ id, status: "skipped" });
    await logAuditEvent({ dealerId, actorUserId: user.id, actionType: "retention_skipped", entityType: "retention_queue", entityId: id, summary: "Retention item skipped" });
    toast.success("Item skipped");
  };

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader><CardTitle className="text-sm">Retention Policy Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ENTITY_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <Label className="text-xs">{label} (months)</Label>
                <Input type="number" value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))} />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Switch checked={form.auto_delete_enabled} onCheckedChange={v => setForm(p => ({ ...p, auto_delete_enabled: v }))} />
            <Label className="text-xs">Auto-delete enabled (requires approval)</Label>
          </div>
          <Button onClick={handleSave} disabled={upsertSettings.isPending}><Save className="h-3 w-3 mr-1" /> Save Settings</Button>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Retention Queue</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!queueItems?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No items in retention queue.</p>
          ) : (
            <div className="space-y-2">
              {queueItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                  <div>
                    <p className="text-sm font-medium capitalize">{item.entity_type?.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{item.reason} · Eligible: {format(new Date(item.eligible_at), "d MMM yyyy")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full border border-border/50 bg-muted/30">{QUEUE_STATUS_LABELS[item.status]}</span>
                    {item.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleApprove(item.id)}>Approve</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleSkip(item.id)}>Skip</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
