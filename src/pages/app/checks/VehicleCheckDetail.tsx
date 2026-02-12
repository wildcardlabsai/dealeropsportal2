import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Copy, ChevronDown, ChevronUp, Lock, Info, Car, RefreshCw, Plus, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVehicleCheck, useRunVehicleCheck } from "@/hooks/useVehicleChecks";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

function CopyButton({ text }: { text: string }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(text); toast.success("Copied"); }}
      className="ml-1 p-0.5 rounded hover:bg-muted/50 transition-colors"
    >
      <Copy className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}

function DataField({ label, value, copyable }: { label: string; value: any; copyable?: boolean }) {
  const display = value !== null && value !== undefined ? String(value) : "—";
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium flex items-center gap-1">
        {display}
        {copyable && display !== "—" && <CopyButton text={display} />}
      </p>
    </div>
  );
}

function RawJsonSection({ data, title }: { data: any; title: string }) {
  const [open, setOpen] = useState(false);
  if (!data) return null;
  return (
    <div className="mt-4 border-t border-border/30 pt-3">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {title} Raw JSON
      </button>
      {open && (
        <pre className="mt-2 p-3 rounded-lg bg-muted/30 text-xs overflow-auto max-h-64 font-mono">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function ProviderStatusIcon({ status }: { status: string }) {
  if (status === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "failed") return <XCircle className="h-4 w-4 text-destructive" />;
  return <span className="text-xs text-muted-foreground">Not run</span>;
}

export default function VehicleCheckDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: check, isLoading } = useVehicleCheck(id);
  const runCheck = useRunVehicleCheck();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted/30 animate-pulse rounded" />
        <div className="h-64 bg-muted/30 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!check) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Check not found</p>
        <Button variant="ghost" onClick={() => navigate("/app/checks")} className="mt-4">Back to Checks</Button>
      </div>
    );
  }

  const summary = check.summary_data as any;
  const dvla = check.dvla_json as any;
  const dvsa = check.dvsa_json as any;
  const gvd = check.gvd_json as any;

  const handleRerun = async () => {
    try {
      const data = await runCheck.mutateAsync({ vrm: check.vrm, forceFresh: true });
      toast.success("Fresh check complete");
      if (data.check?.id && data.check.id !== check.id) navigate(`/app/checks/${data.check.id}`);
    } catch (err: any) {
      toast.error(err.message || "Re-run failed");
    }
  };

  const handleCreateVehicle = () => {
    const params = new URLSearchParams();
    if (check.vrm) params.set("vrm", check.vrm);
    if (summary?.make) params.set("make", summary.make);
    if (summary?.model) params.set("model", summary.model);
    if (summary?.colour) params.set("colour", summary.colour);
    if (summary?.fuelType) params.set("fuel_type", summary.fuelType);
    if (summary?.yearOfManufacture) params.set("year", String(summary.yearOfManufacture));
    if (summary?.latestMotMileage) params.set("mileage", String(summary.latestMotMileage));
    if (summary?.vin) params.set("vin", summary.vin);
    navigate(`/app/vehicles/new?${params.toString()}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/checks")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-mono">{check.vrm}</h1>
            <p className="text-xs text-muted-foreground">
              Checked {format(new Date(check.created_at), "d MMM yyyy 'at' HH:mm")}
              {" · "}
              <span className="inline-flex items-center gap-1">
                DVLA <ProviderStatusIcon status={check.dvla_status} />
                {" · "}MOT <ProviderStatusIcon status={check.dvsa_status} />
                {" · "}GVD <ProviderStatusIcon status={check.gvd_status} />
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCreateVehicle}>
            <Plus className="h-4 w-4 mr-1" /> Create Vehicle
          </Button>
          <Button variant="outline" size="sm" onClick={handleRerun} disabled={runCheck.isPending}>
            <RefreshCw className={`h-4 w-4 mr-1 ${runCheck.isPending ? "animate-spin" : ""}`} /> Re-run
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dvla">DVLA Details</TabsTrigger>
          <TabsTrigger value="mot">DVSA MOT</TabsTrigger>
          <TabsTrigger value="gvd">Vehicle Data</TabsTrigger>
          <TabsTrigger value="coming" disabled>Coming Soon</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Car className="h-4 w-4" /> Vehicle</h3>
              <div className="grid grid-cols-2 gap-3">
                <DataField label="Make" value={summary?.make} />
                <DataField label="Model" value={summary?.model} />
                <DataField label="Colour" value={summary?.colour} />
                <DataField label="Fuel" value={summary?.fuelType} />
                <DataField label="Year" value={summary?.yearOfManufacture} />
                <DataField label="Engine" value={summary?.engineCapacity ? `${summary.engineCapacity}cc` : null} />
                <DataField label="First Reg" value={summary?.firstRegistrationDate} />
                <DataField label="VIN" value={summary?.vin} copyable />
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Tax &amp; MOT</h3>
              <div className="grid grid-cols-2 gap-3">
                <DataField label="Tax Status" value={summary?.taxed === true ? "Taxed" : summary?.taxed === false ? "Untaxed" : null} />
                <DataField label="Tax Due" value={summary?.taxDueDate} />
                <DataField label="MOT Status" value={summary?.motStatus || summary?.latestMotResult} />
                <DataField label="MOT Expiry" value={summary?.motExpiryDate} />
                <DataField label="Latest MOT" value={summary?.latestMotDate} />
                <DataField label="MOT Mileage" value={summary?.latestMotMileage ? Number(summary.latestMotMileage).toLocaleString() : null} />
              </div>
            </div>

            <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Info className="h-4 w-4" /> Ownership</h3>
              <div className="grid grid-cols-2 gap-3">
                <DataField label="Owners" value={summary?.numberOfOwners} />
                <DataField label="Body Type" value={summary?.bodyType} />
                <DataField label="Doors" value={summary?.doors} />
                <DataField label="Seats" value={summary?.seats} />
                <DataField label="Insurance Group" value={summary?.insuranceGroup} />
              </div>
            </div>
          </div>

          {check.error_message && (
            <div className="mt-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Error</p>
                <p className="text-sm text-muted-foreground">{check.error_message}</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* DVLA */}
        <TabsContent value="dvla">
          <div className="p-5 rounded-xl border border-border/50 bg-card/50">
            {check.dvla_status === "failed" ? (
              <div className="flex items-center gap-2 text-destructive"><XCircle className="h-5 w-5" /> DVLA data unavailable</div>
            ) : dvla ? (
              <>
                <h3 className="text-sm font-semibold mb-4">DVLA Vehicle Enquiry</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(dvla as Record<string, any>).map(([key, value]) => (
                    <DataField
                      key={key}
                      label={key.replace(/([A-Z])/g, " $1").trim()}
                      value={value}
                      copyable={["registrationNumber", "vin"].includes(key)}
                    />
                  ))}
                </div>
                <RawJsonSection data={dvla} title="DVLA" />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No DVLA data</p>
            )}
          </div>
        </TabsContent>

        {/* DVSA MOT */}
        <TabsContent value="mot">
          <div className="p-5 rounded-xl border border-border/50 bg-card/50">
            {check.dvsa_status === "failed" ? (
              <div className="flex items-center gap-2 text-destructive"><XCircle className="h-5 w-5" /> DVSA MOT data unavailable</div>
            ) : dvsa && Array.isArray(dvsa) && dvsa.length > 0 ? (
              <>
                <h3 className="text-sm font-semibold mb-4">MOT History ({dvsa.length} tests)</h3>
                <div className="space-y-3">
                  {(dvsa as any[]).map((test: any, i: number) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/20 border border-border/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className={test.testResult === "PASSED" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-destructive/20 text-destructive border-destructive/30"}>
                            {test.testResult}
                          </Badge>
                          <span className="text-sm font-medium">{test.completedDate}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {test.odometerValue && <span>{Number(test.odometerValue).toLocaleString()} {test.odometerUnit || "mi"}</span>}
                          {test.expiryDate && <span>Expires: {test.expiryDate}</span>}
                        </div>
                      </div>
                      {test.rfrAndComments?.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {test.rfrAndComments.map((c: any, j: number) => (
                            <div key={j} className="flex items-start gap-2 text-xs">
                              <Badge variant="outline" className={`shrink-0 text-[10px] ${c.type === "FAIL" ? "border-destructive/50 text-destructive" : c.type === "ADVISORY" ? "border-amber-500/50 text-amber-400" : "border-border"}`}>
                                {c.type}
                              </Badge>
                              <span className="text-muted-foreground">{c.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <RawJsonSection data={dvsa} title="DVSA" />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No MOT history available</p>
            )}
          </div>
        </TabsContent>

        {/* GVD */}
        <TabsContent value="gvd">
          <div className="p-5 rounded-xl border border-border/50 bg-card/50">
            {check.gvd_status === "failed" ? (
              <div className="flex items-center gap-2 text-destructive"><XCircle className="h-5 w-5" /> GVD data unavailable</div>
            ) : gvd ? (
              <>
                <h3 className="text-sm font-semibold mb-4">Global Vehicle Data</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(gvd as Record<string, any>).map(([key, value]) => (
                    <DataField key={key} label={key.replace(/([A-Z])/g, " $1").trim()} value={value} />
                  ))}
                </div>
                <RawJsonSection data={gvd} title="GVD" />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No GVD data available</p>
            )}
          </div>
        </TabsContent>

        {/* COMING SOON */}
        <TabsContent value="coming">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-border/50 bg-card/30 opacity-50">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Lock className="h-4 w-4" /> HPI Check</h3>
              <p className="text-xs text-muted-foreground">Coming Soon</p>
            </div>
            <div className="p-5 rounded-xl border border-border/50 bg-card/30 opacity-50">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Lock className="h-4 w-4" /> Valuation</h3>
              <p className="text-xs text-muted-foreground">Coming Soon</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
