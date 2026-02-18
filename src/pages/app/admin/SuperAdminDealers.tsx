import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Plus, Search, Mail, Eye, KeyRound, Clock, Send, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, differenceInDays } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  trial: "bg-primary/10 text-primary border-primary/20",
};

const initialWizard = {
  legal_name: "", trading_name: "", email: "", phone: "",
  address_line1: "", address_line2: "", city: "", postcode: "",
  fca_number: "", ico_number: "", vat_number: "", company_number: "",
  admin_first_name: "", admin_last_name: "", admin_email: "",
  package_type: "active" as "active" | "trial",
};

export default function SuperAdminDealers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [emailPreview, setEmailPreview] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ ...initialWizard });
  const [setPasswordDialog, setSetPasswordDialog] = useState<{ open: boolean; dealerId: string; dealerName: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notifyDealer, setNotifyDealer] = useState(true);

  const { data: dealers, isLoading } = useQuery({
    queryKey: ["admin-dealers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dealers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: plans } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("id, name").eq("is_active", true).order("monthly_price");
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("You are not logged in. Please refresh and try again.");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboard-dealer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ ...form, created_by: user?.id }),
        }
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || `Error ${response.status}`);
      return json;
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
      const isActive = status === "active" || status === "trial";
      const updatePayload: any = { status: status as any, is_active: isActive };
      // Set trial_ends_at when switching TO trial; always clear it for any other status
      if (status === "trial") {
        updatePayload.trial_ends_at = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        updatePayload.trial_ends_at = null;
      }
      const { error } = await supabase.from("dealers").update(updatePayload).eq("id", id);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("You are not logged in. Please refresh and try again.");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboard-dealer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ resend_dealer_id: dealerId, created_by: user?.id }),
        }
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || `Error ${response.status}`);
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-outbox"] });
      toast.success(data?.message || "Welcome email resent with new temporary password");
    },
    onError: (err: any) => toast.error(`Failed: ${err.message}`),
  });

  const resendEmailOnly = useMutation({
    mutationFn: async (dealerId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("You are not logged in. Please refresh and try again.");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboard-dealer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ resend_email_only_dealer_id: dealerId }),
        }
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || `Error ${response.status}`);
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-outbox"] });
      toast.success(data?.message || "Welcome email resent (password unchanged)");
    },
    onError: (err: any) => toast.error(`Failed: ${err.message}`),
  });

  const resetPassword = useMutation({
    mutationFn: async (dealerId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("You are not logged in. Please refresh and try again.");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-dealer-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ dealer_id: dealerId }),
        }
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || `Error ${response.status}`);
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-outbox"] });
      toast.success(data?.message || "Password reset and emailed to dealer admin");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const setDealerPassword = useMutation({
    mutationFn: async ({ dealerId, password, notify }: { dealerId: string; password: string; notify: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("You are not logged in. Please refresh and try again.");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/set-dealer-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ dealer_id: dealerId, new_password: password, notify_dealer: notify }),
        }
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || `Error ${response.status}`);
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-outbox"] });
      toast.success(data?.message || "Password updated successfully");
      setSetPasswordDialog(null);
      setNewPassword("");
      setNotifyDealer(true);
    },
    onError: (err: any) => toast.error(`Failed: ${err.message}`),
  });

  const filtered = dealers?.filter(d => {
    if (!search) return true;
    const s = search.toLowerCase();
    return d.name.toLowerCase().includes(s) || d.email?.toLowerCase().includes(s) || d.city?.toLowerCase().includes(s);
  });

  const u = (f: string, v: any) => setForm(prev => ({ ...prev, [f]: v }));

  const getTrialDaysLeft = (trialEndsAt: string | null) => {
    if (!trialEndsAt) return null;
    const days = differenceInDays(new Date(trialEndsAt), new Date());
    return days;
  };

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
              <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">Package</h4>
                <Select value={form.package_type} onValueChange={(v) => u("package_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Full Package)</SelectItem>
                    <SelectItem value="trial">Trial (14-day free trial)</SelectItem>
                  </SelectContent>
                </Select>
                {form.package_type === "trial" && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Dealer will be on a 14-day trial of the Professional plan. You'll see a countdown in the dealer list when they're close to expiry.
                  </p>
                )}
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

      {/* Set Password Dialog */}
      <Dialog open={!!setPasswordDialog?.open} onOpenChange={(open) => {
        if (!open) { setSetPasswordDialog(null); setNewPassword(""); setShowPassword(false); setNotifyDealer(true); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Set Password – {setPasswordDialog?.dealerName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs">New Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter a password (min. 8 characters)"
                  className="pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="text-xs text-destructive mt-1">Password must be at least 8 characters</p>
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium">Notify dealer by email</p>
                <p className="text-xs text-muted-foreground">Send the new password to the dealer admin</p>
              </div>
              <Switch checked={notifyDealer} onCheckedChange={setNotifyDealer} />
            </div>
            {!notifyDealer && (
              <p className="text-xs text-warning bg-warning/10 border border-warning/20 rounded-lg p-3">
                The dealer will <strong>not</strong> be emailed. Make sure you communicate the new password to them directly.
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => { setSetPasswordDialog(null); setNewPassword(""); setShowPassword(false); setNotifyDealer(true); }}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={newPassword.length < 8 || setDealerPassword.isPending}
                onClick={() => {
                  if (!setPasswordDialog) return;
                  setDealerPassword.mutate({ dealerId: setPasswordDialog.dealerId, password: newPassword, notify: notifyDealer });
                }}
              >
                {setDealerPassword.isPending ? "Updating..." : "Set Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  {filtered.map((d) => {
                    const trialDaysLeft = d.status === "trial" ? getTrialDaysLeft(d.trial_ends_at) : null;
                    const trialExpiringSoon = trialDaysLeft !== null && trialDaysLeft <= 3 && trialDaysLeft >= 0;
                    const trialExpired = trialDaysLeft !== null && trialDaysLeft < 0;
                    return (
                      <tr key={d.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <p className="text-sm font-medium">{d.name}</p>
                          {d.city && <p className="text-xs text-muted-foreground">{d.city}</p>}
                          {trialDaysLeft !== null && (
                            <p className={`text-xs flex items-center gap-1 mt-0.5 ${trialExpired ? "text-destructive" : trialExpiringSoon ? "text-warning" : "text-muted-foreground"}`}>
                              <Clock className="h-3 w-3" />
                              {trialExpired ? "Trial expired" : `Trial: ${trialDaysLeft}d left`}
                            </p>
                          )}
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <p className="text-xs text-muted-foreground">{d.email || "—"}</p>
                          <p className="text-xs text-muted-foreground">{d.phone || ""}</p>
                        </td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[d.status] ?? statusColors.pending}`}>{d.status}</span>
                        </td>
                        <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                          {format(new Date(d.created_at), "d MMM yyyy")}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 justify-end flex-wrap">
                            {/* Send welcome email only (no password reset) */}
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => resendEmailOnly.mutate(d.id)} title="Resend welcome email (keep current password)">
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                            {/* Resend welcome email with new temp password */}
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => resendWelcome.mutate(d.id)} title="Resend welcome email with NEW temp password">
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                            {/* Manually set a specific password */}
                            <Button
                              size="sm" variant="ghost" className="h-7 w-7 p-0"
                              title="Manually set a specific password"
                              onClick={() => { setSetPasswordDialog({ open: true, dealerId: d.id, dealerName: d.name }); setNewPassword(""); setShowPassword(false); setNotifyDealer(true); }}
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </Button>
                            {/* Reset password (random temp) */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Reset admin password (random temp)">
                                  <KeyRound className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reset Password for {d.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will generate a new random temporary password for the dealer admin and email it to them. Their current password will be invalidated immediately.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => resetPassword.mutate(d.id)}>Reset & Email Password</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            {/* Status dropdown */}
                            <Select value={d.status} onValueChange={(v) => updateStatus.mutate({ id: d.id, status: v })}>
                              <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="trial">Trial</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                              </SelectContent>
                            </Select>
                            {/* Plan dropdown */}
                            <Select
                              value={d.plan_id || ""}
                              onValueChange={async (planUuid) => {
                                if (!planUuid) return;
                                const planEntry = plans?.find(p => p.id === planUuid);
                                const planLabel = planEntry?.name || planUuid;
                                const { error } = await supabase.from("dealers").update({ plan_id: planUuid as any }).eq("id", d.id);
                                if (error) { toast.error(error.message); return; }
                                await supabase.from("audit_logs").insert({
                                  dealer_id: d.id, actor_user_id: user?.id, action_type: "PLAN_CHANGED",
                                  entity_type: "dealer", entity_id: d.id, summary: `Plan changed to ${planLabel}`,
                                });
                                queryClient.invalidateQueries({ queryKey: ["admin-dealers"] });
                                toast.success(`Plan updated to ${planLabel}`);
                              }}
                            >
                              <SelectTrigger className="w-28 h-7 text-xs"><SelectValue placeholder="Set Plan" /></SelectTrigger>
                              <SelectContent>
                                {plans?.map(p => (
                                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
