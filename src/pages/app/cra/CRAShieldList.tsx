import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, Filter, ShieldAlert, ShieldCheck, Shield, AlertTriangle, Clock, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useCRACases } from "@/hooks/useCRACases";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

const statusLabels: Record<string, string> = {
  open: "Open",
  awaiting_evidence: "Awaiting Evidence",
  awaiting_diagnostic: "Awaiting Diagnostic",
  under_review: "Under Review",
  resolved: "Resolved",
};

const riskConfig: Record<string, { label: string; icon: typeof Shield; className: string }> = {
  red: { label: "High", icon: ShieldAlert, className: "text-red-400 bg-red-500/10 border-red-500/20" },
  amber: { label: "Medium", icon: Shield, className: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  green: { label: "Low", icon: ShieldCheck, className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
};

export default function CRAShieldList() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data: cases, isLoading } = useCRACases(statusFilter);

  const filtered = cases?.filter((c: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.case_number?.toLowerCase().includes(s) ||
      c.vehicle_registration?.toLowerCase().includes(s) ||
      c.fault_description?.toLowerCase().includes(s) ||
      c.vehicle_make?.toLowerCase().includes(s)
    );
  });

  const openCount = cases?.filter((c: any) => c.case_status !== "resolved").length ?? 0;
  const redCount = cases?.filter((c: any) => c.risk_rating === "red" && c.case_status !== "resolved").length ?? 0;
  const awaitingDiag = cases?.filter((c: any) => c.case_status === "awaiting_diagnostic").length ?? 0;
  const resolvedMonth = cases?.filter((c: any) => {
    if (c.case_status !== "resolved") return false;
    const d = new Date(c.updated_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Alert className="mb-4 border-amber-500/30 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertDescription className="text-xs text-amber-300">
          Decision support only, not legal advice. Use professional judgement.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> CRA Shield
          </h1>
          <p className="text-sm text-muted-foreground">Consumer Rights Act decision support</p>
        </div>
        <Button onClick={() => navigate("/app/cra/new")} className="glow">
          <Plus className="h-4 w-4 mr-2" /> New CRA Case
        </Button>
      </div>

      {/* Dashboard tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Open Cases</span>
            </div>
            <p className="text-2xl font-bold">{openCount}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              <span className="text-xs text-muted-foreground">Red Risk</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{redCount}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Search className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Awaiting Diagnostic</span>
            </div>
            <p className="text-2xl font-bold">{awaitingDiag}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Resolved (Month)</span>
            </div>
            <p className="text-2xl font-bold">{resolvedMonth}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search cases, VRM, description..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}
        </div>
      ) : !filtered?.length ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border/50 bg-card/50">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No CRA cases yet</p>
          <Button onClick={() => navigate("/app/cra/new")}>
            <Plus className="h-4 w-4 mr-2" /> Create your first CRA case
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Case #</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Vehicle</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Fault</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Risk</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Window</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Sale Date</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any) => {
                  const risk = riskConfig[c.risk_rating] || riskConfig.amber;
                  const RiskIcon = risk.icon;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/app/cra/${c.id}`)}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="p-3 text-xs font-mono text-primary">{c.case_number}</td>
                      <td className="p-3 text-sm">
                        {c.vehicle_registration && <span className="font-medium">{c.vehicle_registration} </span>}
                        <span className="text-muted-foreground">{[c.vehicle_make, c.vehicle_model].filter(Boolean).join(" ")}</span>
                      </td>
                      <td className="p-3 hidden md:table-cell text-xs text-muted-foreground capitalize">{c.fault_category?.replace(/_/g, " ")}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${risk.className}`}>
                          <RiskIcon className="h-3 w-3" /> {risk.label}
                        </span>
                      </td>
                      <td className="p-3 hidden md:table-cell text-xs text-muted-foreground">
                        {c.time_window?.replace(/_/g, " ").replace("30 days to 6 months", "31d–6m")}
                      </td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-0.5 rounded-full border border-border/50 bg-muted/30">
                          {statusLabels[c.case_status] || c.case_status}
                        </span>
                      </td>
                      <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                        {c.sale_date ? format(new Date(c.sale_date), "d MMM yyyy") : "—"}
                      </td>
                      <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                        {format(new Date(c.created_at), "d MMM yyyy")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
