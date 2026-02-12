import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, Zap, ArrowUpCircle, Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserDealerId } from "@/hooks/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-success/10 text-success border-success/20",
  declined: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default function BillingPage() {
  const { data: dealerId } = useUserDealerId();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [requestedPlanId, setRequestedPlanId] = useState("");
  const [requestNotes, setRequestNotes] = useState("");

  const { data: dealer } = useQuery({
    queryKey: ["dealer-billing", dealerId],
    queryFn: async () => {
      if (!dealerId) return null;
      const { data, error } = await supabase.from("dealers").select("name, status, plan_id").eq("id", dealerId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });

  const { data: subscription } = useQuery({
    queryKey: ["dealer-subscription", dealerId],
    queryFn: async () => {
      if (!dealerId) return null;
      const { data, error } = await supabase.from("dealer_subscriptions").select("*, plans(*)").eq("dealer_id", dealerId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").eq("is_active", true).order("monthly_price");
      if (error) throw error;
      return data;
    },
  });

  const { data: upgradeRequests } = useQuery({
    queryKey: ["upgrade-requests", dealerId],
    queryFn: async () => {
      if (!dealerId) return [];
      const { data, error } = await supabase
        .from("upgrade_requests")
        .select("*, requested_plan:plans!upgrade_requests_requested_plan_id_fkey(name)")
        .eq("dealer_id", dealerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });

  const { data: usageStats } = useQuery({
    queryKey: ["billing-usage", dealerId],
    queryFn: async () => {
      if (!dealerId) return null;
      const [users, checks, cases] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("dealer_id", dealerId).eq("is_active", true),
        supabase.from("vehicle_checks").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase.from("aftersales_cases").select("id", { count: "exact", head: true }).not("status", "in", '("resolved","closed")'),
      ]);
      return {
        activeUsers: users.count ?? 0,
        checksLast30: checks.count ?? 0,
        openCases: cases.count ?? 0,
      };
    },
    enabled: !!dealerId,
  });

  const submitUpgrade = useMutation({
    mutationFn: async () => {
      if (!dealerId || !user) throw new Error("Missing data");
      const { error } = await supabase.from("upgrade_requests").insert({
        dealer_id: dealerId,
        current_plan_id: subscription?.plan_id || null,
        requested_plan_id: requestedPlanId,
        requested_by_user_id: user.id,
        request_notes: requestNotes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upgrade-requests"] });
      toast.success("Upgrade request submitted");
      setUpgradeOpen(false);
      setRequestedPlanId("");
      setRequestNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const currentPlan = subscription?.plans as any;
  const features: string[] = currentPlan?.features_json || [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Billing & Plan</h1>
        <p className="text-sm text-muted-foreground">Manage your subscription and usage</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Current Plan */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Current Plan</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {subscription?.status === "active" ? "Active" : subscription?.status || dealer?.status || "—"}
            </span>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{currentPlan?.name || "No plan assigned"}</p>
              <p className="text-xs text-muted-foreground">{dealer?.name}</p>
            </div>
            {currentPlan && (
              <p className="text-lg font-bold text-primary">
                £{currentPlan.monthly_price}<span className="text-xs text-muted-foreground font-normal">/mo</span>
              </p>
            )}
          </div>
        </div>

        {/* Usage snapshot */}
        {usageStats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border/50 bg-card/50 text-center">
              <p className="text-2xl font-bold">{usageStats.activeUsers}</p>
              <p className="text-xs text-muted-foreground">Active Users</p>
              {currentPlan?.max_users && (
                <p className="text-xs text-muted-foreground mt-1">of {currentPlan.max_users} max</p>
              )}
            </div>
            <div className="p-4 rounded-xl border border-border/50 bg-card/50 text-center">
              <p className="text-2xl font-bold">{usageStats.checksLast30}</p>
              <p className="text-xs text-muted-foreground">Vehicle Checks (30d)</p>
              {currentPlan?.max_checks_per_month && (
                <p className="text-xs text-muted-foreground mt-1">of {currentPlan.max_checks_per_month} max</p>
              )}
            </div>
            <div className="p-4 rounded-xl border border-border/50 bg-card/50 text-center">
              <p className="text-2xl font-bold">{usageStats.openCases}</p>
              <p className="text-xs text-muted-foreground">Open Cases</p>
            </div>
          </div>
        )}

        {/* Features */}
        {features.length > 0 && (
          <div className="p-6 rounded-xl border border-border/50 bg-card/50">
            <h3 className="text-sm font-semibold mb-4">Plan Features</h3>
            <div className="space-y-2">
              {features.map((feature: string) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade request */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Plan Upgrade</h3>
            <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><ArrowUpCircle className="h-4 w-4 mr-2" /> Request Upgrade</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Plan Upgrade</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs">Select Plan</Label>
                    <Select value={requestedPlanId} onValueChange={setRequestedPlanId}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a plan" /></SelectTrigger>
                      <SelectContent>
                        {plans?.filter((p) => p.id !== subscription?.plan_id).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — £{p.monthly_price}/mo
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Notes (optional)</Label>
                    <Textarea
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                      placeholder="Any additional details..."
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={() => submitUpgrade.mutate()}
                    disabled={!requestedPlanId || submitUpgrade.isPending}
                    className="w-full"
                  >
                    {submitUpgrade.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {upgradeRequests?.length ? (
            <div className="space-y-2">
              {upgradeRequests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">
                      Upgrade to {req.requested_plan?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">{format(new Date(req.created_at), "d MMM yyyy")}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[req.status]}`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No upgrade requests</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
