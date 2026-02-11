import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserDealerId } from "@/hooks/useCustomers";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function useReportsData() {
  const { data: dealerId } = useUserDealerId();

  return useQuery({
    queryKey: ["reports-data", dealerId],
    queryFn: async () => {
      // Fetch last 6 months of data
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(new Date(), 5 - i);
        return { start: startOfMonth(d).toISOString(), end: endOfMonth(d).toISOString(), label: format(d, "MMM") };
      });

      // Vehicle status breakdown
      const { data: vehicles } = await supabase.from("vehicles").select("status").eq("is_deleted", false);
      const statusCounts: Record<string, number> = {};
      vehicles?.forEach((v) => { statusCounts[v.status] = (statusCounts[v.status] || 0) + 1; });
      const vehicleStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

      // Lead sources
      const { data: leads } = await supabase.from("leads").select("source");
      const sourceCounts: Record<string, number> = {};
      leads?.forEach((l) => { sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1; });
      const leadSourceData = Object.entries(sourceCounts).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

      // Lead status funnel
      const { data: allLeads } = await supabase.from("leads").select("status");
      const funnelCounts: Record<string, number> = {};
      allLeads?.forEach((l) => { funnelCounts[l.status] = (funnelCounts[l.status] || 0) + 1; });
      const funnelOrder = ["new", "contacted", "viewing", "negotiating", "won", "lost"];
      const leadFunnelData = funnelOrder.map((s) => ({ name: s, count: funnelCounts[s] || 0 }));

      // Monthly sales (vehicles sold)
      const monthlySales = await Promise.all(
        months.map(async (m) => {
          const { count } = await supabase
            .from("vehicles")
            .select("id", { count: "exact", head: true })
            .eq("status", "sold")
            .gte("updated_at", m.start)
            .lte("updated_at", m.end);
          return { month: m.label, sold: count ?? 0 };
        })
      );

      // Monthly invoices
      const monthlyRevenue = await Promise.all(
        months.map(async (m) => {
          const { data: invoices } = await supabase
            .from("invoices")
            .select("total")
            .gte("created_at", m.start)
            .lte("created_at", m.end);
          const total = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) ?? 0;
          return { month: m.label, revenue: Math.round(total) };
        })
      );

      return { vehicleStatusData, leadSourceData, leadFunnelData, monthlySales, monthlyRevenue };
    },
    enabled: !!dealerId,
  });
}

export default function ReportsPage() {
  const { data, isLoading } = useReportsData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Reports & KPIs</h1>
          <p className="text-sm text-muted-foreground">Performance metrics across your dealership</p>
        </div>
        {[...Array(4)].map((_, i) => <div key={i} className="h-64 rounded-xl bg-muted/30 animate-pulse" />)}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reports & KPIs</h1>
        <p className="text-sm text-muted-foreground">Performance metrics across your dealership</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <h3 className="text-sm font-semibold mb-4">Monthly Vehicle Sales</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="sold" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <h3 className="text-sm font-semibold mb-4">Monthly Invoice Revenue</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data?.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(value: number) => [`£${value.toLocaleString()}`, "Revenue"]}
              />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Status Breakdown */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <h3 className="text-sm font-semibold mb-4">Stock Status Breakdown</h3>
          {data?.vehicleStatusData?.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.vehicleStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                  {data.vehicleStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-sm text-muted-foreground">No vehicle data</div>
          )}
        </div>

        {/* Lead Funnel */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <h3 className="text-sm font-semibold mb-4">Lead Pipeline</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.leadFunnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={90} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Sources */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Lead Sources</h3>
          {data?.leadSourceData?.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.leadSourceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-sm text-muted-foreground">No lead data</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
