import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, LayoutGrid, List, Phone, Mail, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeads, useLeadsByStage, useUpdateLead, useAddLeadActivity, useLeadStats, STAGE_ORDER, STAGE_LABELS, SOURCE_LABELS } from "@/hooks/useLeads";
import { useUserDealerId } from "@/hooks/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";

const stageColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  contacted: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  appointment_set: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  test_drive: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  finance: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  negotiating: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  reserved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  sold: "bg-green-600/10 text-green-600 border-green-600/20",
  lost: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function LeadList() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [view, setView] = useState<"list" | "pipeline">("pipeline");
  const { data: leads, isLoading } = useLeads(search, stageFilter);
  const { data: pipelineData } = useLeadsByStage();
  const { data: stats } = useLeadStats();
  const { data: dealerId } = useUserDealerId();
  const { user } = useAuth();
  const updateLead = useUpdateLead();
  const addActivity = useAddLeadActivity();
  const navigate = useNavigate();

  const handleDrop = async (leadId: string, newStage: string, oldStage: string) => {
    if (newStage === oldStage) return;
    try {
      const statusMap: Record<string, string> = { sold: "won", lost: "lost" };
      const updates: any = { id: leadId, stage: newStage };
      if (statusMap[newStage]) updates.status = statusMap[newStage];
      else updates.status = "new";
      await updateLead.mutateAsync(updates);
      if (dealerId) {
        await addActivity.mutateAsync({
          dealer_id: dealerId, lead_id: leadId, created_by_user_id: user?.id,
          type: "stage_change", old_stage: oldStage, new_stage: newStage,
          message: `Stage changed from ${STAGE_LABELS[oldStage] || oldStage} to ${STAGE_LABELS[newStage] || newStage}`,
        });
      }
    } catch { toast.error("Failed to update stage"); }
  };

  const exportCSV = () => {
    if (!leads?.length) return;
    const headers = ["Lead #", "Name", "Stage", "Source", "Phone", "Email", "Value", "Created"];
    const rows = leads.map((l: any) => [
      l.lead_number || "", `${l.first_name} ${l.last_name}`, l.stage, l.source,
      l.phone || "", l.email || "", l.estimated_value || "", format(new Date(l.created_at), "yyyy-MM-dd"),
    ]);
    const csv = [headers, ...rows].map(r => r.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `leads-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const pipelineStages = STAGE_ORDER.filter(s => s !== "sold" && s !== "lost");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Open Leads", value: stats?.open ?? 0 },
          { label: "New Today", value: stats?.newToday ?? 0 },
          { label: "Won This Month", value: stats?.wonThisMonth ?? 0 },
          { label: "Lost This Month", value: stats?.lostThisMonth ?? 0 },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-border/50 bg-card/50">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Leads Pipeline</h1>
          <p className="text-sm text-muted-foreground">{leads?.length ?? 0} leads</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />CSV</Button>
          <div className="flex border rounded-md">
            <Button variant={view === "pipeline" ? "default" : "ghost"} size="sm" onClick={() => setView("pipeline")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={view === "list" ? "default" : "ghost"} size="sm" onClick={() => setView("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => navigate("/app/leads/new")}><Plus className="h-4 w-4 mr-2" />Add Lead</Button>
        </div>
      </div>

      {view === "list" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {STAGE_ORDER.map(s => <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}</div>
          ) : !leads?.length ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border/50 bg-card/50">
              <p className="text-muted-foreground mb-4">No leads yet</p>
              <Button onClick={() => navigate("/app/leads/new")}><Plus className="h-4 w-4 mr-2" />Add your first lead</Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Lead #</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Customer</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Stage</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Source</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Vehicle</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Next Action</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead: any) => (
                      <tr key={lead.id} onClick={() => navigate(`/app/leads/${lead.id}`)}
                        className="border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors">
                        <td className="p-3 text-sm font-mono text-muted-foreground">{lead.lead_number || "—"}</td>
                        <td className="p-3">
                          <p className="text-sm font-medium">{lead.first_name} {lead.last_name}</p>
                          {lead.phone && <p className="text-xs text-muted-foreground">{lead.phone}</p>}
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${stageColors[lead.stage] || stageColors.new}`}>
                            {STAGE_LABELS[lead.stage] || lead.stage}
                          </span>
                        </td>
                        <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                          {SOURCE_LABELS[lead.source] || lead.source}
                        </td>
                        <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                          {lead.vehicles ? `${(lead.vehicles as any).make} ${(lead.vehicles as any).model}` : lead.vehicle_interest_text || "—"}
                        </td>
                        <td className="p-3 hidden lg:table-cell text-xs">
                          {lead.next_action_at ? (
                            <span className={new Date(lead.next_action_at) < new Date() ? "text-destructive font-medium" : "text-muted-foreground"}>
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {format(new Date(lead.next_action_at), "d MMM HH:mm")}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{format(new Date(lead.created_at), "d MMM yy")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {view === "pipeline" && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {pipelineStages.map(stage => (
            <div key={stage} className="min-w-[240px] flex-shrink-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const data = e.dataTransfer.getData("text/plain");
                if (data) {
                  const [leadId, oldStage] = data.split("|");
                  handleDrop(leadId, stage, oldStage);
                }
              }}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${stageColors[stage]}`}>
                  {STAGE_LABELS[stage]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {pipelineData?.[stage]?.length || 0}
                </span>
              </div>
              <div className="space-y-2 min-h-[200px] p-2 rounded-lg border border-border/30 bg-muted/10">
                {pipelineData?.[stage]?.map((lead: any) => (
                  <div key={lead.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", `${lead.id}|${lead.stage}`)}
                    onClick={() => navigate(`/app/leads/${lead.id}`)}
                    className="p-3 rounded-lg border border-border/50 bg-card hover:bg-card/80 cursor-pointer transition-colors">
                    <p className="text-sm font-medium truncate">{lead.first_name} {lead.last_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.vehicles ? `${(lead.vehicles as any).vrm} – ${(lead.vehicles as any).make} ${(lead.vehicles as any).model}` : lead.vehicle_interest_text || "No vehicle"}
                    </p>
                    {lead.next_action_at && (
                      <p className={`text-xs mt-1 ${new Date(lead.next_action_at) < new Date() ? "text-destructive" : "text-muted-foreground"}`}>
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {format(new Date(lead.next_action_at), "d MMM")}
                      </p>
                    )}
                    {lead.estimated_value && (
                      <p className="text-xs text-muted-foreground mt-1">£{Number(lead.estimated_value).toLocaleString()}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
