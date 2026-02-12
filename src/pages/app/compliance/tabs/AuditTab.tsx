import { useState } from "react";
import { Search, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuditLogs, useAuditLogActorNames, AuditLogFilters } from "@/hooks/useAuditLogs";
import { format } from "date-fns";

const ACTION_TYPES = [
  "consent_recorded", "consent_withdrawn", "dsr_created", "dsr_status_changed", "dsr_identity_verified",
  "retention_settings_updated", "retention_approved", "retention_skipped",
  "complaint_created", "complaint_resolved", "complaint_status_changed",
  "compliance_doc_updated", "incident_created", "incident_closed",
  "cra_case_created", "cra_status_changed", "cra_note_added", "cra_case_resolved",
];

export default function AuditTab() {
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 0, pageSize: 50, search: "", actionType: "all" });
  const { data, isLoading } = useAuditLogs(filters);
  const actorIds = data?.logs?.map((l) => l.actor_user_id).filter(Boolean) as string[] || [];
  const { data: actorNames } = useAuditLogActorNames(actorIds);

  const exportCSV = () => {
    if (!data?.logs?.length) return;
    const rows = data.logs.map(l => [
      format(new Date(l.created_at), "yyyy-MM-dd HH:mm"),
      actorNames?.[l.actor_user_id || ""] || l.actor_user_id || "System",
      l.action_type, l.entity_type || "", l.entity_id || "", (l.summary || "").replace(/,/g, " "),
    ]);
    const csv = "Timestamp,Actor,Action,Entity Type,Entity ID,Summary\n" + rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "audit-log.csv"; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit log..."
              value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 0 }))}
              className="pl-9"
            />
          </div>
          <Select value={filters.actionType || "all"} onValueChange={v => setFilters(p => ({ ...p, actionType: v, page: 0 }))}>
            <SelectTrigger className="w-56"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {ACTION_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-3 w-3 mr-1" /> Export CSV</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted/30 rounded-lg animate-pulse" />)}</div>
      ) : !data?.logs?.length ? (
        <p className="text-center py-12 text-muted-foreground text-sm">No audit log entries.</p>
      ) : (
        <>
          <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-border/50">
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Time</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Actor</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Action</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Entity</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">Summary</th>
              </tr></thead>
              <tbody>
                {data.logs.map(l => (
                  <tr key={l.id} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(l.created_at), "d MMM HH:mm")}</td>
                    <td className="p-3 text-xs hidden md:table-cell">{actorNames?.[l.actor_user_id || ""] || "System"}</td>
                    <td className="p-3 text-xs capitalize">{l.action_type?.replace(/_/g, " ")}</td>
                    <td className="p-3 text-xs text-muted-foreground hidden lg:table-cell capitalize">{l.entity_type?.replace(/_/g, " ") || "—"}</td>
                    <td className="p-3 text-xs max-w-[300px] truncate">{l.summary || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{data.total} entries</p>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={filters.page === 0} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>Prev</Button>
              <Button size="sm" variant="outline" disabled={(filters.page + 1) * filters.pageSize >= data.total} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>Next</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
