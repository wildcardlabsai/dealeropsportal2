import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateVehicle } from "@/hooks/useVehicles";
import { useUserDealerId, useCustomers } from "@/hooks/useCustomers";
import { toast } from "sonner";
import VrmLookup, { VrmLookupResult } from "@/components/app/VrmLookup";

const NO_CUSTOMER_VALUE = "__no_customer__";

export default function VehicleCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const create = useCreateVehicle();
  const { data: dealerId } = useUserDealerId();
  const { data: customers } = useCustomers();
  const preselectedCustomerId = searchParams.get("customer_id") || "";

  const [form, setForm] = useState({
    vrm: "", vin: "", make: "", model: "", derivative: "",
    year: "", mileage: "", fuel_type: "petrol" as const,
    transmission: "manual" as const, colour: "",
    purchase_date: "", purchase_price: "", advertised_price: "",
    status: "in_stock" as const, location: "on_site" as const, notes: "",
  });
  const [customerId, setCustomerId] = useState(preselectedCustomerId);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleVrmResult = (result: VrmLookupResult) => {
    setForm((prev) => ({
      ...prev,
      vrm: result.vrm || prev.vrm,
      vin: result.vin || prev.vin,
      make: result.make || prev.make,
      model: result.model || prev.model,
      colour: result.colour || prev.colour,
      year: result.yearOfManufacture ? String(result.yearOfManufacture) : prev.year,
      mileage: result.latestMotMileage ? String(result.latestMotMileage) : prev.mileage,
      fuel_type: result.fuelType ? result.fuelType.toLowerCase() as any : prev.fuel_type,
    }));
  };

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
        customer_id: customerId || null,
      });
      toast.success("Vehicle added");
      if (preselectedCustomerId) {
        navigate(`/app/customers/${preselectedCustomerId}`);
      } else {
        navigate("/app/vehicles");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add vehicle");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => preselectedCustomerId ? navigate(`/app/customers/${preselectedCustomerId}`) : navigate("/app/vehicles")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Vehicle</h1>
          <p className="text-sm text-muted-foreground">Add a vehicle to your stock</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Customer Allocation */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Customer Allocation <span className="text-muted-foreground font-normal">(optional)</span></h3>
          <div>
            <Label className="text-xs">Assign to Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="No customer assigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No customer</SelectItem>
                {customers?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}{c.phone ? ` · ${c.phone}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Identity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <VrmLookup
              value={form.vrm}
              onChange={(v) => update("vrm", v)}
              onResult={handleVrmResult}
            />
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
          <Button type="button" variant="outline" onClick={() => preselectedCustomerId ? navigate(`/app/customers/${preselectedCustomerId}`) : navigate("/app/vehicles")}>Cancel</Button>
        </div>
      </form>
    </motion.div>
  );
}
