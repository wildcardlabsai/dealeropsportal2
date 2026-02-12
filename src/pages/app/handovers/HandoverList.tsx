import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, Download, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHandovers, useHandoverStats, HANDOVER_STATUS_LABELS } from "@/hooks/useHandovers";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  awaiting_signature: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function HandoverList() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: handovers, isLoading } = useHandovers(statusFilter);
  const { data: stats } = useHandoverStats();
  const navigate = useNavigate();

  const exportCSV = () => {
    if (!handovers?.length) return;
    const headers = ["Handover #", "Customer", "Vehicle", "Status", "Delivery", "Date"];
    const rows = handovers.map((h: any) => [
      h.handover_number || "", `${h.customers?.first_name || ""} ${h.customers?.last_name || ""}`,
      h.vehicles ? `${h.vehicles.vrm} ${h.vehicles.make} ${h.vehicles.model}` : "",
      h.status, h.delivery_type, format(new Date(h.created_at), "yyyy-MM-dd"),
    ]);
    const csv = [headers, ...rows].map(r => r.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `handovers-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Today", value: stats?.today ?? 0 },
          { label: "In Progress", value: stats?.inProgress ?? 0 },
          { label: "Awaiting Signature", value: stats?.awaitingSignature ?? 0 },
          { label: "Completed (7d)", value: stats?.completedLast7 ?? 0 },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-border/50 bg-card/50">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Handover Packs</h1>
          <p className="text-sm text-muted-foreground">{handovers?.length ?? 0} handovers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />CSV</Button>
          <Button onClick={() => navigate("/app/handovers/new")}><Plus className="h-4 w-4 mr-2" />New Handover</Button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(HANDOVER_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}</div>
      ) : !handovers?.length ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border/50 bg-card/50">
          <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No handovers yet</p>
          <Button onClick={() => navigate("/app/handovers/new")}><Plus className="h-4 w-4 mr-2" />Create your first handover</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Handover #</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Customer</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Vehicle</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Delivery</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Scheduled</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {handovers.map((h: any) => (
                  <tr key={h.id} onClick={() => navigate(`/app/handovers/${h.id}`)}
                    className="border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors">
                    <td className="p-3 text-sm font-mono text-muted-foreground">{h.handover_number}</td>
                    <td className="p-3 text-sm font-medium">{h.customers?.first_name} {h.customers?.last_name}</td>
                    <td className="p-3 text-xs text-muted-foreground hidden md:table-cell">
                      {h.vehicles ? `${h.vehicles.vrm} – ${h.vehicles.make} ${h.vehicles.model}` : "—"}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[h.status] || ""}`}>
                        {HANDOVER_STATUS_LABELS[h.status] || h.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell capitalize">{h.delivery_type}</td>
                    <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell">
                      {h.scheduled_delivery_at ? format(new Date(h.scheduled_delivery_at), "d MMM yyyy HH:mm") : "—"}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{format(new Date(h.created_at), "d MMM yy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
