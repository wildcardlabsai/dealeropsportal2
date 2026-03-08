import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, Phone, Mail, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/app/PaginationControls";
import { useCustomers, useSoftDeleteCustomer } from "@/hooks/useCustomers";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type SortKey = "name" | "city" | "created_at";
type SortDir = "asc" | "desc";

export default function CustomerList() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const { data: customers, isLoading } = useCustomers(search);

  const sorted = [...(customers || [])].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") cmp = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    else if (sortKey === "city") cmp = (a.city || "").localeCompare(b.city || "");
    else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return sortDir === "asc" ? cmp : -cmp;
  });

  const { page, setPage, totalPages, totalItems, paginatedItems, pageSize } = usePagination(sorted);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };
  const sortIcon = (key: SortKey) => sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";
  const softDelete = useSoftDeleteCustomer();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await softDelete.mutateAsync(deleteId);
      toast.success("Customer archived");
    } catch {
      toast.error("Failed to archive customer");
    }
    setDeleteId(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">
            {customers?.length ?? 0} customer{customers?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => navigate("/app/customers/new")}>
          <Plus className="h-4 w-4 mr-2" /> Add Customer
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : !customers?.length ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border/50 bg-card/50">
          <p className="text-muted-foreground mb-4">No customers yet</p>
          <Button onClick={() => navigate("/app/customers/new")}>
            <Plus className="h-4 w-4 mr-2" /> Add your first customer
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("name")}>Name{sortIcon("name")}</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Contact</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("city")}>Location{sortIcon("city")}</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Marketing</th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/app/customers/${c.id}`)}
                    className="border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {c.first_name?.[0]}{c.last_name?.[0]}
                        </div>
                        <p className="text-sm font-medium text-foreground">{c.first_name} {c.last_name}</p>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        {c.phone && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" /> {c.phone}
                          </span>
                        )}
                        {c.email && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" /> {c.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {[c.city, c.postcode].filter(Boolean).join(", ") || "—"}
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.consent_marketing ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {c.consent_marketing ? "Opted in" : "No consent"}
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
                          <DropdownMenuItem onClick={() => navigate(`/app/customers/${c.id}`)}>
                            <Edit className="h-4 w-4 mr-2" /> View / Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(c.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete the customer. You can restore them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
