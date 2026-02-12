import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search, User, Building2, Mail, Phone, MessageSquare, Calendar,
  Eye, UserPlus, Inbox
} from "lucide-react";

type ContactLead = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  dealership_name: string | null;
  message: string;
  status: string;
  created_at: string;
};

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  contacted: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  trial_active: "bg-green-500/10 text-green-400 border-green-500/30",
  converted: "bg-primary/10 text-primary border-primary/30",
  declined: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function SuperAdminLeads() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<ContactLead | null>(null);
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["contact-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContactLead[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("contact_leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-leads"] });
      toast.success("Lead status updated");
    },
  });

  const filtered = leads.filter((lead) => {
    const matchesSearch =
      !search ||
      lead.first_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.dealership_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const newCount = leads.filter((l) => l.status === "new").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="h-6 w-6 text-primary" />
            Potential Leads
            {newCount > 0 && (
              <Badge variant="default" className="ml-2">{newCount} new</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Demo requests and trial sign-ups from the website
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or dealership..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="trial_active">Trial Active</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Dealership</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((lead) => (
                  <TableRow key={lead.id} className={lead.status === "new" ? "bg-primary/5" : ""}>
                    <TableCell className="font-medium">
                      {lead.first_name} {lead.last_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{lead.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {lead.dealership_name || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[lead.status] || ""}>
                        {lead.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(lead.created_at), "dd MMM yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLead(lead)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lead detail dialog */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Lead Details
            </DialogTitle>
            <DialogDescription>
              Review lead information and update their status.
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Name
                  </p>
                  <p className="text-sm font-medium">
                    {selectedLead.first_name} {selectedLead.last_name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Dealership
                  </p>
                  <p className="text-sm font-medium">
                    {selectedLead.dealership_name || "Not provided"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </p>
                  <p className="text-sm font-medium">{selectedLead.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone
                  </p>
                  <p className="text-sm font-medium">{selectedLead.phone || "Not provided"}</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> Message
                  </p>
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    {selectedLead.message}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Received
                  </p>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedLead.created_at), "dd MMM yyyy 'at' HH:mm")}
                  </p>
                </div>
              </div>

              <div className="border-t border-border/50 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Update Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {["new", "contacted", "trial_active", "converted", "declined"].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selectedLead.status === s ? "default" : "outline"}
                      onClick={() => {
                        updateStatus.mutate({ id: selectedLead.id, status: s });
                        setSelectedLead({ ...selectedLead, status: s });
                      }}
                      className="text-xs capitalize"
                    >
                      {s.replace("_", " ")}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLead(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
