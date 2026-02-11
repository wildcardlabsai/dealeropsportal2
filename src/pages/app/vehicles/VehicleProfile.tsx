import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVehicle, useUpdateVehicle } from "@/hooks/useVehicles";
import { toast } from "sonner";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  in_stock: "bg-success/10 text-success",
  reserved: "bg-warning/10 text-warning",
  sold: "bg-primary/10 text-primary",
  in_repair: "bg-destructive/10 text-destructive",
  returned: "bg-muted text-muted-foreground",
};

export default function VehicleProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: vehicle, isLoading } = useVehicle(id);
  const updateMutation = useUpdateVehicle();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const startEdit = () => { if (vehicle) { setForm({ ...vehicle }); setEditing(true); } };

  const handleSave = async () => {
    if (!id) return;
    try {
      const { id: _, dealer_id, created_at, updated_at, is_deleted, deleted_at, customers, ...updates } = form;
      await updateMutation.mutateAsync({ id, ...updates });
      toast.success("Vehicle updated");
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  if (isLoading) return <div className="h-40 rounded-xl bg-muted/30 animate-pulse" />;
  if (!vehicle) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground">Vehicle not found</p>
      <Button variant="outline" onClick={() => navigate("/app/vehicles")} className="mt-4">Back</Button>
    </div>
  );

  const v = editing ? form : vehicle;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/vehicles")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{vehicle.vrm || "No VRM"}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[vehicle.status]}`}>
                {vehicle.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
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
          <TabsTrigger value="checks">DVLA / MOT</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-3">
              <h3 className="text-sm font-semibold">Identity</h3>
              {editing ? (
                <div className="space-y-3">
                  {["vrm", "vin", "make", "model", "derivative"].map((field) => (
                    <div key={field}>
                      <Label className="text-xs capitalize">{field.replace("_", " ")}</Label>
                      <Input value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="mt-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-muted-foreground">VRM:</span> <span className="font-mono font-medium text-primary">{v.vrm || "—"}</span></p>
                  <p><span className="text-muted-foreground">VIN:</span> <span className="font-mono">{v.vin || "—"}</span></p>
                  <p><span className="text-muted-foreground">Make:</span> {v.make || "—"}</p>
                  <p><span className="text-muted-foreground">Model:</span> {v.model || "—"}</p>
                  <p><span className="text-muted-foreground">Derivative:</span> {v.derivative || "—"}</p>
                </div>
              )}
            </div>

            <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-3">
              <h3 className="text-sm font-semibold">Specs</h3>
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Year</Label>
                    <Input type="number" value={form.year || ""} onChange={(e) => setForm({ ...form, year: e.target.value ? parseInt(e.target.value) : null })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Mileage</Label>
                    <Input type="number" value={form.mileage || ""} onChange={(e) => setForm({ ...form, mileage: e.target.value ? parseInt(e.target.value) : null })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Colour</Label>
                    <Input value={form.colour || ""} onChange={(e) => setForm({ ...form, colour: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Fuel</Label>
                    <Select value={form.fuel_type || "petrol"} onValueChange={(v) => setForm({ ...form, fuel_type: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["petrol","diesel","electric","hybrid","plug_in_hybrid","other"].map(f => (
                          <SelectItem key={f} value={f}>{f.replace("_"," ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Transmission</Label>
                    <Select value={form.transmission || "manual"} onValueChange={(v) => setForm({ ...form, transmission: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["manual","automatic","other"].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-muted-foreground">Year:</span> {v.year || "—"}</p>
                  <p><span className="text-muted-foreground">Mileage:</span> {v.mileage ? v.mileage.toLocaleString() : "—"}</p>
                  <p><span className="text-muted-foreground">Colour:</span> {v.colour || "—"}</p>
                  <p><span className="text-muted-foreground">Fuel:</span> {v.fuel_type?.replace("_"," ") || "—"}</p>
                  <p><span className="text-muted-foreground">Transmission:</span> {v.transmission || "—"}</p>
                </div>
              )}
            </div>

            <div className="p-5 rounded-xl border border-border/50 bg-card/50 space-y-3">
              <h3 className="text-sm font-semibold">Pricing</h3>
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Purchase Price (£)</Label>
                    <Input type="number" step="0.01" value={form.purchase_price || ""} onChange={(e) => setForm({ ...form, purchase_price: e.target.value ? parseFloat(e.target.value) : null })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Advertised Price (£)</Label>
                    <Input type="number" step="0.01" value={form.advertised_price || ""} onChange={(e) => setForm({ ...form, advertised_price: e.target.value ? parseFloat(e.target.value) : null })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["in_stock","reserved","sold","in_repair","returned"].map(s => (
                          <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Notes</Label>
                    <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" rows={3} />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-muted-foreground">Purchase:</span> {v.purchase_price ? `£${Number(v.purchase_price).toLocaleString()}` : "—"}</p>
                  <p><span className="text-muted-foreground">Advertised:</span> {v.advertised_price ? `£${Number(v.advertised_price).toLocaleString()}` : "—"}</p>
                  {v.purchase_price && v.advertised_price && (
                    <p><span className="text-muted-foreground">Margin:</span> <span className="text-success">£{(Number(v.advertised_price) - Number(v.purchase_price)).toLocaleString()}</span></p>
                  )}
                  {v.notes && <p className="text-muted-foreground text-xs mt-2 whitespace-pre-wrap">{v.notes}</p>}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="checks">
          <div className="p-6 rounded-xl border border-border/50 bg-card/50 text-center">
            <Car className="h-8 w-8 text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Run a vehicle check from the{" "}
              <Button variant="link" className="p-0 h-auto text-primary" onClick={() => navigate("/app/checks")}>
                Vehicle Checks
              </Button>{" "}
              module using this vehicle's VRM.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="p-6 rounded-xl border border-border/50 bg-card/50 text-center py-10">
            <p className="text-sm text-muted-foreground">Vehicle history timeline coming in the next phase.</p>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
