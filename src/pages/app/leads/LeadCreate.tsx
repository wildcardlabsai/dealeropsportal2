import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateLead, useAddLeadActivity } from "@/hooks/useLeads";
import { useUserDealerId } from "@/hooks/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function LeadCreate() {
  const navigate = useNavigate();
  const create = useCreateLead();
  const addActivity = useAddLeadActivity();
  const { data: dealerId } = useUserDealerId();
  const { user } = useAuth();
  const [form, setForm] = useState({
    first_name: "", last_name: "", phone: "", email: "",
    source: "walk_in", estimated_value: "", notes: "",
    vehicle_interest_text: "", finance_required: false,
    budget_min: "", budget_max: "", next_action_at: "",
  });

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId) { toast.error("No dealer account linked"); return; }
    try {
      const lead = await create.mutateAsync({
        dealer_id: dealerId,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone || null,
        email: form.email || null,
        source: form.source,
        status: "new",
        stage: "new",
        estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : null,
        notes: form.notes || null,
        vehicle_interest_text: form.vehicle_interest_text || null,
        finance_required: form.finance_required,
        budget_min: form.budget_min ? parseFloat(form.budget_min) : null,
        budget_max: form.budget_max ? parseFloat(form.budget_max) : null,
        next_action_at: form.next_action_at || null,
        created_by_user_id: user?.id || null,
      });
      await addActivity.mutateAsync({
        dealer_id: dealerId, lead_id: lead.id,
        created_by_user_id: user?.id, type: "note",
        message: "Lead created",
      });
      toast.success("Lead created");
      navigate("/app/leads");
    } catch (err: any) { toast.error(err.message || "Failed to create lead"); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/leads")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">New Lead</h1>
          <p className="text-sm text-muted-foreground">Add a new enquiry to your pipeline</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Contact Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label className="text-xs">First Name *</Label><Input value={form.first_name} onChange={e => update("first_name", e.target.value)} required className="mt-1" /></div>
            <div><Label className="text-xs">Last Name *</Label><Input value={form.last_name} onChange={e => update("last_name", e.target.value)} required className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => update("phone", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => update("email", e.target.value)} className="mt-1" /></div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Lead Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Source</Label>
              <Select value={form.source} onValueChange={v => update("source", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["walk_in","phone","website","autotrader","ebay","facebook","referral","other"].map(s =>
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Estimated Value (£)</Label><Input type="number" step="0.01" value={form.estimated_value} onChange={e => update("estimated_value", e.target.value)} className="mt-1" /></div>
          </div>
          <div>
            <Label className="text-xs">Vehicle Interest</Label>
            <Input value={form.vehicle_interest_text} onChange={e => update("vehicle_interest_text", e.target.value)} placeholder="e.g. BMW 3 Series, white, 2020+" className="mt-1" />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.finance_required} onCheckedChange={v => update("finance_required", v)} />
            <Label className="text-xs">Finance Required</Label>
          </div>
          {form.finance_required && (
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Budget Min (£)</Label><Input type="number" value={form.budget_min} onChange={e => update("budget_min", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Budget Max (£)</Label><Input type="number" value={form.budget_max} onChange={e => update("budget_max", e.target.value)} className="mt-1" /></div>
            </div>
          )}
          <div>
            <Label className="text-xs">Next Action Date</Label>
            <Input type="datetime-local" value={form.next_action_at} onChange={e => update("next_action_at", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} className="mt-1" rows={3} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving..." : "Create Lead"}</Button>
          <Button type="button" variant="outline" onClick={() => navigate("/app/leads")}>Cancel</Button>
        </div>
      </form>
    </motion.div>
  );
}
