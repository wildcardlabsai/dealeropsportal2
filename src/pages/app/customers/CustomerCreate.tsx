import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCustomer } from "@/hooks/useCustomers";
import { useUserDealerId } from "@/hooks/useCustomers";
import { toast } from "sonner";

export default function CustomerCreate() {
  const navigate = useNavigate();
  const create = useCreateCustomer();
  const { data: dealerId } = useUserDealerId();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    address_line1: "",
    address_line2: "",
    city: "",
    postcode: "",
    preferred_contact_method: "phone" as const,
    consent_marketing: false,
    notes: "",
  });

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId) {
      toast.error("No dealer account linked. Contact your administrator.");
      return;
    }
    try {
      await create.mutateAsync({
        ...form,
        dealer_id: dealerId,
        consent_marketing_at: form.consent_marketing ? new Date().toISOString() : null,
      });
      toast.success("Customer created");
      navigate("/app/customers");
    } catch (err: any) {
      toast.error(err.message || "Failed to create customer");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/customers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Customer</h1>
          <p className="text-sm text-muted-foreground">Add a customer to your database</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Personal Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">First Name *</Label>
              <Input value={form.first_name} onChange={(e) => update("first_name", e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Last Name *</Label>
              <Input value={form.last_name} onChange={(e) => update("last_name", e.target.value)} required className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Preferred Contact</Label>
            <Select value={form.preferred_contact_method} onValueChange={(v) => update("preferred_contact_method", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="post">Post</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Address</h3>
          <div>
            <Label className="text-xs">Address Line 1</Label>
            <Input value={form.address_line1} onChange={(e) => update("address_line1", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Address Line 2</Label>
            <Input value={form.address_line2} onChange={(e) => update("address_line2", e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">City</Label>
              <Input value={form.city} onChange={(e) => update("city", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Postcode</Label>
              <Input value={form.postcode} onChange={(e) => update("postcode", e.target.value)} className="mt-1" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Other</h3>
          <div className="flex items-center gap-2">
            <Checkbox
              id="consent"
              checked={form.consent_marketing}
              onCheckedChange={(v) => update("consent_marketing", !!v)}
            />
            <Label htmlFor="consent" className="text-xs">Customer consents to marketing communications</Label>
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} className="mt-1" rows={3} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Saving..." : "Create Customer"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/app/customers")}>
            Cancel
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
