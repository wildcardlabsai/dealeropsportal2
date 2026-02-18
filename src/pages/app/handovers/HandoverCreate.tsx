import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpPopover } from "@/components/HelpPopover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateHandover, useCreateHandoverItems, useHandoverTemplates } from "@/hooks/useHandovers";
import { useCustomers, useUserDealerId } from "@/hooks/useCustomers";
import { useVehicles } from "@/hooks/useVehicles";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function HandoverCreate() {
  const navigate = useNavigate();
  const createHandover = useCreateHandover();
  const createItems = useCreateHandoverItems();
  const { data: dealerId } = useUserDealerId();
  const { user } = useAuth();
  const { data: customers } = useCustomers();
  const { data: vehicles } = useVehicles();
  const { data: templates } = useHandoverTemplates();

  const [form, setForm] = useState({
    customer_id: "", vehicle_id: "", delivery_type: "collection",
    delivery_address: "", scheduled_delivery_at: "", notes: "",
    mileage_at_handover: "", fuel_level: "full", keys_count: "2",
    template_id: "", salesman_name: "",
  });

  const update = (f: string, v: any) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId || !form.customer_id || !form.vehicle_id) {
      toast.error("Please select a customer and vehicle"); return;
    }
    try {
      const handover = await createHandover.mutateAsync({
        dealer_id: dealerId,
        customer_id: form.customer_id,
        vehicle_id: form.vehicle_id,
        delivery_type: form.delivery_type,
        delivery_address: form.delivery_address || null,
        scheduled_delivery_at: form.scheduled_delivery_at || null,
        notes: form.notes || null,
        mileage_at_handover: form.mileage_at_handover ? parseFloat(form.mileage_at_handover) : null,
        fuel_level: form.fuel_level || null,
        keys_count: parseInt(form.keys_count) || 2,
        staff_user_id: user?.id || null,
        salesman_name: form.salesman_name || null,
        status: "in_progress",
      });

      // Create checklist items from template
      const selectedTemplate = templates?.find((t: any) => t.id === form.template_id) || templates?.find((t: any) => t.is_default);
      if (selectedTemplate) {
        const itemsJson = selectedTemplate.items_json as any[];
        const items: any[] = [];
        itemsJson.forEach((section: any) => {
          (section.items || []).forEach((itemLabel: string) => {
            items.push({
              dealer_id: dealerId,
              handover_id: handover.id,
              section: section.section,
              item_label: itemLabel,
              completed: false,
            });
          });
        });
        if (items.length) await createItems.mutateAsync(items);
      }

      toast.success("Handover created");
      navigate(`/app/handovers/${handover.id}`);
    } catch (err: any) { toast.error(err.message || "Failed to create handover"); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/handovers")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">New Handover</h1>
            <HelpPopover
              title="Vehicle Handovers"
              articleId="handovers-overview"
              body={
                <span>
                  A completed handover documents that the vehicle was delivered in agreed condition.<br /><br />
                  <strong>Customer signature</strong> is the strongest evidence in any future CRA or aftersales claim.<br /><br />
                  <strong>No signature?</strong> Use "Complete (No Sig)" for internal or remote handovers — the record is still kept.
                </span>
              }
            />
          </div>
          <p className="text-sm text-muted-foreground">Create a vehicle handover pack</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Customer & Vehicle</h3>
          <div>
            <Label className="text-xs">Customer *</Label>
            <Select value={form.customer_id} onValueChange={v => update("customer_id", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Vehicle *</Label>
            <Select value={form.vehicle_id} onValueChange={v => update("vehicle_id", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
              <SelectContent>
                {vehicles?.map((v: any) => (
                  <SelectItem key={v.id} value={v.id}>{v.vrm} – {v.make} {v.model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Delivery Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Delivery Type</Label>
              <Select value={form.delivery_type} onValueChange={v => update("delivery_type", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="collection">Collection</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Scheduled Date/Time</Label>
              <Input type="datetime-local" value={form.scheduled_delivery_at} onChange={e => update("scheduled_delivery_at", e.target.value)} className="mt-1" />
            </div>
          </div>
          {form.delivery_type === "delivery" && (
            <div><Label className="text-xs">Delivery Address</Label><Textarea value={form.delivery_address} onChange={e => update("delivery_address", e.target.value)} className="mt-1" rows={2} /></div>
          )}
        </div>

        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Vehicle Condition at Handover</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><Label className="text-xs">Mileage</Label><Input type="number" value={form.mileage_at_handover} onChange={e => update("mileage_at_handover", e.target.value)} className="mt-1" /></div>
            <div>
              <Label className="text-xs">Fuel Level</Label>
              <Select value={form.fuel_level} onValueChange={v => update("fuel_level", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["empty","quarter","half","three_quarters","full"].map(f => <SelectItem key={f} value={f}>{f.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Keys Count</Label><Input type="number" value={form.keys_count} onChange={e => update("keys_count", e.target.value)} className="mt-1" /></div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Checklist Template</h3>
          <Select value={form.template_id} onValueChange={v => update("template_id", v)}>
            <SelectTrigger><SelectValue placeholder="Use default template" /></SelectTrigger>
            <SelectContent>
              {templates?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name} {t.is_default ? "(Default)" : ""}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Salesman</h3>
          <div>
            <Label className="text-xs">Salesman Name</Label>
            <Input value={form.salesman_name} onChange={e => update("salesman_name", e.target.value)} placeholder="Enter salesman name" className="mt-1" />
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Notes</h3>
          <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={3} />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={createHandover.isPending}>{createHandover.isPending ? "Creating..." : "Create Handover"}</Button>
          <Button type="button" variant="outline" onClick={() => navigate("/app/handovers")}>Cancel</Button>
        </div>
      </form>
    </motion.div>
  );
}
