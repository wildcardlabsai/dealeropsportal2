import { useAuth } from "@/contexts/AuthContext";
import StaffKPIProfile from "./StaffKPIProfile";

// Renders the same StaffKPIProfile but using the current user's ID
export default function MyKPIs() {
  const { user } = useAuth();
  // We'll render the StaffKPIProfile component but override the id
  return <StaffKPIProfileSelf />;
}

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserDealerId } from "@/hooks/useCustomers";
import { CheckCircle2, Clock, AlertCircle, FileText, Target, BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subDays, format } from "date-fns";
import { useNavigate } from "react-router-dom";

type DateRange = "7" | "30" | "90" | "365";

function StaffKPIProfileSelf() {
  const { user } = useAuth();
  const { data: dealerId } = useUserDealerId();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const startDate = subDays(new Date(), parseInt(dateRange)).toISOString();
  const id = user?.id;

  const { data: kpi, isLoading } = useQuery({
    queryKey: ["my-kpi", id, dateRange, dealerId],
    queryFn: async () => {
      if (!id || !dealerId) return null;

      const [tasksRes, casesRes, invoicesRes, checksRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("assigned_to", id).gte("created_at", startDate),
        supabase.from("aftersales_cases").select("*").eq("assigned_to_user_id", id).gte("created_at", startDate),
        supabase.from("invoices").select("*").eq("created_by_user_id", id).gte("created_at", startDate),
        supabase.from("vehicle_checks").select("*").eq("created_by_user_id", id).gte("created_at", startDate),
      ]);

      const tasks = tasksRes.data || [];
      const cases = casesRes.data || [];
      const invoices = invoicesRes.data || [];
      const checks = checksRes.data || [];

      const tasksCompleted = tasks.filter((t) => t.status === "done");
      const tasksOverdue = tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done");
      const openTasks = tasks.filter((t) => t.status !== "done");
      const openCases = cases.filter((c) => !["resolved", "closed"].includes(c.status));
      const casesResolved = cases.filter((c) => ["resolved", "closed"].includes(c.status));
      const issuedInvoices = invoices.filter((i) => i.status === "sent" || i.status === "paid");
      const salesValue = issuedInvoices.reduce((s, i) => s + (i.total || 0), 0);

      return {
        tasksAssigned: tasks.length,
        tasksCompleted: tasksCompleted.length,
        tasksOverdue: tasksOverdue.length,
        openTasks,
        casesAssigned: cases.length,
        casesResolved: casesResolved.length,
        openCases,
        invoicesIssued: issuedInvoices.length,
        salesValue,
        checksRun: checks.length,
      };
    },
    enabled: !!id && !!dealerId,
  });

  const exportCSV = () => {
    if (!kpi) return;
    const rows = [
      ["Metric", "Value"],
      ["Tasks Assigned", kpi.tasksAssigned],
      ["Tasks Completed", kpi.tasksCompleted],
      ["Tasks Overdue", kpi.tasksOverdue],
      ["Cases Resolved", kpi.casesResolved],
      ["Invoices Issued", kpi.invoicesIssued],
      ["Sales Value", kpi.salesValue],
      ["Checks Run", kpi.checksRun],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-kpis-${dateRange}d.csv`;
    a.click();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My KPIs</h1>
          <p className="text-sm text-muted-foreground">Your personal performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!kpi}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted/30 animate-pulse" />)}
        </div>
      ) : kpi ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Tasks Completed", value: kpi.tasksCompleted, icon: CheckCircle2, color: "text-primary" },
              { label: "Tasks Overdue", value: kpi.tasksOverdue, icon: AlertCircle, color: kpi.tasksOverdue > 0 ? "text-destructive" : "text-muted-foreground" },
              { label: "Cases Resolved", value: kpi.casesResolved, icon: CheckCircle2, color: "text-primary" },
              { label: "Open Cases", value: kpi.openCases.length, icon: Clock, color: kpi.openCases.length > 0 ? "text-warning" : "text-muted-foreground" },
              { label: "Invoices Issued", value: kpi.invoicesIssued, icon: FileText, color: "text-primary" },
              { label: "Sales Value", value: `£${kpi.salesValue.toLocaleString()}`, icon: Target, color: "text-primary" },
              { label: "Checks Run", value: kpi.checksRun, icon: BarChart3, color: "text-primary" },
              { label: "Tasks Assigned", value: kpi.tasksAssigned, icon: Clock, color: "text-muted-foreground" },
            ].map((t) => (
              <div key={t.label} className="p-4 rounded-xl border border-border/50 bg-card/50">
                <t.icon className={`h-4 w-4 ${t.color} mb-2`} />
                <p className="text-xl font-bold">{t.value}</p>
                <p className="text-xs text-muted-foreground">{t.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-border/50 bg-card/50">
              <h3 className="text-sm font-semibold mb-4">Open Tasks ({kpi.openTasks.length})</h3>
              {kpi.openTasks.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {kpi.openTasks.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                      <span className="truncate">{t.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{t.priority}</span>
                        {t.due_date && (
                          <span className={`text-xs ${new Date(t.due_date) < new Date() ? "text-destructive" : "text-muted-foreground"}`}>
                            {format(new Date(t.due_date), "d MMM")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No open tasks</p>
              )}
            </div>

            <div className="p-6 rounded-xl border border-border/50 bg-card/50">
              <h3 className="text-sm font-semibold mb-4">Open Cases ({kpi.openCases.length})</h3>
              {kpi.openCases.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {kpi.openCases.map((c: any) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/app/aftersales/${c.id}`)}
                    >
                      <span className="truncate">{c.case_number} · {c.summary}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{c.priority}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No open cases</p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </motion.div>
  );
}
