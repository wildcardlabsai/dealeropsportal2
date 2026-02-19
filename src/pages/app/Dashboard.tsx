import { motion } from "framer-motion";
import {
  Users, Car, FileText, Wrench, Target, Shield, Clock, CheckCircle2, AlertCircle,
  Plus, ArrowUpRight, ArrowDownRight, Minus, Megaphone, ShieldAlert, TrendingUp,
  PoundSterling
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserDealerId } from "@/hooks/useCustomers";
import { format, isToday, isPast, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function useDashboardStats() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["dashboard-stats", dealerId],
    queryFn: async () => {
      const [customers, vehicles, leads, invoices, aftersales, warranties] = await Promise.all([
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("status", "in_stock"),
        supabase.from("leads").select("id", { count: "exact", head: true }).in("status", ["new", "contacted", "viewing", "negotiating"]),
        supabase.from("invoices").select("id", { count: "exact", head: true }),
        supabase.from("aftersales_cases").select("id", { count: "exact", head: true }).in("status", ["new", "investigating", "in_repair", "awaiting_customer", "awaiting_garage"]),
        supabase.from("warranties").select("id", { count: "exact", head: true }).eq("status", "active"),
      ]);
      return {
        customers: customers.count ?? 0,
        vehiclesInStock: vehicles.count ?? 0,
        openLeads: leads.count ?? 0,
        invoices: invoices.count ?? 0,
        aftersalesOpen: aftersales.count ?? 0,
        activeWarranties: warranties.count ?? 0,
      };
    },
    enabled: !!dealerId,
  });
}

function useMonthlyRevenue() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["dashboard-revenue", dealerId],
    queryFn: async () => {
      const now = new Date();
      const thisStart = startOfMonth(now).toISOString();
      const thisEnd = endOfMonth(now).toISOString();
      const lastStart = startOfMonth(subMonths(now, 1)).toISOString();
      const lastEnd = endOfMonth(subMonths(now, 1)).toISOString();

      const [thisMonth, lastMonth] = await Promise.all([
        supabase.from("invoices").select("total").in("status", ["sent", "paid"]).gte("created_at", thisStart).lte("created_at", thisEnd),
        supabase.from("invoices").select("total").in("status", ["sent", "paid"]).gte("created_at", lastStart).lte("created_at", lastEnd),
      ]);

      const thisTotal = (thisMonth.data || []).reduce((s, i) => s + (i.total || 0), 0);
      const lastTotal = (lastMonth.data || []).reduce((s, i) => s + (i.total || 0), 0);
      const change = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal) * 100 : 0;

      return { thisMonth: thisTotal, lastMonth: lastTotal, change };
    },
    enabled: !!dealerId,
  });
}

function useLeadFunnel() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["dashboard-funnel", dealerId],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("status");
      const counts: Record<string, number> = {};
      (data || []).forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1; });
      return [
        { stage: "New", count: counts["new"] || 0, color: "bg-primary" },
        { stage: "Contacted", count: counts["contacted"] || 0, color: "bg-blue-500" },
        { stage: "Viewing", count: counts["viewing"] || 0, color: "bg-amber-500" },
        { stage: "Negotiating", count: counts["negotiating"] || 0, color: "bg-orange-500" },
        { stage: "Won", count: counts["won"] || 0, color: "bg-emerald-500" },
        { stage: "Lost", count: counts["lost"] || 0, color: "bg-destructive" },
      ];
    },
    enabled: !!dealerId,
  });
}

function useStockAgeing() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["dashboard-stock-ageing", dealerId],
    queryFn: async () => {
      const { data } = await supabase.from("vehicles").select("created_at").eq("status", "in_stock");
      const now = new Date();
      let under30 = 0, under60 = 0, under90 = 0, over90 = 0;
      (data || []).forEach(v => {
        const days = Math.floor((now.getTime() - new Date(v.created_at).getTime()) / 86400000);
        if (days <= 30) under30++;
        else if (days <= 60) under60++;
        else if (days <= 90) under90++;
        else over90++;
      });
      return [
        { label: "0–30 days", count: under30, color: "bg-emerald-500" },
        { label: "31–60 days", count: under60, color: "bg-amber-500" },
        { label: "61–90 days", count: under90, color: "bg-orange-500" },
        { label: "90+ days", count: over90, color: "bg-destructive" },
      ];
    },
    enabled: !!dealerId,
  });
}

