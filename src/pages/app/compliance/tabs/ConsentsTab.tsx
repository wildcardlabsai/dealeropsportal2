import { useState } from "react";
import { Plus, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerConsents, useCreateConsent, useUpdateConsent } from "@/hooks/useCompliance";
import { useCustomers } from "@/hooks/useCustomers";
import { useUserDealerId } from "@/hooks/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditEvent } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { toast } from "sonner";

const CONSENT_TYPES = ["marketing_email", "marketing_sms", "marketing_call", "whatsapp", "data_sharing_third_party"];
const LEGAL_BASES = ["consent", "legitimate_interest"];

export default function ConsentsTab() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { data: consents, isLoading } = useCustomerConsents();
  const { data: customers } = useCustomers();
  const { data: dealerId } = useUserDealerId();
  const { user } = useAuth();
  const createConsent = useCreateConsent();
  const updateConsent = useUpdateConsent();

  const [form, setForm] = useState({
    customer_id: "",
    consent_type: "marketing_email",
    legal_basis: "consent",
    source: "",
    notes: "",
  });

  const filtered = consents?.filter((c: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name = `${c.customers?.first_name || ""} ${c.customers?.last_name || ""}`.toLowerCase();
    return name.includes(s) || c.customers?.email?.toLowerCase().includes(s);
  });

  const handleCreate = async () => {
    if (!dealerId || !user || !form.customer_id) return;
    try {
      await createConsent.mutateAsync({
        dealer_id: dealerId,
        customer_id: form.customer_id,
        consent_type: form.consent_type,
        legal_basis: form.legal_basis,
        source: form.source || null,
        captured_by_user_id: user.id,
        notes: form.notes || null,
      });
      await logAuditEvent({
        dealerId, actorUserId: user.id, actionType: "consent_recorded",
        entityType: "customer_consent", summary: `Consent recorded: ${form.consent_type}`,
      });
      toast.success("Consent recorded");
      setOpen(false);
      setForm({ customer_id: "", consent_type: "marketing_email", legal_basis: "consent", source: "", notes: "" });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleWithdraw = async (id: string) => {
    if (!user || !dealerId) return;
    await updateConsent.mutateAsync({ id, status: "withdrawn", withdrawn_at: new Date().toISOString() });
    await logAuditEvent({
      dealerId, actorUserId: user.id, actionType: "consent_withdrawn",
      entityType: "customer_consent", entityId: id, summary: "Consent withdrawn",
    });
    toast.success("Consent withdrawn");
  };

  const exportCSV = () => {
    if (!filtered?.length) return;
    const rows = filtered.map((c: any) => [
      `${c.customers?.first_name || ""} ${c.customers?.last_name || ""}`,
      c.customers?.email || "",
      c.consent_type, c.status, c.legal_basis, c.source || "",
      c.captured_at ? format(new Date(c.captured_at), "yyyy-MM-dd") : "",
      c.withdrawn_at ? format(new Date(c.withdrawn_at), "yyyy-MM-dd") : "",
    ]);
    const csv = "Customer,Email,Type,Status,Legal Basis,Source,Captured,Withdrawn\n" + rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "consents.csv"; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search customer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-3 w-3 mr-1" /> Export CSV</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-3 w-3 mr-1" /> Record Consent</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Consent</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Customer</Label>
                  <Select value={form.customer_id} onValueChange={v => setForm(p => ({ ...p, customer_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>
                      {customers?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Consent Type</Label>
                  <Select value={form.consent_type} onValueChange={v => setForm(p => ({ ...p, consent_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONSENT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Legal Basis</Label>
                  <Select value={form.legal_basis} onValueChange={v => setForm(p => ({ ...p, legal_basis: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEGAL_BASES.map(b => <SelectItem key={b} value={b}>{b.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Source</Label><Input value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} placeholder="e.g. Invoice form" /></div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
                <Button onClick={handleCreate} disabled={createConsent.isPending || !form.customer_id} className="w-full">Record</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" />)}</div>
      ) : !filtered?.length ? (
        <p className="text-center py-12 text-muted-foreground text-sm">No consent records yet.</p>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Customer</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Type</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Basis</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Captured</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-b border-border/30 hover:bg-muted/20">
                  <td className="p-3 text-sm">{c.customers?.first_name} {c.customers?.last_name}</td>
                  <td className="p-3 text-xs capitalize">{c.consent_type?.replace(/_/g, " ")}</td>
                  <td className="p-3 text-xs capitalize hidden md:table-cell">{c.legal_basis?.replace(/_/g, " ")}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${c.status === "granted" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"}`}>
                      {c.status === "granted" ? "Granted" : "Withdrawn"}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground hidden md:table-cell">{format(new Date(c.captured_at), "d MMM yyyy")}</td>
                  <td className="p-3">
                    {c.status === "granted" && (
                      <Button variant="ghost" size="sm" className="text-xs text-red-400" onClick={() => handleWithdraw(c.id)}>Withdraw</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
