import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, Filter, LayoutList, Columns3, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAftersalesCases, AftersalesCase } from "@/hooks/useAftersalesCases";
import { format, differenceInHours } from "date-fns";

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  investigating: { label: "Investigating", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  awaiting_customer: { label: "Awaiting Customer", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  awaiting_garage: { label: "Awaiting Garage", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  approved_repair: { label: "Approved Repair", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  in_repair: { label: "In Repair", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  resolved: { label: "Resolved", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground border-border" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "text-muted-foreground" },
  medium: { label: "Medium", color: "text-amber-400" },
  high: { label: "High", color: "text-orange-400" },
  urgent: { label: "Urgent", color: "text-red-400" },
};

function SLAIndicator({ cas }: { cas: AftersalesCase }) {
  if (cas.first_response_at || cas.status === "closed" || cas.status === "resolved") return null;
  const hours = differenceInHours(new Date(), new Date(cas.created_at));
  const remaining = cas.sla_target_hours - hours;
  if (remaining <= 0) {
    return <span className="flex items-center gap-1 text-[10px] text-red-400"><AlertTriangle className="h-3 w-3" /> SLA breached</span>;
  }
  if (remaining <= 12) {
    return <span className="flex items-center gap-1 text-[10px] text-amber-400"><Clock className="h-3 w-3" /> {remaining}h left</span>;
  }
  return null;
}

function CaseTable({ cases }: { cases: AftersalesCase[] }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Case #</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Summary</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Customer</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Vehicle</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Priority</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">SLA</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Created</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr
                key={c.id}
                onClick={() => navigate(`/app/aftersales/${c.id}`)}
                className="border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <td className="p-3 text-xs font-mono text-primary">{c.case_number}</td>
                <td className="p-3 text-sm font-medium max-w-[300px] truncate">{c.summary}</td>
                <td className="p-3 hidden lg:table-cell text-sm text-muted-foreground">
                  {c.customers ? `${c.customers.first_name} ${c.customers.last_name}` : "—"}
                </td>
                <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                  {c.vehicles ? `${c.vehicles.vrm || ""} ${c.vehicles.make || ""} ${c.vehicles.model || ""}`.trim() : "—"}
                </td>
                <td className="p-3 hidden md:table-cell">
                  <span className={`text-xs font-medium ${priorityConfig[c.priority]?.color || ""}`}>
                    {priorityConfig[c.priority]?.label || c.priority}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusConfig[c.status]?.color || ""}`}>
                    {statusConfig[c.status]?.label || c.status}
                  </span>
                </td>
                <td className="p-3 hidden md:table-cell"><SLAIndicator cas={c} /></td>
                <td className="p-3 hidden md:table-cell text-xs text-muted-foreground">
                  {format(new Date(c.created_at), "d MMM yyyy")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KanbanBoard({ cases }: { cases: AftersalesCase[] }) {
  const navigate = useNavigate();
  const columns = ["new", "investigating", "awaiting_customer", "awaiting_garage", "approved_repair", "in_repair", "resolved"];

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {columns.map((status) => {
        const items = cases.filter((c) => c.status === status);
        const config = statusConfig[status];
        return (
          <div key={status} className="min-w-[260px] flex-shrink-0">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className={`text-xs font-semibold ${config?.color?.split(" ")[1] || "text-muted-foreground"}`}>
                {config?.label || status}
              </span>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/app/aftersales/${c.id}`)}
                  className="p-3 rounded-lg border border-border/50 bg-card/80 hover:bg-card transition-colors cursor-pointer"
                >
                  <p className="text-[10px] font-mono text-primary mb-1">{c.case_number}</p>
                  <p className="text-sm font-medium mb-1 line-clamp-2">{c.summary}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{c.issue_category}</span>
                    <span className={`text-[10px] font-medium ${priorityConfig[c.priority]?.color || ""}`}>
                      {priorityConfig[c.priority]?.label || c.priority}
                    </span>
                  </div>
                  <SLAIndicator cas={c} />
                </div>
              ))}
              {items.length === 0 && (
                <div className="p-4 rounded-lg border border-dashed border-border/30 text-center text-xs text-muted-foreground">
                  No cases
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AftersalesModule() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"list" | "board">("list");
  const { data: cases, isLoading } = useAftersalesCases(search, statusFilter);
  const navigate = useNavigate();

  // Stats
  const openCount = cases?.filter((c) => !["closed", "resolved", "rejected"].includes(c.status)).length ?? 0;
  const breachedCount = cases?.filter((c) => {
    if (c.first_response_at || c.status === "closed" || c.status === "resolved") return false;
    return differenceInHours(new Date(), new Date(c.created_at)) > c.sla_target_hours;
  }).length ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Aftersales</h1>
          <p className="text-sm text-muted-foreground">
            {openCount} open · {breachedCount > 0 && <span className="text-red-400">{breachedCount} SLA breached</span>}
            {breachedCount === 0 && <span>{cases?.length ?? 0} total</span>}
          </p>
        </div>
        <Button onClick={() => navigate("/app/aftersales/new")} className="glow">
          <Plus className="h-4 w-4 mr-2" /> New Case
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search cases..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex border border-border/50 rounded-md overflow-hidden">
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
            className="rounded-none"
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "board" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("board")}
            className="rounded-none"
          >
            <Columns3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}
        </div>
      ) : !cases?.length ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border/50 bg-card/50">
          <p className="text-muted-foreground mb-4">No aftersales cases yet</p>
          <Button onClick={() => navigate("/app/aftersales/new")}>
            <Plus className="h-4 w-4 mr-2" /> Create your first case
          </Button>
        </div>
      ) : view === "list" ? (
        <CaseTable cases={cases} />
      ) : (
        <KanbanBoard cases={cases} />
      )}
    </motion.div>
  );
}
