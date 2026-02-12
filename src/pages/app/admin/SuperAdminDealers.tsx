import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Plus, Search, Mail, RotateCcw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
  pending: "bg-warning/10 text-warning border-warning/20",
};

const initialWizard = {
  legal_name: "", trading_name: "", email: "", phone: "",
  address_line1: "", address_line2: "", city: "", postcode: "",
  fca_number: "", ico_number: "", vat_number: "", company_number: "",
  admin_first_name: "", admin_last_name: "", admin_email: "",
};

export default function SuperAdminDealers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [emailPreview, setEmailPreview] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ ...initialWizard });

  const { data: dealers, isLoading } = useQuery({
    queryKey: ["admin-dealers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dealers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: emailOutbox } = useQuery({
    queryKey: ["email-outbox"],
    queryFn: async () => {
      const { data } = await supabase.from("email_outbox").select("*").order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  const createDealerWizard = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("onboard-dealer", {
        body: { ...form, created_by: user?.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-dealers"] });
      queryClient.invalidateQueries({ queryKey: ["email-outbox"] });
      toast.success(data?.message || "Dealer created and welcome email sent");
      setWizardOpen(false);
      setForm({ ...initialWizard });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const isActive = status === "active";
      const { error } = await supabase.from("dealers").update({ status: status as any, is_active: isActive }).eq("id", id);
      if (error) throw error;
      await supabase.from("dealer_onboarding_events").insert({
        dealer_id: id, created_by_superadmin_user_id: user?.id,
        event_type: status === "suspended" ? "DEALER_SUSPENDED" : "DEALER_REACTIVATED",
      });
      await supabase.from("audit_logs").insert({
        dealer_id: id, actor_user_id: user?.id, action_type: status === "suspended" ? "DEALER_SUSPENDED" : "DEALER_REACTIVATED",
        entity_type: "dealer", entity_id: id, summary: `Dealer ${status}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dealers"] });
      toast.success("Status updated");
    },
  });

  const resendWelcome = useMutation({
    mutationFn: async (dealerId: string) => {
      const { data, error } = await supabase.functions.invoke("onboard-dealer", {
        body: { resend_dealer_id: dealerId, created_by: user?.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-outbox"] });
      toast.success("Welcome email resent");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = dealers?.filter(d => {
    if (!search) return true;
    const s = search.toLowerCase();
    return d.name.toLowerCase().includes(s) || d.email?.toLowerCase().includes(s) || d.city?.toLowerCase().includes(s);
  });

  const u = (f: string, v: any) => setForm(prev => ({ ...prev, [f]: v }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dealer Management</h1>
          <p className="text-sm text-muted-foreground">{dealers?.length ?? 0} dealership{dealers?.length !== 1 ? "s" : ""}</p>
        </div>
        <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Onboard Dealer</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create New Dealership</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">Business Details</h4>
                <div><Label className="text-xs">Legal Name *</Label><Input value={form.legal_name} onChange={e => u("legal_name", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Trading Name</Label><Input value={form.trading_name} onChange={e => u("trading_name", e.target.value)} className="mt-1" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Email *</Label><Input value={form.email} onChange={e => u("email", e.target.value)} className="mt-1" /></div>
                  <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => u("phone", e.target.value)} className="mt-1" /></div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">Address</h4>
                <div><Label className="text-xs">Address Line 1</Label><Input value={form.address_line1} onChange={e => u("address_line1", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Address Line 2</Label><Input value={form.address_line2} onChange={e => u("address_line2", e.target.value)} className="mt-1" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">City / Town</Label><Input value={form.city} onChange={e => u("city", e.target.value)} className="mt-1" /></div>
                  <div><Label className="text-xs">Postcode</Label><Input value={form.postcode} onChange={e => u("postcode", e.target.value)} className="mt-1" /></div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">Compliance (Optional)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">FCA Number</Label><Input value={form.fca_number} onChange={e => u("fca_number", e.target.value)} className="mt-1" /></div>
                  <div><Label className="text-xs">ICO Number</Label><Input value={form.ico_number} onChange={e => u("ico_number", e.target.value)} className="mt-1" /></div>
                  <div><Label className="text-xs">VAT Number</Label><Input value={form.vat_number} onChange={e => u("vat_number", e.target.value)} className="mt-1" /></div>
                  <div><Label className="text-xs">Company Number</Label><Input value={form.company_number} onChange={e => u("company_number", e.target.value)} className="mt-1" /></div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                <h4 className="text-xs font-semibold uppercase text-primary">Initial Admin User</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">First Name *</Label><Input value={form.admin_first_name} onChange={e => u("admin_first_name", e.target.value)} className="mt-1" /></div>
                  <div><Label className="text-xs">Last Name *</Label><Input value={form.admin_last_name} onChange={e => u("admin_last_name", e.target.value)} className="mt-1" /></div>
                </div>
                <div><Label className="text-xs">Admin Email *</Label><Input type="email" value={form.admin_email || form.email} onChange={e => u("admin_email", e.target.value)} className="mt-1" placeholder="Defaults to dealer email" /></div>
              </div>
              <Button
                onClick={() => createDealerWizard.mutate()}
                disabled={!form.legal_name || !form.email || !form.admin_first_name || !form.admin_last_name || createDealerWizard.isPending}
                className="w-full"
              >
                {createDealerWizard.isPending ? "Creating Dealer..." : "Create Dealer & Send Welcome Email"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="dealers">
        <TabsList className="mb-4">
          <TabsTrigger value="dealers">Dealers</TabsTrigger>
          <TabsTrigger value="emails">Email Outbox</TabsTrigger>
        </TabsList>

        <TabsContent value="dealers">
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search dealers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-lg bg-muted/30 animate-pulse" />)}</div>
          ) : !filtered?.length ? (
            <div className="text-center py-20 rounded-xl border border-border/50 bg-card/50">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No dealers found</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Dealer</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Contact</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Created</th>
                    <th className="text-right text-xs font-medium text-muted-foreground p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <p className="text-sm font-medium">{d.name}</p>
                        {d.city && <p className="text-xs text-muted-foreground">{d.city}</p>}
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <p className="text-xs text-muted-foreground">{d.email || "—"}</p>
                        <p className="text-xs text-muted-foreground">{d.phone || ""}</p>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[d.status]}`}>{d.status}</span>
                      </td>
                      <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                        {format(new Date(d.created_at), "d MMM yyyy")}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 justify-end">
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => resendWelcome.mutate(d.id)} title="Resend welcome email">
                            <Mail className="h-3.5 w-3.5" />
                          </Button>
                          <Select value={d.status} onValueChange={(v) => updateStatus.mutate({ id: d.id, status: v })}>
                            <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="emails">
          <div className="space-y-3">
            {!emailOutbox?.length ? (
              <div className="text-center py-12 rounded-xl border border-border/50 bg-card/50">
                <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No emails sent yet</p>
              </div>
            ) : emailOutbox.map(e => (
              <div key={e.id} className="p-4 rounded-xl border border-border/50 bg-card/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{e.subject}</p>
                    <p className="text-xs text-muted-foreground">To: {e.to_email} · {format(new Date(e.created_at), "d MMM yyyy HH:mm")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${e.status === "sent" ? "bg-success/10 text-success border-success/20" : e.status === "failed" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                      {e.status}
                    </span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEmailPreview(emailPreview?.id === e.id ? null : e)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {emailPreview?.id === e.id && (
                  <div className="mt-3 p-4 rounded-lg bg-background border border-border/30 text-xs whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                    {e.body_text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
