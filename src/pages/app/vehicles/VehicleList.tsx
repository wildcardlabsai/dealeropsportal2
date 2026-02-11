import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, MoreHorizontal, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVehicles } from "@/hooks/useVehicles";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  in_stock: "bg-success/10 text-success border-success/20",
  reserved: "bg-warning/10 text-warning border-warning/20",
  sold: "bg-primary/10 text-primary border-primary/20",
  in_repair: "bg-destructive/10 text-destructive border-destructive/20",
  returned: "bg-muted text-muted-foreground border-border",
};

const statusLabels: Record<string, string> = {
  in_stock: "In Stock",
  reserved: "Reserved",
  sold: "Sold",
  in_repair: "In Repair",
  returned: "Returned",
};

export default function VehicleList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: vehicles, isLoading } = useVehicles(search, statusFilter);
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-sm text-muted-foreground">
            {vehicles?.length ?? 0} vehicle{vehicles?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => navigate("/app/vehicles/new")}>
          <Plus className="h-4 w-4 mr-2" /> Add Vehicle
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search VRM, make, model..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="in_repair">In Repair</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : !vehicles?.length ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border/50 bg-card/50">
          <p className="text-muted-foreground mb-4">No vehicles yet</p>
          <Button onClick={() => navigate("/app/vehicles/new")}>
            <Plus className="h-4 w-4 mr-2" /> Add your first vehicle
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">VRM</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Vehicle</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Year</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Mileage</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Price</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => navigate(`/app/vehicles/${v.id}`)}
                    className="border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="p-3">
                      <span className="text-sm font-mono font-medium text-primary">{v.vrm || "—"}</span>
                    </td>
                    <td className="p-3">
                      <p className="text-sm font-medium">{[v.make, v.model].filter(Boolean).join(" ") || "—"}</p>
                      {v.derivative && <p className="text-xs text-muted-foreground">{v.derivative}</p>}
                    </td>
                    <td className="p-3 hidden md:table-cell text-sm text-muted-foreground">{v.year || "—"}</td>
                    <td className="p-3 hidden md:table-cell text-sm text-muted-foreground">
                      {v.mileage ? v.mileage.toLocaleString() : "—"}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-sm">
                      {v.advertised_price ? `£${Number(v.advertised_price).toLocaleString()}` : "—"}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[v.status] || ""}`}>
                        {statusLabels[v.status] || v.status}
                      </span>
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/app/vehicles/${v.id}`)}>
                            <Edit className="h-4 w-4 mr-2" /> View / Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
