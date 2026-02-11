import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCustomer, useUpdateCustomer } from "@/hooks/useCustomers";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: customer, isLoading } = useCustomer(id);
  const update = useUpdateCustomer();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const startEdit = () => {
    if (customer) {
      setForm({ ...customer });
      setEditing(true);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      const { id: _, dealer_id, created_at, updated_at, is_deleted, deleted_at, ...updates } = form;
      await update.mutateAsync({ id, ...updates });
      toast.success("Customer updated");
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  if (isLoading) {
    return <div className="h-40 rounded-xl bg-muted/30 animate-pulse" />;
  }

  if (!customer) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Customer not found</p>
        <Button variant="outline" onClick={() => navigate("/app/customers")} className="mt-4">Back</Button>
      </div>
    );
  }

  const c = editing ? form : customer;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/customers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{customer.first_name} {customer.last_name}</h1>
            <p className="text-xs text-muted-foreground">
              Added {format(new Date(customer.created_at), "d MMM yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={update.isPending}>
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={startEdit}>Edit</Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Contact card */}
            <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-3">
              <h3 className="text-sm font-semibold">Contact</h3>
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">First Name</Label>
                    <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Last Name</Label>
                    <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Preferred Contact</Label>
                    <Select value={form.preferred_contact_method || "phone"} onValueChange={(v) => setForm({ ...form, preferred_contact_method: v })}>
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
              ) : (
                <div className="space-y-2">
                  {c.phone && <p className="flex items-center gap-2 text-sm"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {c.phone}</p>}
                  {c.email && <p className="flex items-center gap-2 text-sm"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {c.email}</p>}
                  {(c.city || c.postcode) && <p className="flex items-center gap-2 text-sm"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {[c.city, c.postcode].filter(Boolean).join(", ")}</p>}
                  <p className="text-xs text-muted-foreground mt-2">Preferred: {c.preferred_contact_method || "Phone"}</p>
                </div>
              )}
            </div>

            {/* Address card */}
            <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-3">
              <h3 className="text-sm font-semibold">Address</h3>
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Line 1</Label>
                    <Input value={form.address_line1 || ""} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Line 2</Label>
                    <Input value={form.address_line2 || ""} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">City</Label>
                    <Input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Postcode</Label>
                    <Input value={form.postcode || ""} onChange={(e) => setForm({ ...form, postcode: e.target.value })} className="mt-1" />
                  </div>
                </div>
              ) : (
                <div className="text-sm space-y-1">
                  {c.address_line1 && <p>{c.address_line1}</p>}
                  {c.address_line2 && <p>{c.address_line2}</p>}
                  {c.city && <p>{c.city}</p>}
                  {c.postcode && <p>{c.postcode}</p>}
                  {!c.address_line1 && !c.city && <p className="text-muted-foreground">No address on file</p>}
                </div>
              )}
            </div>

            {/* Consent & Notes */}
            <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-3">
              <h3 className="text-sm font-semibold">Consent & Notes</h3>
              {editing ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={form.consent_marketing} onCheckedChange={(v) => setForm({ ...form, consent_marketing: !!v })} />
                    <Label className="text-xs">Marketing consent</Label>
                  </div>
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" rows={4} />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className={`text-xs px-2 py-1 rounded-full inline-block ${c.consent_marketing ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {c.consent_marketing ? "Marketing: Opted in" : "Marketing: No consent"}
                  </p>
                  {c.notes ? <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.notes}</p> : <p className="text-xs text-muted-foreground">No notes</p>}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <div className="p-6 rounded-xl border border-border/50 bg-card/50">
            <p className="text-sm text-muted-foreground text-center py-8">
              Communication timeline will be built in the next phase.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
