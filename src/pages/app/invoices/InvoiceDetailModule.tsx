import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Send, CreditCard, Ban, Printer, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  useInvoice, useInvoiceItems, useUpdateInvoice,
  useInvoicePayments, useAddInvoicePayment, useDeleteInvoicePayment,
  usePartExchange,
} from "@/hooks/useInvoicesModule";
import { useUserDealerId } from "@/hooks/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  overdue: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const saleTypeLabels: Record<string, string> = { cash: "Cash Sale", finance: "Finance", part_finance: "Part Finance" };
const methodLabels: Record<string, string> = { bacs: "BACS", card: "Card", cash: "Cash", finance: "Finance", other: "Other" };

export default function InvoiceDetailModule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dealerId } = useUserDealerId();
  const { data: invoice, isLoading } = useInvoice(id);
  const { data: items } = useInvoiceItems(id);
  const { data: payments } = useInvoicePayments(id);
  const { data: px } = usePartExchange(id);
  const updateInvoice = useUpdateInvoice();
  const addPayment = useAddInvoicePayment();
  const deletePayment = useDeleteInvoicePayment();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ method: "bacs", amount: "", reference: "" });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 rounded-lg bg-primary animate-pulse" /></div>;
  }
  if (!invoice) {
    return <div className="text-center py-20 text-muted-foreground">Invoice not found</div>;
  }

  const inv = invoice as any;
  const totalPaid = payments?.reduce((s: number, p: any) => s + Number(p.amount || 0), 0) ?? 0;
  const balanceDue = Number(inv.total || 0) - totalPaid;
  const isLocked = inv.status === "sent" || inv.status === "paid" || inv.status === "cancelled";

  const handleIssue = async () => {
    try {
      await updateInvoice.mutateAsync({
        id: inv.id,
        status: "sent" as any,
        issued_at: new Date().toISOString(),
        balance_due: balanceDue,
      });
      toast.success("Invoice issued");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCancel = async () => {
    try {
      await updateInvoice.mutateAsync({
        id: inv.id,
        status: "cancelled" as any,
        cancelled_at: new Date().toISOString(),
      });
      toast.success("Invoice cancelled");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddPayment = async () => {
    if (!dealerId) return;
    const amount = parseFloat(paymentForm.amount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    try {
      await addPayment.mutateAsync({
        dealer_id: dealerId,
        invoice_id: inv.id,
        method: paymentForm.method,
        amount,
        reference: paymentForm.reference || null,
        received_at: new Date().toISOString(),
      });

      const newBalance = balanceDue - amount;
      if (newBalance <= 0) {
        await updateInvoice.mutateAsync({
          id: inv.id,
          status: "paid" as any,
          paid_at: new Date().toISOString(),
          balance_due: 0,
        });
        toast.success("Invoice marked as paid");
      } else {
        await updateInvoice.mutateAsync({ id: inv.id, balance_due: newBalance });
        toast.success("Payment recorded");
      }
      setShowPaymentModal(false);
      setPaymentForm({ method: "bacs", amount: "", reference: "" });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handlePrintPDF = () => {
    const customer = inv.customers;
    const vehicle = inv.vehicles;
    const finCo = inv.finance_companies;
    const dealer = inv.dealers;
    const isFinance = inv.sale_type === "finance" || inv.sale_type === "part_finance";

    const soldTo = isFinance && finCo
      ? `${finCo.legal_name}\n${finCo.address_line1 || ""}\n${finCo.town || ""} ${finCo.postcode || ""}`.trim()
      : customer ? `${customer.first_name} ${customer.last_name}\n${customer.address_line1 || ""}\n${customer.city || ""} ${customer.postcode || ""}`.trim() : "";

    const deliveredTo = customer ? `${customer.first_name} ${customer.last_name}\n${customer.address_line1 || ""}\n${customer.city || ""} ${customer.postcode || ""}`.trim() : "";

    const vrm = inv.vehicle_vrm_override || vehicle?.vrm || "";
    const vin = inv.vehicle_vin_override || vehicle?.vin || "";
    const mileage = inv.vehicle_mileage_override || vehicle?.mileage || "";
    const makeModel = inv.vehicle_make_model_override || (vehicle ? `${vehicle.make || ""} ${vehicle.model || ""}`.trim() : "");
    const firstReg = inv.vehicle_first_reg_override || vehicle?.year || "";

    const dealerName = dealer?.trading_name || dealer?.legal_name || dealer?.name || "";
    const dealerAddr = [dealer?.address_line1, dealer?.city, dealer?.postcode].filter(Boolean).join(", ");
    const dealerContact = [dealer?.phone, dealer?.email].filter(Boolean).join(" · ");

    const itemsHtml = (items || []).map((item: any) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #333">${item.description}</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:right">£${Number(item.unit_price).toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:center">${item.vat_rate || 0}%</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:right">£${Number(item.total).toFixed(2)}</td>
      </tr>
    `).join("");

    const pxHtml = px ? `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #333;color:#10b981">Part Exchange Allowance${px.px_vrm ? ` (${px.px_vrm})` : ""}</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:center">1</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:right;color:#10b981">-£${Number(px.px_allowance).toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:center">0%</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:right;color:#10b981">-£${Number(px.px_allowance).toFixed(2)}</td>
      </tr>
    ` : "";

    const deliveryHtml = Number(inv.delivery_fee || 0) > 0 ? `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #333">Delivery</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:center">1</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:right">£${Number(inv.delivery_fee).toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:center">0%</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:right">£${Number(inv.delivery_fee).toFixed(2)}</td>
      </tr>
    ` : "";

    const paymentsHtml = (payments || []).map((p: any) => `
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px">
        <span>${methodLabels[p.method] || p.method}${p.reference ? ` (${p.reference})` : ""}</span>
        <span>£${Number(p.amount).toFixed(2)}</span>
      </div>
    `).join("");

    // Regulatory footer items
    const regItems = [
      dealer?.company_number ? `Company Reg: ${dealer.company_number}` : "",
      dealer?.vat_number ? `VAT: ${dealer.vat_number}` : "",
      dealer?.fca_number ? `FCA: ${dealer.fca_number}` : "",
      dealer?.ico_number ? `ICO: ${dealer.ico_number}` : "",
    ].filter(Boolean).join(" &nbsp;·&nbsp; ");

    const html = `
      <!DOCTYPE html><html><head><title>Invoice ${inv.invoice_number}</title>
      <style>
        body{font-family:'Segoe UI',sans-serif;color:#e5e5e5;background:#0a0a0f;margin:0;padding:40px}
        .container{max-width:800px;margin:0 auto;background:#111118;border-radius:12px;padding:40px;border:1px solid #222}
        h1{color:#3b82f6;font-size:28px;margin:0}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}
        .addresses{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}
        .address-block h4{color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px}
        .address-block p{white-space:pre-line;font-size:14px;line-height:1.5;margin:0}
        .vehicle-block{background:#1a1a24;padding:16px;border-radius:8px;margin-bottom:24px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .vehicle-block div{font-size:12px}.vehicle-block .label{color:#888;font-size:10px;text-transform:uppercase}
        table{width:100%;border-collapse:collapse;margin-bottom:24px}
        th{text-align:left;padding:8px;border-bottom:2px solid #333;color:#888;font-size:11px;text-transform:uppercase}
        .totals{text-align:right;margin-bottom:24px}
        .totals div{padding:4px 0;font-size:14px}
        .totals .total{font-size:20px;font-weight:bold;color:#3b82f6;border-top:2px solid #333;padding-top:8px;margin-top:4px}
        .payments{background:#1a1a24;padding:16px;border-radius:8px;margin-bottom:24px}
        .payments h4{color:#888;font-size:11px;text-transform:uppercase;margin:0 0 8px}
        .footer-reg{text-align:center;padding:12px 0;border-top:1px solid #333;font-size:10px;color:#666;margin-top:16px}
        @media print{body{background:#fff;color:#111;padding:20px}.container{background:#fff;border:none;box-shadow:none}
          .vehicle-block,.payments{background:#f5f5f5}th{color:#666}h1{color:#2563eb}.totals .total{color:#2563eb}}
      </style></head><body>
      <div class="container">
        <div class="header">
          <div>
            ${dealer?.logo_url ? `<img src="${dealer.logo_url}" alt="" style="max-height:48px;margin-bottom:8px;display:block" />` : ""}
            <h1>${inv.invoice_number}</h1>
            <p style="color:#888;font-size:13px;margin:4px 0">Sale Date: ${inv.sale_date || "—"}</p>
            <p style="color:#888;font-size:13px;margin:0">Status: ${inv.status?.toUpperCase()}</p>
          </div>
          <div style="text-align:right">
            <p style="font-size:14px;font-weight:bold;margin:0 0 4px">${dealerName}</p>
            <p style="font-size:11px;color:#888;margin:0">${dealerAddr}</p>
            <p style="font-size:11px;color:#888;margin:2px 0 8px">${dealerContact}</p>
            <p style="font-size:11px;color:#888;text-transform:uppercase">Sales Invoice</p>
            <p style="font-size:12px;color:#888">${saleTypeLabels[inv.sale_type] || "Cash"}</p>
          </div>
        </div>
        <div class="addresses">
          <div class="address-block"><h4>${isFinance ? "Sold To (Finance Co.)" : "Sold To"}</h4><p>${soldTo || "—"}</p></div>
          <div class="address-block"><h4>Delivered To</h4><p>${deliveredTo || "—"}</p></div>
        </div>
        ${(vrm || vin || makeModel) ? `<div class="vehicle-block">
          <div><div class="label">Registration</div>${vrm || "—"}</div>
          <div><div class="label">Make / Model</div>${makeModel || "—"}</div>
          <div><div class="label">Mileage</div>${mileage || "—"}</div>
          <div><div class="label">VIN</div>${vin || "—"}</div>
          <div><div class="label">Date of First Reg</div>${firstReg || "—"}</div>
        </div>` : ""}
        <table>
          <thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:center">VAT</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>${itemsHtml}${deliveryHtml}${pxHtml}</tbody>
        </table>
        <div class="totals">
          <div><span style="color:#888">Subtotal:</span> £${Number(inv.subtotal || 0).toFixed(2)}</div>
          <div><span style="color:#888">VAT:</span> £${Number(inv.vat_amount || 0).toFixed(2)}</div>
          ${Number(inv.delivery_fee || 0) > 0 ? `<div><span style="color:#888">Delivery:</span> £${Number(inv.delivery_fee).toFixed(2)}</div>` : ""}
          ${px ? `<div><span style="color:#10b981">PX Allowance:</span> <span style="color:#10b981">-£${Number(px.px_allowance).toFixed(2)}</span></div>` : ""}
          <div class="total">Total: £${Number(inv.total || 0).toFixed(2)}</div>
        </div>
        ${payments && payments.length > 0 ? `<div class="payments"><h4>Payment Breakdown</h4>${paymentsHtml}
          <div style="display:flex;justify-content:space-between;padding:8px 0 0;border-top:1px solid #333;font-weight:bold;font-size:14px">
            <span>Balance Due</span><span${balanceDue > 0 ? ' style="color:#f59e0b"' : ""}>£${balanceDue.toFixed(2)}</span>
          </div></div>` : ""}
        ${px && px.px_settlement && Number(px.px_settlement) > 0 ? `<div style="background:#1a1a24;padding:12px 16px;border-radius:8px;margin-bottom:24px;font-size:12px;color:#888">
          <strong>Part Exchange Info:</strong> ${px.px_vrm || ""} ${px.px_make_model || ""} — Settlement: £${Number(px.px_settlement).toFixed(2)}</div>` : ""}
        ${dealer?.bank_details_text ? `<div style="background:#1a1a24;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:11px;color:#888;white-space:pre-wrap">${dealer.bank_details_text}</div>` : ""}
        ${dealer?.invoice_footer_text ? `<div style="text-align:center;font-size:11px;color:#888;font-style:italic;margin-bottom:8px">${dealer.invoice_footer_text}</div>` : ""}
        <div class="footer-reg">
          ${dealerName}${regItems ? ` &nbsp;|&nbsp; ${regItems}` : ""}
        </div>
      </div></body></html>`;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/invoices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{inv.invoice_number}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${statusColors[inv.status] || statusColors.draft}`}>
              {inv.status}
            </span>
            {inv.sale_type !== "cash" && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400">
                {saleTypeLabels[inv.sale_type] || inv.sale_type}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {inv.customers ? `${inv.customers.first_name} ${inv.customers.last_name}` : "No customer"}
            {inv.sale_date && ` · ${format(new Date(inv.sale_date), "d MMM yyyy")}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrintPDF}>
            <Printer className="h-4 w-4 mr-1" /> PDF
          </Button>
          {inv.status === "draft" && (
            <Button size="sm" onClick={handleIssue} className="glow">
              <Send className="h-4 w-4 mr-1" /> Issue Invoice
            </Button>
          )}
          {(inv.status === "sent") && (
            <Button size="sm" onClick={() => setShowPaymentModal(true)}>
              <CreditCard className="h-4 w-4 mr-1" /> Record Payment
            </Button>
          )}
          {(inv.status === "draft" || inv.status === "sent") && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Ban className="h-4 w-4 mr-1" /> Cancel</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Invoice?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently lock the invoice. This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Invoice</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">Cancel Invoice</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Details */}
          {(inv.vehicle_vrm_override || inv.vehicles) && (
            <div className="p-4 rounded-xl border border-border/50 bg-card/50">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Vehicle</h3>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                <div><span className="text-muted-foreground block">Reg</span>{inv.vehicle_vrm_override || inv.vehicles?.vrm || "—"}</div>
                <div><span className="text-muted-foreground block">VIN</span>{inv.vehicle_vin_override || inv.vehicles?.vin || "—"}</div>
                <div><span className="text-muted-foreground block">Make/Model</span>{inv.vehicle_make_model_override || (inv.vehicles ? `${inv.vehicles.make || ""} ${inv.vehicles.model || ""}`.trim() : "—")}</div>
                <div><span className="text-muted-foreground block">Mileage</span>{inv.vehicle_mileage_override || inv.vehicles?.mileage || "—"}</div>
                <div><span className="text-muted-foreground block">First Reg</span>{inv.vehicle_first_reg_override || "—"}</div>
              </div>
            </div>
          )}

          {/* Line Items */}
          <div className="p-5 rounded-xl border border-border/50 bg-card/50">
            <h3 className="text-sm font-semibold mb-3">Line Items</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-xs text-muted-foreground p-2">Description</th>
                  <th className="text-center text-xs text-muted-foreground p-2">Qty</th>
                  <th className="text-right text-xs text-muted-foreground p-2">Price</th>
                  <th className="text-center text-xs text-muted-foreground p-2">VAT</th>
                  <th className="text-right text-xs text-muted-foreground p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {items?.map((item: any) => (
                  <tr key={item.id} className="border-b border-border/30">
                    <td className="p-2 text-sm">{item.description}</td>
                    <td className="p-2 text-sm text-center">{item.quantity}</td>
                    <td className="p-2 text-sm text-right">£{Number(item.unit_price).toFixed(2)}</td>
                    <td className="p-2 text-sm text-center">{item.vat_rate || 0}%</td>
                    <td className="p-2 text-sm text-right font-medium">£{Number(item.total).toFixed(2)}</td>
                  </tr>
                ))}
                {Number(inv.delivery_fee || 0) > 0 && (
                  <tr className="border-b border-border/30">
                    <td className="p-2 text-sm">Delivery</td>
                    <td className="p-2 text-sm text-center">1</td>
                    <td className="p-2 text-sm text-right">£{Number(inv.delivery_fee).toFixed(2)}</td>
                    <td className="p-2 text-sm text-center">0%</td>
                    <td className="p-2 text-sm text-right font-medium">£{Number(inv.delivery_fee).toFixed(2)}</td>
                  </tr>
                )}
                {px && (
                  <tr className="border-b border-border/30">
                    <td className="p-2 text-sm text-emerald-400">PX Allowance {px.px_vrm && `(${px.px_vrm})`}</td>
                    <td className="p-2 text-sm text-center">1</td>
                    <td className="p-2 text-sm text-right text-emerald-400">-£{Number(px.px_allowance).toFixed(2)}</td>
                    <td className="p-2 text-sm text-center">0%</td>
                    <td className="p-2 text-sm text-right font-medium text-emerald-400">-£{Number(px.px_allowance).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="text-right mt-4 space-y-1">
              <p className="text-sm"><span className="text-muted-foreground">Subtotal:</span> £{Number(inv.subtotal || 0).toFixed(2)}</p>
              <p className="text-sm"><span className="text-muted-foreground">VAT:</span> £{Number(inv.vat_amount || 0).toFixed(2)}</p>
              <p className="text-lg font-bold text-primary">Total: £{Number(inv.total || 0).toFixed(2)}</p>
            </div>
          </div>

          {/* Payments */}
          <div className="p-5 rounded-xl border border-border/50 bg-card/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Payment Breakdown</h3>
              {inv.status === "sent" && (
                <Button variant="outline" size="sm" onClick={() => setShowPaymentModal(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Add Payment
                </Button>
              )}
            </div>
            {payments && payments.length > 0 ? (
              <div className="space-y-2">
                {payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/30">
                    <div>
                      <span className="text-sm font-medium">{methodLabels[p.method] || p.method}</span>
                      {p.reference && <span className="text-xs text-muted-foreground ml-2">({p.reference})</span>}
                      {p.received_at && <span className="text-xs text-muted-foreground ml-2">{format(new Date(p.received_at), "d MMM yyyy")}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">£{Number(p.amount).toFixed(2)}</span>
                      {inv.status === "sent" && (
                        <Button
                          variant="ghost" size="icon" className="h-6 w-6"
                          onClick={() => deletePayment.mutate({ id: p.id, invoiceId: inv.id })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-border/30">
                  <span className="text-sm font-medium">Total Paid</span>
                  <span className="text-sm font-medium">£{totalPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold">Balance Due</span>
                  <span className={`text-sm font-bold ${balanceDue > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    £{balanceDue.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No payments recorded</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="capitalize">{inv.status}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sale Type</span><span>{saleTypeLabels[inv.sale_type] || "Cash"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sale Date</span><span>{inv.sale_date || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span>{inv.due_date || "—"}</span></div>
              {inv.issued_at && <div className="flex justify-between"><span className="text-muted-foreground">Issued</span><span>{format(new Date(inv.issued_at), "d MMM yyyy HH:mm")}</span></div>}
              {inv.paid_at && <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span>{format(new Date(inv.paid_at), "d MMM yyyy HH:mm")}</span></div>}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</h3>
            {inv.customers ? (
              <div className="text-xs space-y-0.5">
                <p className="font-medium">{inv.customers.first_name} {inv.customers.last_name}</p>
                {inv.customers.email && <p className="text-muted-foreground">{inv.customers.email}</p>}
                {inv.customers.phone && <p className="text-muted-foreground">{inv.customers.phone}</p>}
                {inv.customers.address_line1 && <p className="text-muted-foreground">{inv.customers.address_line1}</p>}
                {inv.customers.city && <p className="text-muted-foreground">{inv.customers.city} {inv.customers.postcode}</p>}
              </div>
            ) : <p className="text-xs text-muted-foreground">No customer linked</p>}
          </div>

          {inv.finance_companies && (
            <div className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Finance Company</h3>
              <div className="text-xs space-y-0.5">
                <p className="font-medium">{inv.finance_companies.legal_name}</p>
                {inv.finance_companies.address_line1 && <p className="text-muted-foreground">{inv.finance_companies.address_line1}</p>}
                {inv.finance_companies.town && <p className="text-muted-foreground">{inv.finance_companies.town} {inv.finance_companies.postcode}</p>}
              </div>
            </div>
          )}

          {px && (
            <div className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Part Exchange</h3>
              <div className="text-xs space-y-0.5">
                {px.px_vrm && <p><span className="text-muted-foreground">Reg:</span> {px.px_vrm}</p>}
                {px.px_make_model && <p><span className="text-muted-foreground">Vehicle:</span> {px.px_make_model}</p>}
                <p><span className="text-muted-foreground">Allowance:</span> <span className="text-emerald-400 font-medium">£{Number(px.px_allowance).toFixed(2)}</span></p>
                {px.px_settlement && Number(px.px_settlement) > 0 && (
                  <p><span className="text-muted-foreground">Settlement:</span> £{Number(px.px_settlement).toFixed(2)}</p>
                )}
              </div>
            </div>
          )}

          {inv.notes && (
            <div className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</h3>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{inv.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Payment Method</Label>
              <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm({ ...paymentForm, method: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bacs">BACS</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Amount (£) — Balance: £{balanceDue.toFixed(2)}</Label>
              <Input
                type="number" step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="mt-1"
                placeholder={balanceDue.toFixed(2)}
              />
            </div>
            <div>
              <Label className="text-xs">Reference</Label>
              <Input
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                className="mt-1"
                placeholder="Transaction ref, cheque #..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button onClick={handleAddPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
