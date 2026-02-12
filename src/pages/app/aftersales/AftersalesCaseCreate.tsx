import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateAftersalesCase, useCreateAftersalesUpdate } from "@/hooks/useAftersalesCases";
import { useUserDealerId, useCustomers } from "@/hooks/useCustomers";
import { useVehicles } from "@/hooks/useVehicles";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const issueCategories = [
  "Engine / Mechanical", "Electrical", "Bodywork / Paint", "Interior",
  "Gearbox / Transmission", "Brakes", "Suspension", "Tyres / Wheels",
  "Emissions / DPF", "Cooling System", "Warranty Claim", "Customer Complaint", "Other",
];

export default function AftersalesCaseCreate() {
  const navigate = useNavigate();
  const create = useCreateAftersalesCase();
  const createUpdate = useCreateAftersalesUpdate();
  const { data: dealerId } = useUserDealerId();
  const { user } = useAuth();
  const { data: customers } = useCustomers();
  const { data: vehicles } = useVehicles();

  const [form, setForm] = useState({
    summary: "",
    description: "",
    issue_category: "",
    issue_subcategory: "",
    priority: "medium",
    customer_id: "",
    vehicle_id: "",
    complaint_date: new Date().toISOString().split("T")[0],
    internal_notes: "",
    sla_target_hours: "72",
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId || !user) { toast.error("No dealer account linked"); return; }
    if (!form.issue_category) { toast.error("Issue category is required"); return; }

    try {
      const result = await create.mutateAsync({
        dealer_id: dealerId,
        created_by_user_id: user.id,
        summary: form.summary,
        description: form.description,
        issue_category: form.issue_category,
        issue_subcategory: form.issue_subcategory || null,
        priority: form.priority,
        customer_id: form.customer_id || null,
        vehicle_id: form.vehicle_id || null,
        complaint_date: form.complaint_date,
        internal_notes: form.internal_notes || null,
        sla_target_hours: parseInt(form.sla_target_hours) || 72,
        case_number: "", // trigger will generate
      });

      // Create initial timeline entry
      await createUpdate.mutateAsync({
        dealer_id: dealerId,
        case_id: (result as any).id,
        created_by_user_id: user.id,
        update_type: "note",
        message: "Case created",
      });

      toast.success("Case created successfully");
      navigate("/app/aftersales");
    } catch (err: any) {
      toast.error(err.message || "Failed to create case");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/aftersales")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Aftersales Case</h1>
          <p className="text-sm text-muted-foreground">Log a complaint, repair, or warranty issue</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Case Details */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Case Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="text-xs">Summary *</Label>
              <Input value={form.summary} onChange={(e) => update("summary", e.target.value)} required className="mt-1" placeholder="Brief description of the issue" />
            </div>
            <div>
              <Label className="text-xs">Issue Category *</Label>
              <Select value={form.issue_category} onValueChange={(v) => update("issue_category", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {issueCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => update("priority", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Complaint Date</Label>
              <Input type="date" value={form.complaint_date} onChange={(e) => update("complaint_date", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">SLA Target (hours)</Label>
              <Input type="number" value={form.sla_target_hours} onChange={(e) => update("sla_target_hours", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Full Description *</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} required className="mt-1" rows={4} placeholder="Detailed description of the issue..." />
          </div>
        </div>

        {/* Linked Records */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Linked Records</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Customer</Label>
              <Select value={form.customer_id} onValueChange={(v) => update("customer_id", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Vehicle</Label>
              <Select value={form.vehicle_id} onValueChange={(v) => update("vehicle_id", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.vrm} — {v.make} {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Internal Notes */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Internal Notes</h3>
          <Textarea value={form.internal_notes} onChange={(e) => update("internal_notes", e.target.value)} rows={3} placeholder="Notes for internal use only..." />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={create.isPending} className="glow">
            {create.isPending ? "Creating..." : "Create Case"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/app/aftersales")}>Cancel</Button>
        </div>
      </form>
    </motion.div>
  );
}
