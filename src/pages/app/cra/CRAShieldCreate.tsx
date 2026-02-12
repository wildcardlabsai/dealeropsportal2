import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCreateCRACase } from "@/hooks/useCRACases";
import { useCreateTask } from "@/hooks/useTasks";
import { useUserDealerId } from "@/hooks/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { runCRAEngine, CRAInputs } from "@/lib/craEngine";
import { logAuditEvent } from "@/hooks/useAuditLogs";
import { toast } from "sonner";

const FAULT_CATEGORIES = [
  "engine", "gearbox", "electrical", "brakes", "suspension", "steering",
  "cooling", "infotainment", "hvac", "body_cosmetic", "wear_and_tear", "other",
];
const SALE_TYPES = ["on_premises", "distance", "hybrid"];
const USAGE_TYPES = ["normal", "heavy", "unknown"];

export default function CRAShieldCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dealerId } = useUserDealerId();
  const createCase = useCreateCRACase();
  const createTask = useCreateTask();

  const [form, setForm] = useState({
    sale_date: "",
    issue_reported_date: new Date().toISOString().split("T")[0],
    mileage_at_sale: "",
    mileage_at_issue: "",
    vehicle_first_reg_date: "",
    vehicle_make: "",
    vehicle_model: "",
    vehicle_registration: "",
    sale_type: "on_premises",
    fault_category: "other",
    fault_description: "",
    vehicle_drivable: true,
    warning_lights_present: false,
    customer_usage: "unknown",
    pdi_present: false,
    handover_acknowledgement_signed: false,
    pre_delivery_photos_present: false,
    diagnostic_report_present: false,
    service_history_present: false,
    warranty_active: false,
  });

  const set = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async () => {
    if (!dealerId || !user) return;
    if (!form.sale_date || !form.fault_description) {
      toast.error("Sale date and fault description are required.");
      return;
    }

    const inputs: CRAInputs = {
      ...form,
      mileage_at_sale: form.mileage_at_sale ? Number(form.mileage_at_sale) : null,
      mileage_at_issue: form.mileage_at_issue ? Number(form.mileage_at_issue) : null,
    };
    const outputs = runCRAEngine(inputs);

    const caseData = {
      dealer_id: dealerId,
      created_by_user_id: user.id,
      sale_date: form.sale_date,
      issue_reported_date: form.issue_reported_date,
      mileage_at_sale: form.mileage_at_sale ? Number(form.mileage_at_sale) : null,
      mileage_at_issue: form.mileage_at_issue ? Number(form.mileage_at_issue) : null,
      vehicle_first_reg_date: form.vehicle_first_reg_date || null,
      vehicle_make: form.vehicle_make || null,
      vehicle_model: form.vehicle_model || null,
      vehicle_registration: form.vehicle_registration || null,
      sale_type: form.sale_type,
      fault_category: form.fault_category,
      fault_description: form.fault_description,
      vehicle_drivable: form.vehicle_drivable,
      warning_lights_present: form.warning_lights_present,
      customer_usage: form.customer_usage,
      pdi_present: form.pdi_present,
      handover_acknowledgement_signed: form.handover_acknowledgement_signed,
      pre_delivery_photos_present: form.pre_delivery_photos_present,
      diagnostic_report_present: form.diagnostic_report_present,
      service_history_present: form.service_history_present,
      warranty_active: form.warranty_active,
      // Outputs
      days_since_sale: outputs.days_since_sale,
      time_window: outputs.time_window,
      risk_rating: outputs.risk_rating,
      risk_reasons: outputs.risk_reasons,
      recommended_next_steps: outputs.recommended_next_steps,
      evidence_checklist: outputs.evidence_checklist,
      customer_response_standard: outputs.customer_response_standard,
      customer_response_firm: outputs.customer_response_firm,
      customer_response_deescalation: outputs.customer_response_deescalation,
      inputs_snapshot: inputs,
      outputs_snapshot: outputs,
    };

    try {
      const created = await createCase.mutateAsync(caseData);

      // Auto-create tasks
      const baseTasks = [
        { title: `CRA ${(created as any).case_number}: Send complaint acknowledgement`, priority: "high" as const },
      ];
      if (!form.diagnostic_report_present) {
        baseTasks.push({ title: `CRA ${(created as any).case_number}: Request diagnostic report`, priority: "high" as const });
      }
      if (!form.pdi_present) {
        baseTasks.push({ title: `CRA ${(created as any).case_number}: Confirm PDI evidence`, priority: "high" as const });
      }

      for (const t of baseTasks) {
        await createTask.mutateAsync({
          dealer_id: dealerId,
          created_by_user_id: user.id,
          assigned_to: user.id,
          title: t.title,
          priority: t.priority,
          status: "todo",
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      await logAuditEvent({
        dealerId,
        actorUserId: user.id,
        actionType: "cra_case_created",
        entityType: "cra_case",
        entityId: (created as any).id,
        summary: `CRA case ${(created as any).case_number} created — risk: ${outputs.risk_rating}`,
        afterData: caseData,
      });

      toast.success(`CRA case created — Risk: ${outputs.risk_rating.toUpperCase()}`);
      navigate(`/app/cra/${(created as any).id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create CRA case");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <Alert className="mb-4 border-amber-500/30 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertDescription className="text-xs text-amber-300">
          Decision support only, not legal advice. Use professional judgement.
        </AlertDescription>
      </Alert>

      <Button variant="ghost" size="sm" onClick={() => navigate("/app/cra")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to CRA Shield
      </Button>

      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" /> New CRA Case
      </h1>

      <div className="space-y-6">
        {/* Sale & Vehicle */}
        <Card className="glass">
          <CardHeader><CardTitle className="text-sm">Sale & Vehicle Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Sale Date *</Label>
              <Input type="date" value={form.sale_date} onChange={(e) => set("sale_date", e.target.value)} />
            </div>
            <div>
              <Label>Issue Reported Date *</Label>
              <Input type="date" value={form.issue_reported_date} onChange={(e) => set("issue_reported_date", e.target.value)} />
            </div>
            <div>
              <Label>Vehicle Registration</Label>
              <Input value={form.vehicle_registration} onChange={(e) => set("vehicle_registration", e.target.value.toUpperCase())} placeholder="AB12 CDE" />
            </div>
            <div>
              <Label>Vehicle Make</Label>
              <Input value={form.vehicle_make} onChange={(e) => set("vehicle_make", e.target.value)} />
            </div>
            <div>
              <Label>Vehicle Model</Label>
              <Input value={form.vehicle_model} onChange={(e) => set("vehicle_model", e.target.value)} />
            </div>
            <div>
              <Label>First Registration Date</Label>
              <Input type="date" value={form.vehicle_first_reg_date} onChange={(e) => set("vehicle_first_reg_date", e.target.value)} />
            </div>
            <div>
              <Label>Mileage at Sale</Label>
              <Input type="number" value={form.mileage_at_sale} onChange={(e) => set("mileage_at_sale", e.target.value)} />
            </div>
            <div>
              <Label>Mileage at Issue</Label>
              <Input type="number" value={form.mileage_at_issue} onChange={(e) => set("mileage_at_issue", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Sale Context */}
        <Card className="glass">
          <CardHeader><CardTitle className="text-sm">Sale Context</CardTitle></CardHeader>
          <CardContent>
            <Label>Sale Type</Label>
            <Select value={form.sale_type} onValueChange={(v) => set("sale_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SALE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Fault Details */}
        <Card className="glass">
          <CardHeader><CardTitle className="text-sm">Fault Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Fault Category *</Label>
              <Select value={form.fault_category} onValueChange={(v) => set("fault_category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FAULT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fault Description *</Label>
              <Textarea value={form.fault_description} onChange={(e) => set("fault_description", e.target.value)} rows={3} placeholder="Describe the reported fault in detail..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <Label className="text-xs">Vehicle Drivable</Label>
                <Switch checked={form.vehicle_drivable} onCheckedChange={(v) => set("vehicle_drivable", v)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <Label className="text-xs">Warning Lights</Label>
                <Switch checked={form.warning_lights_present} onCheckedChange={(v) => set("warning_lights_present", v)} />
              </div>
              <div>
                <Label className="text-xs">Customer Usage</Label>
                <Select value={form.customer_usage} onValueChange={(v) => set("customer_usage", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {USAGE_TYPES.map((u) => (
                      <SelectItem key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evidence Flags */}
        <Card className="glass">
          <CardHeader><CardTitle className="text-sm">Evidence & Compliance Indicators</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { key: "pdi_present", label: "PDI Record Present" },
                { key: "handover_acknowledgement_signed", label: "Handover Acknowledgement Signed" },
                { key: "pre_delivery_photos_present", label: "Pre-Delivery Photos Present" },
                { key: "diagnostic_report_present", label: "Diagnostic Report Present" },
                { key: "service_history_present", label: "Service History Present" },
                { key: "warranty_active", label: "Warranty Active" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <Label className="text-xs">{label}</Label>
                  <Switch checked={(form as any)[key]} onCheckedChange={(v) => set(key, v)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/app/cra")}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createCase.isPending} className="glow">
            <Shield className="h-4 w-4 mr-2" />
            {createCase.isPending ? "Analysing..." : "Run CRA Analysis & Create Case"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
