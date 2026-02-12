import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, CheckCircle2, XCircle, Clock, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-success/10 text-success border-success/20",
  declined: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default function SuperAdminBilling() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-upgrade-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("upgrade_requests")
        .select(`
          *,
          dealers!upgrade_requests_dealer_id_fkey(name),
          current_plan:plans!upgrade_requests_current_plan_id_fkey(name, monthly_price),
          requested_plan:plans!upgrade_requests_requested_plan_id_fkey(name, monthly_price)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allPlans } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").order("monthly_price");
      if (error) throw error;
      return data;
    },
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dealer_subscriptions")
        .select("*, dealers(name), plans(name, monthly_price)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approveRequest = useMutation({
    mutationFn: async (req: any) => {
      if (!user) throw new Error("Not authenticated");

      // Update request status
      await supabase.from("upgrade_requests").update({
        status: "approved",
        approved_by_user_id: user.id,
        approved_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
      }).eq("id", req.id);

      // Upsert dealer subscription
      await supabase.from("dealer_subscriptions").upsert({
        dealer_id: req.dealer_id,
        plan_id: req.requested_plan_id,
        status: "active",
        start_date: new Date().toISOString().split("T")[0],
        updated_by_user_id: user.id,
      }, { onConflict: "dealer_id" });

      // Create billing document
      const plan = req.requested_plan;
      await supabase.from("billing_documents").insert({
        dealer_id: req.dealer_id,
        upgrade_request_id: req.id,
        document_type: "proforma",
        amount: plan?.monthly_price || 0,
        description: `Plan upgrade to ${plan?.name || "Unknown"} — Pro-forma invoice`,
        created_by_user_id: user.id,
      });

      // Audit log
      await supabase.from("audit_logs").insert({
        dealer_id: req.dealer_id,
        actor_user_id: user.id,
        action_type: "upgrade_approved",
        entity_type: "upgrade_request",
        entity_id: req.id,
        after_data: { plan: plan?.name, admin_notes: adminNotes },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-upgrade-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      toast.success("Upgrade approved");
      setSelectedRequest(null);
      setAdminNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const declineRequest = useMutation({
    mutationFn: async (req: any) => {
      if (!user) throw new Error("Not authenticated");
      await supabase.from("upgrade_requests").update({
        status: "declined",
        declined_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
      }).eq("id", req.id);

      await supabase.from("audit_logs").insert({
        dealer_id: req.dealer_id,
        actor_user_id: user.id,
        action_type: "upgrade_declined",
        entity_type: "upgrade_request",
        entity_id: req.id,
        after_data: { admin_notes: adminNotes },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-upgrade-requests"] });
      toast.success("Request declined");
      setSelectedRequest(null);
      setAdminNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const pendingRequests = requests?.filter((r: any) => r.status === "pending") || [];
  const processedRequests = requests?.filter((r: any) => r.status !== "pending") || [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Billing Management</h1>
        <p className="text-sm text-muted-foreground">Manage upgrade requests and dealer subscriptions</p>
      </div>

      <Tabs defaultValue="requests">
        <TabsList className="mb-4">
          <TabsTrigger value="requests">
            Upgrade Requests {pendingRequests.length > 0 && (
              <span className="ml-2 text-xs bg-warning/20 text-warning px-1.5 rounded-full">{pendingRequests.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}</div>
          ) : !requests?.length ? (
            <div className="text-center py-20 rounded-xl border border-border/50 bg-card/50">
              <ArrowUpCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No upgrade requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req: any) => (
                <div key={req.id} className="p-4 rounded-xl border border-border/50 bg-card/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{req.dealers?.name || "Unknown Dealer"}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.current_plan?.name || "No plan"} → {req.requested_plan?.name || "Unknown"}
                        {req.requested_plan?.monthly_price && ` (£${req.requested_plan.monthly_price}/mo)`}
                      </p>
                      {req.request_notes && <p className="text-xs text-muted-foreground mt-1">"{req.request_notes}"</p>}
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(req.created_at), "d MMM yyyy HH:mm")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[req.status]}`}>{req.status}</span>
                      {req.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => { setSelectedRequest(req); setAdminNotes(""); }}>
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscriptions">
          {subscriptions?.length ? (
            <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Dealer</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Plan</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Price</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-3">Start</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub: any) => (
                    <tr key={sub.id} className="border-b border-border/30">
                      <td className="p-3 text-sm">{sub.dealers?.name}</td>
                      <td className="p-3 text-sm font-medium">{sub.plans?.name}</td>
                      <td className="p-3 text-sm">£{sub.plans?.monthly_price}/mo</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${sub.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{format(new Date(sub.start_date), "d MMM yyyy")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 rounded-xl border border-border/50 bg-card/50">
              <p className="text-muted-foreground">No subscriptions yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="plans">
          {allPlans?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allPlans.map((plan: any) => {
                const features: string[] = plan.features_json || [];
                return (
                  <div key={plan.id} className="p-6 rounded-xl border border-border/50 bg-card/50">
                    <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                    <p className="text-2xl font-bold text-primary mb-1">
                      £{plan.monthly_price}<span className="text-xs text-muted-foreground font-normal">/mo</span>
                    </p>
                    {plan.annual_price && (
                      <p className="text-xs text-muted-foreground mb-4">or £{plan.annual_price}/yr</p>
                    )}
                    <div className="space-y-2">
                      {features.map((f: string) => (
                        <div key={f} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                          <span className="text-xs">{f}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                      {plan.max_users ? `${plan.max_users} users` : "Unlimited users"}
                      {plan.max_checks_per_month ? ` · ${plan.max_checks_per_month} checks/mo` : " · Unlimited checks"}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      {/* Review dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Upgrade Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">Dealer:</span> {selectedRequest.dealers?.name}</p>
                <p className="text-sm"><span className="text-muted-foreground">Current:</span> {selectedRequest.current_plan?.name || "None"}</p>
                <p className="text-sm"><span className="text-muted-foreground">Requested:</span> {selectedRequest.requested_plan?.name} (£{selectedRequest.requested_plan?.monthly_price}/mo)</p>
                {selectedRequest.request_notes && (
                  <p className="text-sm"><span className="text-muted-foreground">Notes:</span> {selectedRequest.request_notes}</p>
                )}
              </div>
              <div>
                <Label className="text-xs">Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => approveRequest.mutate(selectedRequest)}
                  disabled={approveRequest.isPending}
                  className="flex-1"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {approveRequest.isPending ? "Approving..." : "Approve"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => declineRequest.mutate(selectedRequest)}
                  disabled={declineRequest.isPending}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {declineRequest.isPending ? "Declining..." : "Decline"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
