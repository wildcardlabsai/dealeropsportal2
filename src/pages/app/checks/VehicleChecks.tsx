import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Loader2, AlertTriangle, CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVehicleChecks, useRunVehicleCheck } from "@/hooks/useVehicleChecks";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function VehicleChecks() {
  const navigate = useNavigate();
  const [vrm, setVrm] = useState("");
  const [searchHistory, setSearchHistory] = useState("");
  const { data: checks, isLoading: historyLoading } = useVehicleChecks(searchHistory);
  const runCheck = useRunVehicleCheck();
  const [activeTab, setActiveTab] = useState("run");

  const handleRunCheck = async (forceFresh = false) => {
    const cleanVrm = vrm.replace(/\s/g, "").toUpperCase();
    if (!cleanVrm || cleanVrm.length < 2) {
      toast.error("Enter a valid VRM");
      return;
    }
    try {
      const data = await runCheck.mutateAsync({ vrm: cleanVrm, forceFresh });
      toast.success(data.cached ? "Loaded from cache" : "Vehicle check complete");
      if (data.check?.id) navigate(`/app/checks/${data.check.id}`);
    } catch (err: any) {
      toast.error(err.message || "Check failed");
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "success": return <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Success</Badge>;
      case "partial": return <Badge variant="default" className="bg-amber-500/20 text-amber-400 border-amber-500/30">Partial</Badge>;
      case "failed": return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Vehicle Checks</h1>
        <p className="text-sm text-muted-foreground">DVLA, DVSA MOT history &amp; Global Vehicle Data lookups</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="run">Run Check</TabsTrigger>
          <TabsTrigger value="history">Check History</TabsTrigger>
        </TabsList>

        <TabsContent value="run">
          <div className="max-w-2xl space-y-6">
            <div className="p-6 rounded-xl border border-border/50 bg-card/50">
              <h3 className="text-sm font-semibold mb-3">Enter Registration</h3>
              <div className="flex gap-3">
                <Input
                  value={vrm}
                  onChange={(e) => setVrm(e.target.value.toUpperCase())}
                  placeholder="AB12 CDE"
                  className="font-mono text-lg max-w-xs"
                  onKeyDown={(e) => e.key === "Enter" && handleRunCheck()}
                />
                <Button onClick={() => handleRunCheck()} disabled={runCheck.isPending}>
                  {runCheck.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking...</>
                  ) : (
                    <><Search className="h-4 w-4 mr-2" /> Run Check</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Results are cached for 6 hours per dealer. Use history to view past checks.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by VRM..." value={searchHistory} onChange={(e) => setSearchHistory(e.target.value)} className="pl-9" />
            </div>

            {historyLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}
              </div>
            ) : !checks?.length ? (
              <div className="text-center py-10 rounded-xl border border-border/50 bg-card/50">
                <p className="text-sm text-muted-foreground">No checks run yet</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">VRM</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Make / Model</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Date</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">DVLA</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">MOT</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">GVD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checks.map((check) => {
                      const summary = check.summary_data as any;
                      return (
                        <tr
                          key={check.id}
                          className="border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => navigate(`/app/checks/${check.id}`)}
                        >
                          <td className="p-3 font-mono text-sm font-medium text-primary">{check.vrm}</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {summary?.make && summary?.model ? `${summary.make} ${summary.model}` : summary?.make || "—"}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(check.created_at), "d MMM yyyy HH:mm")}
                            </span>
                          </td>
                          <td className="p-3">{statusBadge(check.status)}</td>
                          <td className="p-3 hidden md:table-cell">
                            {check.dvla_status === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : check.dvla_status === "failed" ? <XCircle className="h-4 w-4 text-destructive" /> : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            {check.dvsa_status === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : check.dvsa_status === "failed" ? <XCircle className="h-4 w-4 text-destructive" /> : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            {check.gvd_status === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : check.gvd_status === "failed" ? <XCircle className="h-4 w-4 text-destructive" /> : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
