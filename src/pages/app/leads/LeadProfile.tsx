import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Phone, Mail, MessageSquare, Calendar, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLead, useUpdateLead, useLeadActivities, useAddLeadActivity, useLeadAppointments, useCreateLeadAppointment, STAGE_ORDER, STAGE_LABELS, SOURCE_LABELS } from "@/hooks/useLeads";
import { useUserDealerId } from "@/hooks/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const stageColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-500", contacted: "bg-yellow-500/10 text-yellow-500",
  appointment_set: "bg-indigo-500/10 text-indigo-500", test_drive: "bg-cyan-500/10 text-cyan-500",
  finance: "bg-violet-500/10 text-violet-500", negotiating: "bg-orange-500/10 text-orange-500",
  reserved: "bg-emerald-500/10 text-emerald-500", sold: "bg-green-600/10 text-green-600",
  lost: "bg-destructive/10 text-destructive",
};

const activityIcons: Record<string, any> = {
  note: MessageSquare, call: Phone, email: Mail, stage_change: ChevronRight,
  appointment: Calendar, whatsapp: MessageSquare, test_drive: Calendar, assignment: ChevronRight,
};

export default function LeadProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: lead, isLoading } = useLead(id);
  const { data: activities } = useLeadActivities(id);
  const { data: appointments } = useLeadAppointments(id);
  const updateMutation = useUpdateLead();
  const addActivity = useAddLeadActivity();
  const createAppointment = useCreateLeadAppointment();
  const { data: dealerId } = useUserDealerId();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("note");
  const [lostReason, setLostReason] = useState("");
  const [showLost, setShowLost] = useState(false);
  const [apptForm, setApptForm] = useState({ type: "viewing", starts_at: "", notes: "" });
  const [showAppt, setShowAppt] = useState(false);

  const startEdit = () => { if (lead) { setForm({ ...lead }); setEditing(true); } };

  const handleSave = async () => {
    if (!id) return;
    try {
      const { id: _, dealer_id, created_at, updated_at, vehicles, customers, lead_number, ...updates } = form;
      await updateMutation.mutateAsync({ id, ...updates });
      toast.success("Lead updated");
      setEditing(false);
    } catch (err: any) { toast.error(err.message || "Failed to update"); }
  };

  const changeStage = async (newStage: string) => {
    if (!id || !lead || !dealerId) return;
    const oldStage = (lead as any).stage;
    if (newStage === "lost") { setShowLost(true); return; }
    const statusMap: Record<string, string> = { sold: "won", lost: "lost" };
    try {
      await updateMutation.mutateAsync({
        id, stage: newStage, status: statusMap[newStage] || "new",
      });
      await addActivity.mutateAsync({
        dealer_id: dealerId, lead_id: id, created_by_user_id: user?.id,
        type: "stage_change", old_stage: oldStage, new_stage: newStage,
        message: `Stage: ${STAGE_LABELS[oldStage] || oldStage} → ${STAGE_LABELS[newStage] || newStage}`,
      });
      toast.success(`Stage updated to ${STAGE_LABELS[newStage]}`);
      if (newStage === "sold") {
        toast.info("Lead marked as Sold! You can now create an invoice.", { action: { label: "Create Invoice", onClick: () => navigate("/app/invoices/new") } });
      }
    } catch { toast.error("Failed to change stage"); }
  };

  const handleMarkLost = async () => {
    if (!id || !dealerId) return;
    try {
      await updateMutation.mutateAsync({ id, stage: "lost", status: "lost", lost_reason: lostReason });
      await addActivity.mutateAsync({
        dealer_id: dealerId, lead_id: id, created_by_user_id: user?.id,
        type: "stage_change", old_stage: (lead as any)?.stage, new_stage: "lost",
        message: `Lead lost. Reason: ${lostReason || "Not specified"}`,
      });
      setShowLost(false);
      toast.success("Lead marked as lost");
    } catch { toast.error("Failed"); }
  };

  const addNote = async () => {
    if (!noteText.trim() || !id || !dealerId) return;
    try {
      await addActivity.mutateAsync({
        dealer_id: dealerId, lead_id: id, created_by_user_id: user?.id,
        type: noteType, message: noteText,
      });
      if (noteType === "call" || noteType === "email" || noteType === "whatsapp") {
        await updateMutation.mutateAsync({ id, last_contacted_at: new Date().toISOString() });
      }
      setNoteText(""); toast.success("Activity logged");
    } catch { toast.error("Failed to add activity"); }
  };

  const addAppointment = async () => {
    if (!apptForm.starts_at || !id || !dealerId) return;
    try {
      await createAppointment.mutateAsync({
        dealer_id: dealerId, lead_id: id, appointment_type: apptForm.type,
        starts_at: apptForm.starts_at, notes: apptForm.notes || null,
      });
      await addActivity.mutateAsync({
        dealer_id: dealerId, lead_id: id, created_by_user_id: user?.id,
        type: "appointment", message: `${apptForm.type.replace(/_/g, " ")} scheduled for ${format(new Date(apptForm.starts_at), "d MMM yyyy HH:mm")}`,
      });
      setShowAppt(false); setApptForm({ type: "viewing", starts_at: "", notes: "" });
      toast.success("Appointment created");
    } catch { toast.error("Failed"); }
  };

  if (isLoading) return <div className="h-40 rounded-xl bg-muted/30 animate-pulse" />;
  if (!lead) return <div className="text-center py-20"><p className="text-muted-foreground">Lead not found</p><Button variant="outline" onClick={() => navigate("/app/leads")} className="mt-4">Back</Button></div>;

  const l: any = editing ? form : lead;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/leads")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{lead.first_name} {lead.last_name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full ${stageColors[l.stage] || ""}`}>{STAGE_LABELS[l.stage] || l.stage}</span>
            </div>
            <p className="text-xs text-muted-foreground">{(lead as any).lead_number} · Created {format(new Date(lead.created_at), "d MMM yyyy")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}><Save className="h-4 w-4 mr-1" />Save</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={startEdit}>Edit</Button>
          )}
        </div>
      </div>

      {/* Stage pipeline */}
      {!editing && (
        <div className="flex gap-1 overflow-x-auto mb-6">
          {STAGE_ORDER.map(stage => (
            <Button key={stage} size="sm" variant={l.stage === stage ? "default" : "outline"}
              className="text-xs whitespace-nowrap" onClick={() => changeStage(stage)}>
              {STAGE_LABELS[stage]}
            </Button>
          ))}
        </div>
      )}

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          {/* Add activity */}
          <div className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-3">
            <div className="flex gap-2">
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
              <Input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add activity..." className="flex-1" onKeyDown={e => e.key === "Enter" && addNote()} />
              <Button onClick={addNote} disabled={!noteText.trim()}>Add</Button>
              <Button variant="outline" onClick={() => setShowAppt(true)}><Calendar className="h-4 w-4 mr-1" />Appt</Button>
            </div>
          </div>

          {/* Activity feed */}
          <div className="space-y-2">
            {activities?.map((act: any) => {
              const Icon = activityIcons[act.type] || MessageSquare;
              return (
                <div key={act.id} className="flex gap-3 p-3 rounded-lg border border-border/30 bg-card/30">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{act.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(act.occurred_at), "d MMM yyyy HH:mm")} · {act.type.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              );
            })}
            {!activities?.length && <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>}
          </div>
        </TabsContent>

        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-3">
              <h3 className="text-sm font-semibold">Contact</h3>
              {editing ? (
                <div className="space-y-3">
                  {["first_name", "last_name", "phone", "email"].map(field => (
                    <div key={field}>
                      <Label className="text-xs capitalize">{field.replace("_", " ")}</Label>
                      <Input value={form[field] || ""} onChange={e => setForm({ ...form, [field]: e.target.value })} className="mt-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-muted-foreground">Phone:</span> {l.phone || "—"}</p>
                  <p><span className="text-muted-foreground">Email:</span> {l.email || "—"}</p>
                  {l.customers && <p><span className="text-muted-foreground">Linked customer:</span> {(l.customers as any).first_name} {(l.customers as any).last_name}</p>}
                </div>
              )}
            </div>

            <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-3">
              <h3 className="text-sm font-semibold">Lead Details</h3>
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Source</Label>
                    <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["walk_in","phone","website","autotrader","ebay","facebook","referral","other"].map(s =>
                          <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Vehicle Interest</Label><Input value={form.vehicle_interest_text || ""} onChange={e => setForm({ ...form, vehicle_interest_text: e.target.value })} className="mt-1" /></div>
                  <div><Label className="text-xs">Estimated Value (£)</Label><Input type="number" value={form.estimated_value || ""} onChange={e => setForm({ ...form, estimated_value: e.target.value ? parseFloat(e.target.value) : null })} className="mt-1" /></div>
                  <div><Label className="text-xs">Next Action</Label><Input type="datetime-local" value={form.next_action_at ? form.next_action_at.slice(0, 16) : ""} onChange={e => setForm({ ...form, next_action_at: e.target.value })} className="mt-1" /></div>
                </div>
              ) : (
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-muted-foreground">Source:</span> {SOURCE_LABELS[l.source] || l.source}</p>
                  <p><span className="text-muted-foreground">Vehicle:</span> {l.vehicles ? `${(l.vehicles as any).vrm} – ${(l.vehicles as any).make} ${(l.vehicles as any).model}` : l.vehicle_interest_text || "—"}</p>
                  <p><span className="text-muted-foreground">Value:</span> {l.estimated_value ? `£${Number(l.estimated_value).toLocaleString()}` : "—"}</p>
                  <p><span className="text-muted-foreground">Finance:</span> {l.finance_required ? "Yes" : "No"}</p>
                  {l.budget_min && <p><span className="text-muted-foreground">Budget:</span> £{Number(l.budget_min).toLocaleString()} – £{Number(l.budget_max || 0).toLocaleString()}</p>}
                  <p><span className="text-muted-foreground">Next action:</span> {l.next_action_at ? format(new Date(l.next_action_at), "d MMM yyyy HH:mm") : "—"}</p>
                </div>
              )}
            </div>

            <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-3">
              <h3 className="text-sm font-semibold">Notes</h3>
              {editing ? (
                <Textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={6} />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{l.notes || "No notes"}</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Button onClick={() => setShowAppt(true)}><Calendar className="h-4 w-4 mr-1" />Add Appointment</Button>
          <div className="space-y-2">
            {appointments?.map((appt: any) => (
              <div key={appt.id} className="p-4 rounded-xl border border-border/50 bg-card/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium capitalize">{appt.appointment_type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(appt.starts_at), "d MMM yyyy HH:mm")}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${appt.status === "completed" ? "bg-green-500/10 text-green-500" : appt.status === "no_show" ? "bg-destructive/10 text-destructive" : "bg-blue-500/10 text-blue-500"}`}>
                    {appt.status}
                  </span>
                </div>
                {appt.notes && <p className="text-xs text-muted-foreground mt-2">{appt.notes}</p>}
              </div>
            ))}
            {!appointments?.length && <p className="text-sm text-muted-foreground text-center py-8">No appointments</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Lost reason dialog */}
      <Dialog open={showLost} onOpenChange={setShowLost}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark Lead as Lost</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason</Label>
              <Select value={lostReason} onValueChange={setLostReason}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="vehicle_sold">Vehicle Sold</SelectItem>
                  <SelectItem value="changed_mind">Changed Mind</SelectItem>
                  <SelectItem value="no_contact">No Contact</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleMarkLost} className="w-full" variant="destructive">Mark as Lost</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment dialog */}
      <Dialog open={showAppt} onOpenChange={setShowAppt}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Appointment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={apptForm.type} onValueChange={v => setApptForm({ ...apptForm, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewing">Viewing</SelectItem>
                  <SelectItem value="test_drive">Test Drive</SelectItem>
                  <SelectItem value="callback">Callback</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Date & Time</Label><Input type="datetime-local" value={apptForm.starts_at} onChange={e => setApptForm({ ...apptForm, starts_at: e.target.value })} className="mt-1" /></div>
            <div><Label>Notes</Label><Textarea value={apptForm.notes} onChange={e => setApptForm({ ...apptForm, notes: e.target.value })} className="mt-1" rows={2} /></div>
            <Button onClick={addAppointment} className="w-full">Create Appointment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
