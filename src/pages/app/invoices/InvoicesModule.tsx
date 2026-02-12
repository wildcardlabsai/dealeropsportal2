import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, Filter, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInvoices } from "@/hooks/useInvoicesModule";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  issued: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  // legacy
  sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  overdue: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function InvoiceTable({ invoices, navigate }: { invoices: any[]; navigate: any }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Invoice #</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Customer</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Vehicle</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Sale Date</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3">Total</th>
              <th className="text-right text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Balance</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv: any) => (
              <tr
                key={inv.id}
                onClick={() => navigate(`/app/invoices/${inv.id}`)}
                className="border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <td className="p-3">
                  <p className="text-sm font-mono font-medium text-primary">{inv.invoice_number}</p>
                </td>
                <td className="p-3 hidden md:table-cell text-sm text-muted-foreground">
                  {inv.customers ? `${inv.customers.first_name} ${inv.customers.last_name}` : "—"}
                </td>
                <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                  {inv.vehicles ? `${inv.vehicles.vrm || ""} ${inv.vehicles.make || ""} ${inv.vehicles.model || ""}`.trim() : "—"}
                </td>
                <td className="p-3 hidden md:table-cell text-xs text-muted-foreground">
                  {inv.sale_date ? format(new Date(inv.sale_date), "d MMM yyyy") : inv.created_at ? format(new Date(inv.created_at), "d MMM yyyy") : "—"}
                </td>
                <td className="p-3 text-right text-sm font-medium">£{Number(inv.total || 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right hidden md:table-cell text-sm">
                  {Number(inv.balance_due || 0) > 0 ? (
                    <span className="text-amber-400">£{Number(inv.balance_due).toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${statusColors[inv.status] || statusColors.draft}`}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function InvoicesModule() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const navigate = useNavigate();

  const { data: invoices, isLoading } = useInvoices(search, undefined, tab);

  // Stats
  const totalSales = invoices?.filter((i: any) => i.status !== "cancelled").reduce((s: number, i: any) => s + Number(i.total || 0), 0) ?? 0;
  const totalOutstanding = invoices?.reduce((s: number, i: any) => s + Number(i.balance_due || 0), 0) ?? 0;

  const handleExportCSV = () => {
    if (!invoices?.length) return;
    const headers = ["Invoice #", "Customer", "Vehicle", "Sale Date", "Total", "Balance Due", "Status"];
    const rows = invoices.map((inv: any) => [
      inv.invoice_number,
      inv.customers ? `${inv.customers.first_name} ${inv.customers.last_name}` : "",
      inv.vehicles ? `${inv.vehicles.vrm || ""} ${inv.vehicles.make || ""} ${inv.vehicles.model || ""}` : "",
      inv.sale_date || inv.created_at?.split("T")[0] || "",
      inv.total || 0,
      inv.balance_due || 0,
      inv.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sales Invoices</h1>
          <p className="text-sm text-muted-foreground">
            £{totalSales.toLocaleString("en-GB", { minimumFractionDigits: 2 })} total
            {totalOutstanding > 0 && <span className="text-amber-400 ml-2">· £{totalOutstanding.toLocaleString("en-GB", { minimumFractionDigits: 2 })} outstanding</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button onClick={() => navigate("/app/invoices/new")} className="glow">
            <Plus className="h-4 w-4 mr-2" /> New Invoice
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="issued">Issued</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoice #, customer, reg..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}
        </div>
      ) : !invoices?.length ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border/50 bg-card/50">
          <FileText className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No invoices found</p>
          <Button onClick={() => navigate("/app/invoices/new")}>
            <Plus className="h-4 w-4 mr-2" /> Create your first invoice
          </Button>
        </div>
      ) : (
        <InvoiceTable invoices={invoices} navigate={navigate} />
      )}
    </motion.div>
  );
}
