import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp, DollarSign, Users, Building2, Activity, Zap,
  ArrowUpRight, ArrowDownRight, Clock, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, subDays, subMonths, startOfDay, startOfMonth, parseISO } from "date-fns";

// ─── Data hooks ──────────────────────────────────────────────────────────────

function useAnalyticsData() {
  return useQuery({
    queryKey: ["super-admin-analytics"],
    refetchInterval: 60_000, // refresh every minute
    queryFn: async () => {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const thirtyDaysAgo = subDays(now, 30).toISOString();
      const ninetyDaysAgo = subDays(now, 90).toISOString();

      const [
        dealersResult,
        subscriptionsResult,
        plansResult,
        activityTodayResult,
        activityWeekResult,
        activityLiveResult,
        auditLogsResult,
        trialExpiringResult,
      ] = await Promise.all([
        supabase.from("dealers").select("id, name, status, created_at, trial_ends_at, plan_id").order("created_at"),
        supabase.from("dealer_subscriptions").select("*, plans(name, monthly_price)"),
        supabase.from("plans").select("*").order("monthly_price"),
        // Today's activity
        supabase.from("audit_logs").select("id, action_type, created_at, dealer_id", { count: "exact" }).gte("created_at", todayStart),
        // Last 7 days activity by day
        supabase.from("audit_logs").select("created_at").gte("created_at", subDays(now, 6).toISOString()),
        // "Live" = activity in last 15 minutes
        supabase.from("audit_logs").select("dealer_id", { count: "exact" }).gte("created_at", subDays(now, 0.01).toISOString()),
        // 90 days of audit logs for activity chart
        supabase.from("audit_logs").select("created_at").gte("created_at", ninetyDaysAgo).order("created_at"),
        // Trials expiring in next 7 days
        supabase.from("dealers")
          .select("id, name, trial_ends_at")
          .eq("status", "trial")
          .gte("trial_ends_at", now.toISOString())
          .lte("trial_ends_at", subDays(now, -7).toISOString()),
      ]);

      const dealers = dealersResult.data || [];
      const subscriptions = subscriptionsResult.data || [];
      const plans = plansResult.data || [];

      // ── Subscription revenue breakdown ───────────────────────────────────
      const activeSubs = subscriptions.filter((s: any) => s.status === "active");
      // Trial count sourced from dealers table (status field), not dealer_subscriptions
      const trialDealerCount = dealers.filter((d: any) => d.status === "trial").length;

      // MRR based on active dealers and their assigned plan price
      const activeDealersList = dealers.filter((d: any) => d.status === "active");
      const plansMap: Record<string, any> = {};
      plans.forEach((p: any) => { plansMap[p.id] = p; });

      const mrr = activeDealersList.reduce((sum: number, d: any) => {
        const plan = d.plan_id ? plansMap[d.plan_id] : null;
        return sum + (plan?.monthly_price || 0);
      }, 0);
      const arr = mrr * 12;

      // Revenue by plan — count active dealers per plan
      const revenueByPlan = plans.map((p: any) => {
        const count = activeDealersList.filter((d: any) => d.plan_id === p.id).length;
        return { name: p.name, revenue: count * p.monthly_price, dealers: count, price: p.monthly_price };
      }).filter((p: any) => p.dealers > 0 || true);

      // ── Dealer growth over 12 months ─────────────────────────────────────
      const monthlyGrowth: Record<string, { month: string; new_dealers: number; cumulative: number }> = {};
      let cumulative = 0;

      for (let i = 11; i >= 0; i--) {
        const m = subMonths(now, i);
        const key = format(m, "MMM yy");
        monthlyGrowth[key] = { month: key, new_dealers: 0, cumulative: 0 };
      }

      dealers.forEach((d: any) => {
        const key = format(parseISO(d.created_at), "MMM yy");
        if (monthlyGrowth[key]) monthlyGrowth[key].new_dealers++;
      });

      const growthData = Object.values(monthlyGrowth).map((m) => {
        cumulative += m.new_dealers;
        return { ...m, cumulative };
      });

      // ── Status breakdown ─────────────────────────────────────────────────
      const statusBreakdown = [
        { name: "Active", value: dealers.filter((d: any) => d.status === "active").length, color: "hsl(var(--success))" },
        { name: "Trial", value: dealers.filter((d: any) => d.status === "trial").length, color: "hsl(var(--primary))" },
        { name: "Pending", value: dealers.filter((d: any) => d.status === "pending").length, color: "hsl(var(--warning))" },
        { name: "Suspended", value: dealers.filter((d: any) => d.status === "suspended").length, color: "hsl(var(--destructive))" },
      ].filter((s) => s.value > 0);

      // ── Activity last 7 days ─────────────────────────────────────────────
      const last7: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const key = format(subDays(now, i), "EEE");
        last7[key] = 0;
      }
      (activityWeekResult.data || []).forEach((log: any) => {
        const key = format(parseISO(log.created_at), "EEE");
        if (last7[key] !== undefined) last7[key]++;
      });
      const activityByDay = Object.entries(last7).map(([day, actions]) => ({ day, actions }));

      // ── Today & live ─────────────────────────────────────────────────────
      const todayActions = activityTodayResult.count || 0;
      const todayLogs = activityTodayResult.data || [];
      const activeDeralersToday = new Set(todayLogs.map((l: any) => l.dealer_id).filter(Boolean)).size;

      // "Live" = unique dealers active in last 15 min
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: liveLogs } = await supabase
        .from("audit_logs")
        .select("dealer_id")
        .gte("created_at", fifteenMinAgo);
      const liveCount = new Set((liveLogs || []).map((l: any) => l.dealer_id).filter(Boolean)).size;

      return {
        mrr, arr,
        totalDealers: dealers.length,
        activeDealers: dealers.filter((d: any) => d.status === "active").length,
        trialDealers: trialDealerCount,
        todayActions,
        activeDeralersToday,
        liveCount,
        revenueByPlan,
        growthData,
        statusBreakdown,
        activityByDay,
        trialsExpiringSoon: trialExpiringResult.data || [],
      };
    },
  });
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, trend, live }: {
  label: string; value: string | number; sub?: string;
  icon: any; trend?: "up" | "down" | null; live?: boolean;
}) {
  return (
    <div className="p-5 rounded-xl border border-border/50 bg-card/50">
      <div className="flex items-start justify-between mb-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        {live && (
          <span className="flex items-center gap-1.5 text-xs text-success">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            Live
          </span>
        )}
        {trend === "up" && <ArrowUpRight className="h-4 w-4 text-success" />}
        {trend === "down" && <ArrowDownRight className="h-4 w-4 text-destructive" />}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, prefix = "", suffix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: {prefix}{p.value}{suffix}
        </p>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SuperAdminAnalytics() {
  const { data, isLoading } = useAnalyticsData();

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (percent < 0.08) return null;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {name}
      </text>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted/30 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 rounded-xl bg-muted/30 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Platform health, revenue & live activity</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full">
          <Clock className="h-3 w-3" />
          Auto-refreshes every 60s
        </div>
      </div>

      {/* Live + Revenue KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Monthly Recurring Revenue" value={`£${(data?.mrr || 0).toLocaleString()}`} sub={`ARR: £${(data?.arr || 0).toLocaleString()}`} icon={DollarSign} trend="up" />
        <StatCard label="Active Paying Dealers" value={data?.activeDealers ?? 0} sub={`${data?.trialDealers ?? 0} on trial`} icon={Building2} />
        <StatCard label="Dealers Active Today" value={data?.activeDeralersToday ?? 0} sub="Unique dealerships" icon={Activity} trend={null} />
        <StatCard label="Live Now" value={data?.liveCount ?? 0} sub="Active in last 15 min" icon={Zap} live />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Platform Dealers" value={data?.totalDealers ?? 0} icon={Building2} />
        <StatCard label="Today's User Actions" value={data?.todayActions ?? 0} sub="All audit events" icon={BarChart3} />
        <StatCard label="Annual Run Rate" value={`£${(data?.arr || 0).toLocaleString()}`} sub="Based on active subscriptions" icon={TrendingUp} />
        <StatCard label="Trials Expiring (7d)" value={data?.trialsExpiringSoon?.length ?? 0} sub="Need follow-up" icon={Clock} trend={data?.trialsExpiringSoon?.length ? "down" : null} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dealer growth */}
        <div className="p-5 rounded-xl border border-border/50 bg-card/50">
          <h3 className="text-sm font-semibold mb-1">Dealer Growth</h3>
          <p className="text-xs text-muted-foreground mb-4">Cumulative vs. new dealers per month</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.growthData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="cumulative" name="Total" stroke="hsl(var(--primary))" fill="url(#cumGrad)" strokeWidth={2} dot={false} />
              <Bar dataKey="new_dealers" name="New" fill="hsl(var(--primary))" opacity={0.6} radius={[3, 3, 0, 0]} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily activity */}
        <div className="p-5 rounded-xl border border-border/50 bg-card/50">
          <h3 className="text-sm font-semibold mb-1">Platform Activity</h3>
          <p className="text-xs text-muted-foreground mb-4">User actions across all dealerships (last 7 days)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.activityByDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip suffix=" actions" />} />
              <Bar dataKey="actions" name="Actions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by plan */}
        <div className="p-5 rounded-xl border border-border/50 bg-card/50">
          <h3 className="text-sm font-semibold mb-1">Subscription Revenue by Plan</h3>
          <p className="text-xs text-muted-foreground mb-4">Monthly revenue contribution per plan</p>
          {data?.revenueByPlan?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.revenueByPlan} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip prefix="£" />} />
                <Bar dataKey="revenue" name="Revenue (£/mo)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No subscription data yet</div>
          )}
        </div>

        {/* Dealer status donut */}
        <div className="p-5 rounded-xl border border-border/50 bg-card/50">
          <h3 className="text-sm font-semibold mb-1">Dealer Status Mix</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribution across all dealerships</p>
          {data?.statusBreakdown?.length ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={data.statusBreakdown}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {data.statusBreakdown.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip suffix=" dealers" />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {data.statusBreakdown.map((s: any) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-xs">{s.name}</span>
                    <span className="text-xs font-semibold ml-auto pl-4">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No data</div>
          )}
        </div>
      </div>

      {/* Trials expiring soon */}
      {(data?.trialsExpiringSoon?.length ?? 0) > 0 && (
        <div className="p-5 rounded-xl border border-warning/30 bg-warning/5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-semibold text-warning">Trials Expiring in 7 Days</h3>
          </div>
          <div className="space-y-2">
            {data!.trialsExpiringSoon.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <span>{d.name}</span>
                <span className="text-xs text-warning font-medium">
                  Expires {format(parseISO(d.trial_ends_at), "d MMM yyyy")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
