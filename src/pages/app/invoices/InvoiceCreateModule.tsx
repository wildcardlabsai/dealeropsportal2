import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCreateInvoice, useFinanceCompanies, useCreateFinanceCompany, useUpsertPartExchange } from "@/hooks/useInvoicesModule";
import { useUserDealerId, useCustomers } from "@/hooks/useCustomers";
import { useVehicles } from "@/hooks/useVehicles";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  total: number;
}

export default function InvoiceCreateModule() {
  const navigate = useNavigate();
  const create = useCreateInvoice();
  const upsertPx = useUpsertPartExchange();
  const { data: dealerId } = useUserDealerId();
  const { user } = useAuth();
  const { data: customers } = useCustomers();
  const { data: vehicles } = useVehicles();
  const { data: financeCompanies } = useFinanceCompanies();
  const createFinCo = useCreateFinanceCompany();

  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saleType, setSaleType] = useState("cash");
  const [financeCompanyId, setFinanceCompanyId] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);

  // PX
  const [pxEnabled, setPxEnabled] = useState(false);
  const [px, setPx] = useState({ px_vrm: "", px_make_model: "", px_vin: "", px_mileage: "", px_allowance: "", px_settlement: "", px_notes: "" });

  // Vehicle overrides
  const [vrmOverride, setVrmOverride] = useState("");
  const [vinOverride, setVinOverride] = useState("");
  const [mileageOverride, setMileageOverride] = useState("");
  const [firstRegOverride, setFirstRegOverride] = useState("");
  const [makeModelOverride, setMakeModelOverride] = useState("");

  // Finance company modal
  const [showFinCoModal, setShowFinCoModal] = useState(false);
  const [newFinCo, setNewFinCo] = useState({ legal_name: "", trading_name: "", address_line1: "", town: "", postcode: "" });

  const [items, setItems] = useState<LineItem[]>([
    { description: "Vehicle Sale", quantity: 1, unit_price: 0, vat_rate: 0, total: 0 },
  ]);

  // Auto-fill vehicle details when selected
  const selectedVehicle = vehicles?.find((v) => v.id === vehicleId);
  useEffect(() => {
    if (selectedVehicle) {
      setVrmOverride(selectedVehicle.vrm || "");
      setVinOverride(selectedVehicle.vin || "");
      setMileageOverride(selectedVehicle.mileage?.toString() || "");
      setMakeModelOverride(`${selectedVehicle.make || ""} ${selectedVehicle.model || ""}`.trim());
    }
  }, [selectedVehicle]);

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      (updated[index] as any)[field] = typeof value === "string" ? (field === "description" ? value : parseFloat(value) || 0) : value;
      const net = updated[index].quantity * updated[index].unit_price;
      const vat = net * (updated[index].vat_rate / 100);
      updated[index].total = net + vat;
      return updated;
    });
  };
  const addItem = () => setItems([...items, { description: "", quantity: 1, unit_price: 0, vat_rate: 20, total: 0 }]);
  const removeItem = (i: number) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const vatAmount = items.reduce((s, i) => s + i.quantity * i.unit_price * (i.vat_rate / 100), 0);
  const pxAllowance = pxEnabled ? parseFloat(px.px_allowance) || 0 : 0;
  const total = subtotal + vatAmount + deliveryFee - pxAllowance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId || !user) { toast.error("No dealer account linked"); return; }
    if (!customerId) { toast.error("Customer is required"); return; }
    if (total <= 0) { toast.error("Total must be greater than 0"); return; }
    if ((saleType === "finance" || saleType === "part_finance") && !financeCompanyId) {
      toast.error("Finance company is required for finance sales"); return;
    }

    try {
      const result = await create.mutateAsync({
        dealer_id: dealerId,
        invoice_number: "", // trigger auto-generates
        customer_id: customerId,
        vehicle_id: vehicleId || null,
        sale_date: saleDate,
        due_date: dueDate || null,
        notes: notes || null,
        sale_type: saleType,
        finance_company_id: financeCompanyId || null,
        delivery_fee: deliveryFee,
        subtotal,
        vat_amount: vatAmount,
        total,
        balance_due: total,
        deposit_amount: 0,
        created_by_user_id: user.id,
        vehicle_vrm_override: vrmOverride || null,
        vehicle_vin_override: vinOverride || null,
        vehicle_mileage_override: mileageOverride ? parseInt(mileageOverride) : null,
        vehicle_first_reg_override: firstRegOverride || null,
        vehicle_make_model_override: makeModelOverride || null,
        items: items.map(({ description, quantity, unit_price, vat_rate, total }) => ({
          description, quantity, unit_price, vat_rate, total,
        })),
      });

      // Create PX if enabled
      if (pxEnabled && pxAllowance > 0) {
        await upsertPx.mutateAsync({
          dealer_id: dealerId,
          invoice_id: (result as any).id,
          px_vrm: px.px_vrm || null,
          px_make_model: px.px_make_model || null,
          px_vin: px.px_vin || null,
          px_mileage: px.px_mileage ? parseFloat(px.px_mileage) : null,
          px_allowance: pxAllowance,
          px_settlement: px.px_settlement ? parseFloat(px.px_settlement) : 0,
          px_notes: px.px_notes || null,
        });
      }

      toast.success("Invoice created");
      navigate(`/app/invoices/${(result as any).id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create invoice");
    }
  };

  const handleCreateFinCo = async () => {
    if (!dealerId || !newFinCo.legal_name) return;
    try {
      const result = await createFinCo.mutateAsync({ ...newFinCo, dealer_id: dealerId });
      setFinanceCompanyId((result as any).id);
      setShowFinCoModal(false);
      setNewFinCo({ legal_name: "", trading_name: "", address_line1: "", town: "", postcode: "" });
      toast.success("Finance company added");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/invoices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Sales Invoice</h1>
          <p className="text-sm text-muted-foreground">Invoice number will be auto-generated</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Sale Details */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Sale Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Sale Date *</Label>
              <Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Sale Type</Label>
              <Select value={saleType} onValueChange={setSaleType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash Sale</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="part_finance">Part Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(saleType === "finance" || saleType === "part_finance") && (
              <div className="md:col-span-2">
                <Label className="text-xs">Finance Company *</Label>
                <div className="flex gap-2 mt-1">
                  <Select value={financeCompanyId} onValueChange={setFinanceCompanyId}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {financeCompanies?.map((fc: any) => (
                        <SelectItem key={fc.id} value={fc.id}>{fc.legal_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowFinCoModal(true)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Vehicle Details</h3>
          <div>
            <Label className="text-xs">Link Vehicle</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select vehicle (optional)" /></SelectTrigger>
              <SelectContent>
                {vehicles?.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.vrm} — {v.make} {v.model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-[10px] text-muted-foreground">Registration</Label>
              <Input value={vrmOverride} onChange={(e) => setVrmOverride(e.target.value)} className="mt-1" placeholder="AB12 CDE" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">VIN</Label>
              <Input value={vinOverride} onChange={(e) => setVinOverride(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Mileage</Label>
              <Input value={mileageOverride} onChange={(e) => setMileageOverride(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">First Registration</Label>
              <Input value={firstRegOverride} onChange={(e) => setFirstRegOverride(e.target.value)} className="mt-1" placeholder="dd/mm/yyyy" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Make / Model</Label>
              <Input value={makeModelOverride} onChange={(e) => setMakeModelOverride(e.target.value)} className="mt-1" />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Line Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-3 w-3 mr-1" /> Add Item
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  {i === 0 && <Label className="text-xs">Description</Label>}
                  <Input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} className="mt-1" placeholder="Item" />
                </div>
                <div className="col-span-1">
                  {i === 0 && <Label className="text-xs">Qty</Label>}
                  <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} className="mt-1" />
                </div>
                <div className="col-span-2">
                  {i === 0 && <Label className="text-xs">Unit Price</Label>}
                  <Input type="number" step="0.01" value={item.unit_price || ""} onChange={(e) => updateItem(i, "unit_price", e.target.value)} className="mt-1" />
                </div>
                <div className="col-span-2">
                  {i === 0 && <Label className="text-xs">VAT %</Label>}
                  <Select value={item.vat_rate.toString()} onValueChange={(v) => updateItem(i, "vat_rate", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="20">20%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  {i === 0 && <Label className="text-xs">Line Total</Label>}
                  <p className="text-sm font-medium mt-1 py-2">£{item.total.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="col-span-1">
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Delivery */}
          <div className="border-t border-border/30 pt-3">
            <div className="flex items-center gap-4 max-w-xs">
              <Label className="text-xs whitespace-nowrap">Delivery Fee (£)</Label>
              <Input type="number" step="0.01" value={deliveryFee || ""} onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-border/50 pt-4 space-y-1 text-right">
            <p className="text-sm"><span className="text-muted-foreground">Subtotal:</span> £{subtotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</p>
            <p className="text-sm"><span className="text-muted-foreground">VAT:</span> £{vatAmount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</p>
            {deliveryFee > 0 && <p className="text-sm"><span className="text-muted-foreground">Delivery:</span> £{deliveryFee.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</p>}
            {pxAllowance > 0 && <p className="text-sm"><span className="text-emerald-400">PX Allowance:</span> -£{pxAllowance.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</p>}
            <p className="text-lg font-bold">Total: £{total.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Part Exchange */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Part Exchange</h3>
            <Switch checked={pxEnabled} onCheckedChange={setPxEnabled} />
          </div>
          {pxEnabled && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-[10px] text-muted-foreground">PX Registration</Label>
                <Input value={px.px_vrm} onChange={(e) => setPx({ ...px, px_vrm: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Make / Model</Label>
                <Input value={px.px_make_model} onChange={(e) => setPx({ ...px, px_make_model: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">VIN</Label>
                <Input value={px.px_vin} onChange={(e) => setPx({ ...px, px_vin: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Mileage</Label>
                <Input value={px.px_mileage} onChange={(e) => setPx({ ...px, px_mileage: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">PX Allowance *</Label>
                <Input type="number" step="0.01" value={px.px_allowance} onChange={(e) => setPx({ ...px, px_allowance: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Settlement (info)</Label>
                <Input type="number" step="0.01" value={px.px_settlement} onChange={(e) => setPx({ ...px, px_settlement: e.target.value })} className="mt-1" />
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
          <h3 className="text-sm font-semibold">Notes</h3>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Payment terms, notes..." />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={create.isPending} className="glow">
            {create.isPending ? "Creating..." : "Create Invoice (Draft)"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/app/invoices")}>Cancel</Button>
        </div>
      </form>

      {/* Finance Company Modal */}
      <Dialog open={showFinCoModal} onOpenChange={setShowFinCoModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Finance Company</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Legal Name *</Label>
              <Input value={newFinCo.legal_name} onChange={(e) => setNewFinCo({ ...newFinCo, legal_name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Trading Name</Label>
              <Input value={newFinCo.trading_name} onChange={(e) => setNewFinCo({ ...newFinCo, trading_name: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Address</Label>
                <Input value={newFinCo.address_line1} onChange={(e) => setNewFinCo({ ...newFinCo, address_line1: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Town</Label>
                <Input value={newFinCo.town} onChange={(e) => setNewFinCo({ ...newFinCo, town: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Postcode</Label>
              <Input value={newFinCo.postcode} onChange={(e) => setNewFinCo({ ...newFinCo, postcode: e.target.value })} className="mt-1 max-w-[200px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinCoModal(false)}>Cancel</Button>
            <Button onClick={handleCreateFinCo} disabled={!newFinCo.legal_name}>Add Company</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
