import { motion } from "framer-motion";
import {
  Users, Car, FileText, Wrench, Target, Shield, Clock, CheckCircle2, AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserDealerId } from "@/hooks/useCustomers";
import { format, isToday, isPast } from "date-fns";
import { useNavigate } from "react-router-dom";

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
        supabase.from("aftersales").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress", "awaiting_parts"]),
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

function useRecentActivity() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["dashboard-recent", dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action_type, entity_type, entity_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

const priorityColors: Record<string, string> = {
  low: "text-muted-foreground", medium: "text-blue-500", high: "text-warning", urgent: "text-destructive",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();
  const { data: todayTasks } = useTodayTasks();
  const { data: recentActivity } = useRecentActivity();
  const navigate = useNavigate();

  const cards = [
    { label: "Customers", value: stats?.customers ?? 0, icon: Users },
    { label: "Vehicles in Stock", value: stats?.vehiclesInStock ?? 0, icon: Car },
    { label: "Open Leads", value: stats?.openLeads ?? 0, icon: Target },
    { label: "Invoices", value: stats?.invoices ?? 0, icon: FileText },
    { label: "Aftersales Open", value: stats?.aftersalesOpen ?? 0, icon: Wrench },
    { label: "Active Warranties", value: stats?.activeWarranties ?? 0, icon: Shield },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back{user?.email ? `, ${user.email}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="p-4 rounded-xl border border-border/50 bg-card/50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
          {recentActivity?.length ? (
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-medium text-primary">{log.action_type}</span>
                      {log.entity_type && <span className="text-muted-foreground"> · {log.entity_type}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{format(new Date(log.created_at), "d MMM HH:mm")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No recent activity yet
            </div>
          )}
        </div>

        {/* Tasks Due */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Tasks Due</h3>
            <button onClick={() => navigate("/app/tasks")} className="text-xs text-primary hover:underline">View all</button>
          </div>
          {todayTasks?.length ? (
            <div className="space-y-3">
              {todayTasks.map((task) => {
                const overdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
                return (
                  <div key={task.id} className="flex items-start gap-3 text-sm">
                    {overdue ? (
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
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
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No tasks due today
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
