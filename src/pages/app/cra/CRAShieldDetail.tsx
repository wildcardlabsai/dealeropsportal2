import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Shield, ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2,
  Upload, FileText, Clock, ListChecks, MessageSquare, Download, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useCRACase, useUpdateCRACase, useCRACaseActivities, useCreateCRACaseActivity, useCRACaseDocuments, useUploadCRADocument } from "@/hooks/useCRACases";
import { runCRAEngine, CRAInputs } from "@/lib/craEngine";
import { useAuth } from "@/contexts/AuthContext";
import { useUserDealerId } from "@/hooks/useCustomers";
import { logAuditEvent } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  open: "Open",
  awaiting_evidence: "Awaiting Evidence",
  awaiting_diagnostic: "Awaiting Diagnostic",
  under_review: "Under Review",
  resolved: "Resolved",
};

const riskStyles: Record<string, { className: string; icon: typeof Shield }> = {
  red: { className: "text-red-400 bg-red-500/10 border-red-500/20", icon: ShieldAlert },
  amber: { className: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Shield },
  green: { className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: ShieldCheck },
};

const DOC_TYPES = ["diagnostic_report", "pdi", "handover_acknowledgement", "vehicle_photos", "service_history", "other"];

export default function CRAShieldDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dealerId } = useUserDealerId();
  const { data: craCase, isLoading } = useCRACase(id);
  const updateCase = useUpdateCRACase();
  const { data: activities } = useCRACaseActivities(id);
  const createActivity = useCreateCRACaseActivity();
  const { data: documents } = useCRACaseDocuments(id);
  const uploadDoc = useUploadCRADocument();

  const [noteText, setNoteText] = useState("");
  const [resolution, setResolution] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<"standard" | "firm" | "deescalation">("standard");

  if (isLoading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-lg bg-muted/30 animate-pulse" />)}</div>;
  }

  if (!craCase) {
    return <div className="text-center py-20 text-muted-foreground">Case not found</div>;
  }

  const c = craCase as any;
  const risk = riskStyles[c.risk_rating] || riskStyles.amber;
  const RiskIcon = risk.icon;

  const handleStatusChange = async (newStatus: string) => {
    if (!user || !dealerId) return;
    const oldStatus = c.case_status;
    await updateCase.mutateAsync({ id: c.id, case_status: newStatus });
    await createActivity.mutateAsync({
      dealer_id: dealerId,
      cra_case_id: c.id,
      created_by_user_id: user.id,
      action_type: "status_change",
      message: `Status changed from ${statusLabels[oldStatus] || oldStatus} to ${statusLabels[newStatus] || newStatus}`,
      before_state: { case_status: oldStatus },
      after_state: { case_status: newStatus },
    });
    await logAuditEvent({
      dealerId, actorUserId: user.id, actionType: "cra_status_changed",
      entityType: "cra_case", entityId: c.id,
      summary: `CRA ${c.case_number} status: ${oldStatus} → ${newStatus}`,
      beforeData: { case_status: oldStatus }, afterData: { case_status: newStatus },
    });
    toast.success("Status updated");
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !user || !dealerId) return;
    await createActivity.mutateAsync({
      dealer_id: dealerId,
      cra_case_id: c.id,
      created_by_user_id: user.id,
      action_type: "note",
      message: noteText,
    });
    await logAuditEvent({
      dealerId, actorUserId: user.id, actionType: "cra_note_added",
      entityType: "cra_case", entityId: c.id, summary: `Note added to CRA ${c.case_number}`,
    });
    setNoteText("");
    toast.success("Note added");
  };

  const handleResolve = async () => {
    if (!user || !dealerId) return;
    await updateCase.mutateAsync({ id: c.id, case_status: "resolved", resolution_summary: resolution || null });
    await createActivity.mutateAsync({
      dealer_id: dealerId, cra_case_id: c.id, created_by_user_id: user.id,
      action_type: "status_change", message: `Case resolved. ${resolution}`,
    });
    await logAuditEvent({
      dealerId, actorUserId: user.id, actionType: "cra_case_resolved",
      entityType: "cra_case", entityId: c.id, summary: `CRA ${c.case_number} resolved`,
    });
    toast.success("Case resolved");
  };

  const handleRerunEngine = async () => {
    if (!user || !dealerId) return;
    const inputs: CRAInputs = {
      sale_date: c.sale_date, issue_reported_date: c.issue_reported_date,
      sale_type: c.sale_type, fault_category: c.fault_category,
      fault_description: c.fault_description, vehicle_drivable: c.vehicle_drivable,
      warning_lights_present: c.warning_lights_present, customer_usage: c.customer_usage,
      pdi_present: c.pdi_present, handover_acknowledgement_signed: c.handover_acknowledgement_signed,
      pre_delivery_photos_present: c.pre_delivery_photos_present,
      diagnostic_report_present: c.diagnostic_report_present,
      service_history_present: c.service_history_present, warranty_active: c.warranty_active,
      mileage_at_sale: c.mileage_at_sale, mileage_at_issue: c.mileage_at_issue,
      vehicle_make: c.vehicle_make, vehicle_model: c.vehicle_model,
      vehicle_registration: c.vehicle_registration,
    };
    const outputs = runCRAEngine(inputs);
    await updateCase.mutateAsync({
      id: c.id,
      days_since_sale: outputs.days_since_sale, time_window: outputs.time_window,
      risk_rating: outputs.risk_rating, risk_reasons: outputs.risk_reasons,
      recommended_next_steps: outputs.recommended_next_steps,
      evidence_checklist: outputs.evidence_checklist,
      customer_response_standard: outputs.customer_response_standard,
      customer_response_firm: outputs.customer_response_firm,
      customer_response_deescalation: outputs.customer_response_deescalation,
      outputs_snapshot: outputs,
    });
    await createActivity.mutateAsync({
      dealer_id: dealerId, cra_case_id: c.id, created_by_user_id: user.id,
      action_type: "decision_regenerated", message: `Decision engine re-run — risk: ${outputs.risk_rating}`,
    });
    toast.success(`Decision re-run — Risk: ${outputs.risk_rating.toUpperCase()}`);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadDoc.mutateAsync({ caseId: c.id, file, documentType: docType });
      await createActivity.mutateAsync({
        dealer_id: dealerId!, cra_case_id: c.id, created_by_user_id: user!.id,
        action_type: "document_uploaded", message: `Document uploaded: ${file.name} (${docType})`,
      });
      toast.success("Document uploaded");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const templateText =
    selectedTemplate === "standard" ? c.customer_response_standard :
    selectedTemplate === "firm" ? c.customer_response_firm : c.customer_response_deescalation;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Alert className="mb-4 border-amber-500/30 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertDescription className="text-xs text-amber-300">
          Decision support only, not legal advice. Use professional judgement.
        </AlertDescription>
      </Alert>

      <Button variant="ghost" size="sm" onClick={() => navigate("/app/cra")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {c.case_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            {c.vehicle_registration && <span className="font-medium">{c.vehicle_registration} </span>}
            {[c.vehicle_make, c.vehicle_model].filter(Boolean).join(" ")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border ${risk.className}`}>
            <RiskIcon className="h-4 w-4" />
            {c.risk_rating === "red" ? "HIGH RISK" : c.risk_rating === "amber" ? "MEDIUM RISK" : "LOW RISK"}
          </span>
          <Select value={c.case_status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(statusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRerunEngine}>
            <RefreshCw className="h-3 w-3 mr-1" /> Re-run
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="glass"><CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Days Since Sale</p>
          <p className="text-xl font-bold">{c.days_since_sale}</p>
        </CardContent></Card>
        <Card className="glass"><CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase">CRA Window</p>
          <p className="text-sm font-medium">{c.time_window?.replace(/_/g, " ")}</p>
        </CardContent></Card>
        <Card className="glass"><CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Fault</p>
          <p className="text-sm font-medium capitalize">{c.fault_category?.replace(/_/g, " ")}</p>
        </CardContent></Card>
        <Card className="glass"><CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Sale Type</p>
          <p className="text-sm font-medium capitalize">{c.sale_type?.replace(/_/g, " ")}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="assessment">
        <TabsList className="mb-4">
          <TabsTrigger value="assessment"><ListChecks className="h-3 w-3 mr-1" /> Assessment</TabsTrigger>
          <TabsTrigger value="responses"><MessageSquare className="h-3 w-3 mr-1" /> Responses</TabsTrigger>
          <TabsTrigger value="evidence"><FileText className="h-3 w-3 mr-1" /> Evidence Vault</TabsTrigger>
          <TabsTrigger value="timeline"><Clock className="h-3 w-3 mr-1" /> Timeline</TabsTrigger>
        </TabsList>

        {/* Assessment tab */}
        <TabsContent value="assessment" className="space-y-4">
          {/* Risk reasons */}
          <Card className="glass">
            <CardHeader><CardTitle className="text-sm">Risk Assessment</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(c.risk_reasons as string[] || []).map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-400" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Next steps */}
          <Card className="glass">
            <CardHeader><CardTitle className="text-sm">Recommended Next Steps</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(c.recommended_next_steps as string[] || []).map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Evidence checklist */}
          <Card className="glass">
            <CardHeader><CardTitle className="text-sm">Evidence Checklist</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(c.evidence_checklist as string[] || []).map((e: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Evidence flags summary */}
          <Card className="glass">
            <CardHeader><CardTitle className="text-sm">Evidence Flags</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { label: "PDI Present", value: c.pdi_present },
                  { label: "Handover Signed", value: c.handover_acknowledgement_signed },
                  { label: "Pre-delivery Photos", value: c.pre_delivery_photos_present },
                  { label: "Diagnostic Report", value: c.diagnostic_report_present },
                  { label: "Service History", value: c.service_history_present },
                  { label: "Warranty Active", value: c.warranty_active },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-2 text-xs">
                    {f.value ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
                    <span className={f.value ? "text-foreground" : "text-muted-foreground"}>{f.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resolve */}
          {c.case_status !== "resolved" && (
            <Card className="glass border-emerald-500/20">
              <CardHeader><CardTitle className="text-sm">Resolve Case</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea placeholder="Resolution summary..." value={resolution} onChange={(e) => setResolution(e.target.value)} rows={2} />
                <Button onClick={handleResolve} className="bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Resolved
                </Button>
              </CardContent>
            </Card>
          )}

          {c.resolution_summary && (
            <Card className="glass border-emerald-500/20">
              <CardHeader><CardTitle className="text-sm text-emerald-400">Resolution</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{c.resolution_summary}</p></CardContent>
            </Card>
          )}

          {/* Internal notes */}
          <Card className="glass">
            <CardHeader><CardTitle className="text-sm">Internal Assessment Notes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={c.internal_assessment_notes || ""}
                onChange={async (e) => {
                  await updateCase.mutateAsync({ id: c.id, internal_assessment_notes: e.target.value });
                }}
                rows={3}
                placeholder="Staff-only notes..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Response templates */}
        <TabsContent value="responses" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Customer Response Templates</CardTitle>
                <Select value={selectedTemplate} onValueChange={(v: any) => setSelectedTemplate(v)}>
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Professional</SelectItem>
                    <SelectItem value="firm">Firm Professional</SelectItem>
                    <SelectItem value="deescalation">Ultra-Calm De-escalation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap font-sans bg-muted/30 rounded-lg p-4 border border-border/50">
                {templateText}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  navigator.clipboard.writeText(templateText || "");
                  toast.success("Copied to clipboard");
                }}
              >
                Copy to Clipboard
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence Vault */}
        <TabsContent value="evidence" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Evidence Vault</CardTitle>
                <div className="flex items-center gap-2">
                  <Select defaultValue="other">
                    <SelectTrigger className="w-48" id="doc-type-select"><SelectValue placeholder="Document type" /></SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label>
                    <input type="file" className="hidden" onChange={(e) => {
                      const sel = (document.getElementById("doc-type-select") as HTMLButtonElement)?.textContent || "other";
                      const docType = DOC_TYPES.find(t => t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) === sel) || "other";
                      handleUpload(e, docType);
                    }} />
                    <Button variant="outline" size="sm" asChild>
                      <span><Upload className="h-3 w-3 mr-1" /> Upload</span>
                    </Button>
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!documents?.length ? (
                <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-muted/20">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{d.file_name}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{d.document_type?.replace(/_/g, " ")} · {format(new Date(d.created_at), "d MMM yyyy HH:mm")}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{d.file_size ? `${Math.round(d.file_size / 1024)} KB` : ""}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline" className="space-y-4">
          <Card className="glass">
            <CardHeader><CardTitle className="text-sm">Add Note</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} placeholder="Add a timeline note..." />
              <Button size="sm" onClick={handleAddNote} disabled={!noteText.trim()}>Add Note</Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {(activities || []).map((a: any) => (
              <div key={a.id} className="flex gap-3 p-3 rounded-lg border border-border/50 bg-card/50">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  {a.action_type === "status_change" ? <RefreshCw className="h-3.5 w-3.5" /> :
                   a.action_type === "document_uploaded" ? <Upload className="h-3.5 w-3.5" /> :
                   <MessageSquare className="h-3.5 w-3.5" />}
                </div>
                <div>
                  <p className="text-sm">{a.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(a.created_at), "d MMM yyyy HH:mm")}</p>
                </div>
              </div>
            ))}
            {!activities?.length && (
              <p className="text-sm text-muted-foreground text-center py-8">No activity yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
