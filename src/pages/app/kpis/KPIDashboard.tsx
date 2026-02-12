import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserDealerId } from "@/hooks/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, CheckCircle2, Clock, AlertCircle, FileText, Target } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subDays, format } from "date-fns";
import { useNavigate } from "react-router-dom";

type DateRange = "7" | "30" | "90" | "365";

function useKPIData(dateRange: DateRange) {
  const { data: dealerId } = useUserDealerId();
  const startDate = subDays(new Date(), parseInt(dateRange)).toISOString();

  return useQuery({
    queryKey: ["kpi-data", dealerId, dateRange],
    queryFn: async () => {
      if (!dealerId) return null;

      // Get team members
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("dealer_id", dealerId)
        .eq("is_active", true);

      if (!profiles?.length) return { members: [] };

      // Get tasks in range
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, assigned_to, status, due_date, completed_at, created_at")
        .gte("created_at", startDate);

      // Get aftersales cases in range
      const { data: cases } = await supabase
        .from("aftersales_cases")
        .select("id, assigned_to_user_id, status, created_at, first_response_at, resolved_at, complaint_date")
        .gte("created_at", startDate);

      // Get invoices in range
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, created_by_user_id, status, total, balance_due, issued_at, created_at")
        .gte("created_at", startDate);

      // Get vehicle checks in range
      const { data: checks } = await supabase
        .from("vehicle_checks")
        .select("id, created_by_user_id, status, created_at")
        .gte("created_at", startDate);

      const memberStats = profiles.map((p) => {
        const memberTasks = tasks?.filter((t) => t.assigned_to === p.id) || [];
        const tasksCompleted = memberTasks.filter((t) => t.status === "done").length;
        const tasksOverdue = memberTasks.filter(
          (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done"
        ).length;
        const completedWithDue = memberTasks.filter((t) => t.status === "done" && t.due_date && t.completed_at);
        const onTime = completedWithDue.filter((t) => new Date(t.completed_at!) <= new Date(t.due_date!)).length;
        const onTimeRate = completedWithDue.length > 0 ? Math.round((onTime / completedWithDue.length) * 100) : null;

        const memberCases = cases?.filter((c) => c.assigned_to_user_id === p.id) || [];
        const casesResolved = memberCases.filter((c) => ["resolved", "closed"].includes(c.status)).length;
        const casesOpen = memberCases.filter((c) => !["resolved", "closed"].includes(c.status)).length;
        const withResponse = memberCases.filter((c) => c.first_response_at);
        const avgResponseMs = withResponse.length > 0
          ? withResponse.reduce((sum, c) => sum + (new Date(c.first_response_at!).getTime() - new Date(c.created_at).getTime()), 0) / withResponse.length
          : null;
        const avgResponseHours = avgResponseMs ? Math.round(avgResponseMs / 3600000) : null;

        const memberInvoices = invoices?.filter((i) => i.created_by_user_id === p.id) || [];
        const invoicesIssued = memberInvoices.filter((i) => i.status === "sent" || i.status === "paid").length;
        const salesValue = memberInvoices
          .filter((i) => i.status === "sent" || i.status === "paid")
          .reduce((sum, i) => sum + (i.total || 0), 0);
        const outstanding = memberInvoices
          .filter((i) => i.status === "sent" && (i.balance_due || 0) > 0)
          .reduce((sum, i) => sum + (i.balance_due || 0), 0);

        const memberChecks = checks?.filter((c) => c.created_by_user_id === p.id) || [];
        const checksRun = memberChecks.length;

        return {
          id: p.id,
          name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed",
          tasksAssigned: memberTasks.length,
          tasksCompleted,
          tasksOverdue,
          onTimeRate,
          casesAssigned: memberCases.length,
          casesResolved,
          casesOpen,
          avgResponseHours,
          invoicesCreated: memberInvoices.length,
          invoicesIssued,
          salesValue,
          outstanding,
          checksRun,
        };
      });

      return { members: memberStats };
    },
    enabled: !!dealerId,
  });
}

export default function KPIDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const { data, isLoading } = useKPIData(dateRange);
  const navigate = useNavigate();

  // Totals row
  const totals = useMemo(() => {
    if (!data?.members?.length) return null;
    return {
      tasksCompleted: data.members.reduce((s, m) => s + m.tasksCompleted, 0),
      tasksOverdue: data.members.reduce((s, m) => s + m.tasksOverdue, 0),
      casesOpen: data.members.reduce((s, m) => s + m.casesOpen, 0),
      casesResolved: data.members.reduce((s, m) => s + m.casesResolved, 0),
      invoicesIssued: data.members.reduce((s, m) => s + m.invoicesIssued, 0),
      salesValue: data.members.reduce((s, m) => s + m.salesValue, 0),
      checksRun: data.members.reduce((s, m) => s + m.checksRun, 0),
    };
  }, [data]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Staff KPIs</h1>
          <p className="text-sm text-muted-foreground">Performance metrics by team member</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary tiles */}
      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {[
            { label: "Tasks Done", value: totals.tasksCompleted, icon: CheckCircle2 },
            { label: "Overdue", value: totals.tasksOverdue, icon: AlertCircle },
            { label: "Open Cases", value: totals.casesOpen, icon: Clock },
            { label: "Resolved", value: totals.casesResolved, icon: CheckCircle2 },
            { label: "Invoices", value: totals.invoicesIssued, icon: FileText },
            { label: "Sales Value", value: `£${(totals.salesValue / 1000).toFixed(0)}k`, icon: Target },
            { label: "Checks", value: totals.checksRun, icon: BarChart3 },
          ].map((t) => (
            <div key={t.label} className="p-3 rounded-xl border border-border/50 bg-card/50">
              <t.icon className="h-4 w-4 text-primary mb-2" />
              <p className="text-lg font-bold">{t.value}</p>
              <p className="text-[10px] text-muted-foreground">{t.label}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />)}</div>
      ) : !data?.members?.length ? (
        <div className="text-center py-20 rounded-xl border border-border/50 bg-card/50">
          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No team data available</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/50 overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Staff</th>
                <th className="text-center text-xs font-medium text-muted-foreground p-3">Tasks Done</th>
                <th className="text-center text-xs font-medium text-muted-foreground p-3">Overdue</th>
                <th className="text-center text-xs font-medium text-muted-foreground p-3">On-time %</th>
                <th className="text-center text-xs font-medium text-muted-foreground p-3">Open Cases</th>
                <th className="text-center text-xs font-medium text-muted-foreground p-3">Resolved</th>
                <th className="text-center text-xs font-medium text-muted-foreground p-3">Avg Response</th>
                <th className="text-center text-xs font-medium text-muted-foreground p-3">Invoices</th>
                <th className="text-right text-xs font-medium text-muted-foreground p-3">Sales Value</th>
                <th className="text-center text-xs font-medium text-muted-foreground p-3">Checks</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/app/kpis/${m.id}`)}
                >
                  <td className="p-3 text-sm font-medium">{m.name}</td>
                  <td className="p-3 text-sm text-center">{m.tasksCompleted}</td>
                  <td className="p-3 text-sm text-center">
                    <span className={m.tasksOverdue > 0 ? "text-destructive font-medium" : ""}>{m.tasksOverdue}</span>
                  </td>
                  <td className="p-3 text-sm text-center">{m.onTimeRate !== null ? `${m.onTimeRate}%` : "—"}</td>
                  <td className="p-3 text-sm text-center">
                    <span className={m.casesOpen > 0 ? "text-warning font-medium" : ""}>{m.casesOpen}</span>
                  </td>
                  <td className="p-3 text-sm text-center">{m.casesResolved}</td>
                  <td className="p-3 text-sm text-center">{m.avgResponseHours !== null ? `${m.avgResponseHours}h` : "—"}</td>
                  <td className="p-3 text-sm text-center">{m.invoicesIssued}</td>
                  <td className="p-3 text-sm text-right font-medium">£{m.salesValue.toLocaleString()}</td>
                  <td className="p-3 text-sm text-center">{m.checksRun}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
