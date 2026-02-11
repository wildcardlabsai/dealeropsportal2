import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, AlertTriangle, CheckCircle2, Clock, Info, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVehicleChecks, useRunVehicleCheck } from "@/hooks/useVehicleChecks";
import { toast } from "sonner";
import { format } from "date-fns";

export default function VehicleChecks() {
  const [vrm, setVrm] = useState("");
  const [searchHistory, setSearchHistory] = useState("");
  const { data: checks, isLoading: historyLoading } = useVehicleChecks(searchHistory);
  const runCheck = useRunVehicleCheck();
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("run");

  const handleRunCheck = async () => {
    const cleanVrm = vrm.replace(/\s/g, "").toUpperCase();
    if (!cleanVrm || cleanVrm.length < 2) {
      toast.error("Enter a valid VRM");
      return;
    }
    setResult(null);
    try {
      const data = await runCheck.mutateAsync(cleanVrm);
      setResult(data);
      toast.success("Vehicle check complete");
    } catch (err: any) {
      toast.error(err.message || "Check failed");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Vehicle Checks</h1>
        <p className="text-sm text-muted-foreground">DVLA, DVSA MOT, and vehicle data lookups</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="run">Run Check</TabsTrigger>
          <TabsTrigger value="history">Check History</TabsTrigger>
        </TabsList>

        <TabsContent value="run">
          <div className="max-w-2xl space-y-6">
            {/* VRM Input */}
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
                <Button onClick={handleRunCheck} disabled={runCheck.isPending}>
                  {runCheck.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking...</>
                  ) : (
                    <><Search className="h-4 w-4 mr-2" /> Run Check</>
                  )}
                </Button>
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="space-y-4">
                {/* DVLA */}
                <div className="p-5 rounded-xl border border-border/50 bg-card/50">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" /> DVLA Vehicle Details
                  </h3>
                  {result.dvla ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(result.dvla as Record<string, any>).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                          <p className="text-sm font-medium">{String(value ?? "—")}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" /> No DVLA data available
                    </p>
                  )}
                </div>

                {/* DVSA MOT */}
                <div className="p-5 rounded-xl border border-border/50 bg-card/50">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" /> MOT History (DVSA)
                  </h3>
                  {result.dvsa?.length ? (
                    <div className="space-y-3">
                      {(result.dvsa as any[]).slice(0, 5).map((test: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/30 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${test.testResult === "PASSED" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                              {test.testResult}
                            </span>
                            <span className="text-xs text-muted-foreground">{test.completedDate}</span>
                          </div>
                          {test.odometerValue && (
                            <p className="text-xs text-muted-foreground">Mileage: {Number(test.odometerValue).toLocaleString()}</p>
                          )}
                          {test.rfrAndComments?.length > 0 && (
                            <div className="space-y-1 mt-1">
                              {test.rfrAndComments.map((c: any, j: number) => (
                                <p key={j} className="text-xs text-muted-foreground flex items-start gap-1">
                                  <Info className="h-3 w-3 mt-0.5 shrink-0" /> {c.text}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No MOT history available</p>
                  )}
                </div>

                {/* GVD */}
                <div className="p-5 rounded-xl border border-border/50 bg-card/50">
                  <h3 className="text-sm font-semibold mb-3">Vehicle Data (GVD)</h3>
                  {result.gvd ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(result.gvd as Record<string, any>).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                          <p className="text-sm font-medium">{String(value ?? "—")}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No GVD data available</p>
                  )}
                </div>

                {/* Coming Soon */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl border border-border/50 bg-card/30 opacity-50">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Lock className="h-4 w-4" /> HPI Check
                    </h3>
                    <p className="text-xs text-muted-foreground">Coming Soon</p>
                  </div>
                  <div className="p-5 rounded-xl border border-border/50 bg-card/30 opacity-50">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Valuation
                    </h3>
                    <p className="text-xs text-muted-foreground">Coming Soon</p>
                  </div>
                </div>
              </div>
            )}
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
                      <th className="text-left text-xs font-medium text-muted-foreground p-3">Date</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">DVLA</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">MOT</th>
                      <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">GVD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checks.map((check) => (
                      <tr key={check.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono text-sm font-medium text-primary">{check.vrm}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(check.created_at), "d MMM yyyy HH:mm")}
                          </span>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          {check.dvla_data ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          {check.dvsa_data ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          {check.gvd_data ? <CheckCircle2 className="h-4 w-4 text-success" /> : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
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
