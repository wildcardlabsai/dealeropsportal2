import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateVehicle } from "@/hooks/useVehicles";
import { useUserDealerId } from "@/hooks/useCustomers";
import { toast } from "sonner";

export default function VehicleCreate() {
  const navigate = useNavigate();
  const create = useCreateVehicle();
  const { data: dealerId } = useUserDealerId();
  const [form, setForm] = useState({
    vrm: "", vin: "", make: "", model: "", derivative: "",
    year: "", mileage: "", fuel_type: "petrol" as const,
    transmission: "manual" as const, colour: "",
    purchase_date: "", purchase_price: "", advertised_price: "",
    status: "in_stock" as const, location: "on_site" as const, notes: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId) { toast.error("No dealer account linked"); return; }
    try {
      await create.mutateAsync({
        dealer_id: dealerId,
        vrm: form.vrm || null,
        vin: form.vin || null,
        make: form.make || null,
        model: form.model || null,
        derivative: form.derivative || null,
        year: form.year ? parseInt(form.year) : null,
        mileage: form.mileage ? parseInt(form.mileage) : null,
        fuel_type: form.fuel_type,
        transmission: form.transmission,
        colour: form.colour || null,
        purchase_date: form.purchase_date || null,
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
        advertised_price: form.advertised_price ? parseFloat(form.advertised_price) : null,
        status: form.status,
        location: form.location,
        notes: form.notes || null,
      });
      toast.success("Vehicle added");
      navigate("/app/vehicles");
    } catch (err: any) {
      toast.error(err.message || "Failed to add vehicle");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/vehicles")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Vehicle</h1>
          <p className="text-sm text-muted-foreground">Add a vehicle to your stock</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Identity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Registration (VRM)</Label>
              <Input value={form.vrm} onChange={(e) => update("vrm", e.target.value.toUpperCase())} className="mt-1 font-mono" placeholder="AB12 CDE" />
            </div>
            <div>
              <Label className="text-xs">VIN (optional)</Label>
              <Input value={form.vin} onChange={(e) => update("vin", e.target.value)} className="mt-1 font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Make</Label>
              <Input value={form.make} onChange={(e) => update("make", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Model</Label>
              <Input value={form.model} onChange={(e) => update("model", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Derivative</Label>
              <Input value={form.derivative} onChange={(e) => update("derivative", e.target.value)} className="mt-1" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Specs</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs">Year</Label>
              <Input type="number" value={form.year} onChange={(e) => update("year", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Mileage</Label>
              <Input type="number" value={form.mileage} onChange={(e) => update("mileage", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Fuel</Label>
              <Select value={form.fuel_type} onValueChange={(v) => update("fuel_type", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="plug_in_hybrid">Plug-in Hybrid</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Transmission</Label>
              <Select value={form.transmission} onValueChange={(v) => update("transmission", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Colour</Label>
            <Input value={form.colour} onChange={(e) => update("colour", e.target.value)} className="mt-1" />
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Pricing & Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Purchase Price (£)</Label>
              <Input type="number" step="0.01" value={form.purchase_price} onChange={(e) => update("purchase_price", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Advertised Price (£)</Label>
              <Input type="number" step="0.01" value={form.advertised_price} onChange={(e) => update("advertised_price", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Purchase Date</Label>
              <Input type="date" value={form.purchase_date} onChange={(e) => update("purchase_date", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="in_repair">In Repair</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Location</Label>
              <Select value={form.location} onValueChange={(v) => update("location", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_site">On Site</SelectItem>
                  <SelectItem value="garage">Garage</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} className="mt-1" rows={3} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Saving..." : "Add Vehicle"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/app/vehicles")}>Cancel</Button>
        </div>
      </form>
    </motion.div>
  );
}