function useTodayTasks() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["dashboard-tasks-today", dealerId],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, priority, due_date, status")
        .lte("due_date", today)
        .in("status", ["todo", "in_progress"])
        .order("priority", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

const ACTION_LABELS: Record<string, string> = {
  cra_case_created: "CRA Shield case created",
  self_signup: "New dealer signup",
  SELF_SIGNUP: "New dealer signup",
  DEALER_CREATED: "Dealer account created",
  WELCOME_EMAIL_SENT: "Welcome email sent",
  invoice_created: "Invoice created",
  invoice_issued: "Invoice issued",
  invoice_paid: "Invoice marked paid",
  customer_created: "New customer added",
  vehicle_created: "Vehicle added to stock",
  vehicle_sold: "Vehicle sold",
  handover_created: "Handover created",
  handover_completed: "Handover completed",
  warranty_created: "Warranty created",
  lead_created: "New lead logged",
  lead_won: "Lead won",
  upgrade_approved: "Subscription upgrade approved",
  upgrade_declined: "Subscription upgrade declined",
};

const ENTITY_LABELS: Record<string, string> = {
  cra_case: "CRA Case",
  dealer: "Dealer",
  invoice: "Invoice",
  customer: "Customer",
  vehicle: "Vehicle",
  handover: "Handover",
  warranty: "Warranty",
  lead: "Lead",
  upgrade_request: "Upgrade Request",
};

function useRecentActivity() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["dashboard-recent", dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action_type, entity_type, entity_id, created_at, summary")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

function useRecentSales() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["dashboard-recent-sales", dealerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("id, invoice_number, total, invoice_date, created_at, customers:customer_id(first_name, last_name)")
        .in("status", ["sent", "paid"])
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!dealerId,
  });
}

function useComplianceHealth() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["dashboard-compliance", dealerId],
    queryFn: async () => {
      const [complaints, dsrs] = await Promise.all([
        supabase.from("complaints").select("id", { count: "exact", head: true }).in("status", ["open", "under_investigation"]),
        supabase.from("data_subject_requests").select("id", { count: "exact", head: true }).in("status", ["new", "in_review", "awaiting_id"]),
      ]);
      return {
        openComplaints: complaints.count ?? 0,
        openDSRs: dsrs.count ?? 0,
      };
    },
    enabled: !!dealerId,
  });
}

function useAnnouncements() {
  return useQuery({
    queryKey: ["dashboard-announcements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("dealer_announcements")
        .select("id, title, message, priority, created_at")
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
  });
}

function useMonthComparison() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["dashboard-mom", dealerId],
    queryFn: async () => {
      const now = new Date();
      const thisStart = startOfMonth(now).toISOString();
      const lastStart = startOfMonth(subMonths(now, 1)).toISOString();
      const lastEnd = endOfMonth(subMonths(now, 1)).toISOString();

      const [thisLeads, lastLeads, thisCustomers, lastCustomers] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", thisStart),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", lastStart).lte("created_at", lastEnd),
        supabase.from("customers").select("id", { count: "exact", head: true }).gte("created_at", thisStart),
        supabase.from("customers").select("id", { count: "exact", head: true }).gte("created_at", lastStart).lte("created_at", lastEnd),
      ]);

      return {
        leadsThis: thisLeads.count ?? 0,
        leadsLast: lastLeads.count ?? 0,
        customersThis: thisCustomers.count ?? 0,
        customersLast: lastCustomers.count ?? 0,
      };
    },
    enabled: !!dealerId,
  });
}

const priorityColors: Record<string, string> = {
  low: "text-muted-foreground", medium: "text-blue-500", high: "text-warning", urgent: "text-destructive",
};

const announcementPriority: Record<string, string> = {
  low: "border-border/50", normal: "border-primary/30 bg-primary/5", high: "border-warning/30 bg-warning/5", urgent: "border-destructive/30 bg-destructive/5",
};

function MoMIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (previous === 0) return <ArrowUpRight className="h-3 w-3 text-emerald-500" />;
  const pct = ((current - previous) / previous) * 100;
  if (pct > 0) return <span className="flex items-center gap-0.5 text-xs text-emerald-500"><ArrowUpRight className="h-3 w-3" />+{Math.round(pct)}%</span>;
  if (pct < 0) return <span className="flex items-center gap-0.5 text-xs text-destructive"><ArrowDownRight className="h-3 w-3" />{Math.round(pct)}%</span>;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();
  const { data: revenue } = useMonthlyRevenue();
  const { data: funnel } = useLeadFunnel();
  const { data: ageing } = useStockAgeing();
  const { data: todayTasks } = useTodayTasks();
  const { data: recentActivity } = useRecentActivity();
  const { data: recentSales } = useRecentSales();
  const { data: compliance } = useComplianceHealth();
  const { data: announcements } = useAnnouncements();
  const { data: mom } = useMonthComparison();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["dashboard-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const firstName = profile?.first_name || user?.user_metadata?.first_name || "";

  const cards = [
    { label: "Customers", value: stats?.customers ?? 0, icon: Users, mom: mom ? { current: mom.customersThis, previous: mom.customersLast } : null },
    { label: "Vehicles in Stock", value: stats?.vehiclesInStock ?? 0, icon: Car, mom: null },
    { label: "Open Leads", value: stats?.openLeads ?? 0, icon: Target, mom: mom ? { current: mom.leadsThis, previous: mom.leadsLast } : null },
    { label: "Invoices", value: stats?.invoices ?? 0, icon: FileText, mom: null },
    { label: "Aftersales Open", value: stats?.aftersalesOpen ?? 0, icon: Wrench, mom: null },
    { label: "Active Warranties", value: stats?.activeWarranties ?? 0, icon: Shield, mom: null },
  ];

  const quickActions = [
    { label: "New Customer", url: "/app/customers/new", icon: Users },
    { label: "New Invoice", url: "/app/invoices/new", icon: FileText },
    { label: "Log Lead", url: "/app/leads/new", icon: Target },
    { label: "New Task", url: "/app/tasks/new", icon: Plus },
  ];

  const maxFunnel = Math.max(...(funnel?.map(f => f.count) || [1]));
  const totalStock = (ageing || []).reduce((s, a) => s + a.count, 0);

  return (
    <div>
      {/* Announcements banner */}
      {announcements && announcements.length > 0 && (
        <div className="mb-6 space-y-2">
          {announcements.map(a => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 p-3 rounded-lg border ${announcementPriority[a.priority] || "border-border/50"}`}
            >
              <Megaphone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{a.message}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-auto">{format(new Date(a.created_at), "d MMM")}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Greeting + Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}, {firstName}</h1>
          <p className="text-sm text-muted-foreground">Here's your dealership at a glance</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {quickActions.map(qa => (
            <Button key={qa.label} size="sm" variant="outline" onClick={() => navigate(qa.url)} className="gap-1.5">
              <qa.icon className="h-3.5 w-3.5" />
              {qa.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Revenue card + stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Revenue card - spans 2 cols on lg */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sm:col-span-2 p-5 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <PoundSterling className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue This Month</span>
          </div>
          <p className="text-3xl font-bold">£{(revenue?.thisMonth ?? 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-2 mt-1">
            {revenue && <MoMIndicator current={revenue.thisMonth} previous={revenue.lastMonth} />}
            <span className="text-xs text-muted-foreground">vs last month (£{(revenue?.lastMonth ?? 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })})</span>
          </div>
        </motion.div>

        {cards.slice(0, 2).map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 1) * 0.04 }}
            className="p-4 rounded-xl border border-border/50 bg-card/50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              {stat.mom && <MoMIndicator current={stat.mom.current} previous={stat.mom.previous} />}
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.slice(2).map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 3) * 0.04 }}
            className="p-4 rounded-xl border border-border/50 bg-card/50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              {stat.mom && <MoMIndicator current={stat.mom.current} previous={stat.mom.previous} />}
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Lead Funnel + Stock Ageing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Lead Conversion Funnel</h3>
            <button onClick={() => navigate("/app/leads")} className="text-xs text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {funnel?.map(stage => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{stage.stage}</span>
                  <span className="text-xs font-medium">{stage.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stage.color} transition-all duration-500`}
                    style={{ width: `${maxFunnel > 0 ? (stage.count / maxFunnel) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Stock Ageing</h3>
            <span className="text-xs text-muted-foreground">{totalStock} vehicles</span>
          </div>
          <div className="space-y-3">
            {ageing?.map(bucket => (
              <div key={bucket.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{bucket.label}</span>
                  <span className="text-xs font-medium">{bucket.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${bucket.color} transition-all duration-500`}
                    style={{ width: `${totalStock > 0 ? (bucket.count / totalStock) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {(ageing?.[3]?.count ?? 0) > 0 && (
            <div className="mt-3 p-2 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {ageing![3].count} vehicle{ageing![3].count !== 1 ? "s" : ""} over 90 days — consider repricing
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales + Compliance Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 p-6 rounded-xl border border-border/50 bg-card/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Recent Sales</h3>
            <button onClick={() => navigate("/app/invoices")} className="text-xs text-primary hover:underline">View all</button>
          </div>
          {recentSales?.length ? (
            <div className="space-y-3">
              {recentSales.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/30 rounded-lg p-2 -mx-2 transition-colors" onClick={() => navigate(`/app/invoices/${inv.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <PoundSterling className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.customers ? `${inv.customers.first_name} ${inv.customers.last_name}` : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">£{(inv.total ?? 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-muted-foreground">{inv.invoice_date ? format(new Date(inv.invoice_date), "d MMM") : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">No sales yet</div>
          )}
        </div>

        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <h3 className="text-sm font-semibold mb-4">Compliance Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-warning" />
                <span className="text-sm">Open Complaints</span>
              </div>
              <span className={`text-lg font-bold ${(compliance?.openComplaints ?? 0) > 0 ? "text-warning" : "text-emerald-500"}`}>
                {compliance?.openComplaints ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm">Open DSRs</span>
              </div>
              <span className={`text-lg font-bold ${(compliance?.openDSRs ?? 0) > 0 ? "text-warning" : "text-emerald-500"}`}>
                {compliance?.openDSRs ?? 0}
              </span>
            </div>
            {(compliance?.openComplaints ?? 0) === 0 && (compliance?.openDSRs ?? 0) === 0 ? (
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-xs text-emerald-600">All clear — no outstanding items</p>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="w-full" onClick={() => navigate("/app/compliance")}>
                Review Compliance
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Activity + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
          {recentActivity?.length ? (
            <div className="relative pl-4 border-l-2 border-border/50 space-y-4">
              {recentActivity.map((log) => {
                const label = ACTION_LABELS[log.action_type] || log.action_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                const entityLabel = log.entity_type ? (ENTITY_LABELS[log.entity_type] || log.entity_type.replace(/_/g, " ")) : null;
                return (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary/20 border-2 border-primary" />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      {entityLabel && <p className="text-xs text-muted-foreground">{entityLabel}</p>}
                      <p className="text-xs text-muted-foreground">{format(new Date(log.created_at), "d MMM HH:mm")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">No recent activity yet</div>
          )}
        </div>

        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Tasks Due</h3>
            <button onClick={() => navigate("/app/tasks")} className="text-xs text-primary hover:underline">View all</button>
          </div>
          {todayTasks?.length ? (
            <div className="relative pl-4 border-l-2 border-border/50 space-y-4">
              {todayTasks.map((task) => {
                const overdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
                return (
                  <div key={task.id} className="relative">
                    <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 ${overdue ? "bg-destructive/20 border-destructive" : "bg-warning/20 border-warning"}`} />
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${priorityColors[task.priority]}`}>{task.priority}</span>
                        {task.due_date && (
                          <span className={`text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                            {overdue ? "Overdue" : "Today"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">No tasks due today</div>
          )}
        </div>
      </div>
    </div>
  );
}
