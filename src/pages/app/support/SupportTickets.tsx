import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Plus, Search, Clock, AlertTriangle, Paperclip, X, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupportTickets, SupportTicket } from "@/hooks/useSupportTickets";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-500/20 text-blue-400",
  IN_PROGRESS: "bg-yellow-500/20 text-yellow-400",
  WAITING_ON_DEALER: "bg-orange-500/20 text-orange-400",
  WAITING_ON_SUPERADMIN: "bg-purple-500/20 text-purple-400",
  RESOLVED: "bg-green-500/20 text-green-400",
  CLOSED: "bg-muted text-muted-foreground",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-blue-500/20 text-blue-400",
  HIGH: "bg-orange-500/20 text-orange-400",
  URGENT: "bg-red-500/20 text-red-400",
};

const CATEGORIES = ["GENERAL", "BUG", "BILLING", "FEATURE_REQUEST", "DATA_ISSUE", "INTEGRATION", "OTHER"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const ENTITY_TYPES = [
  { value: "NONE", label: "None" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "VEHICLE", label: "Vehicle" },
  { value: "INVOICE", label: "Invoice" },
  { value: "AFTERSALES", label: "Aftersales Case" },
  { value: "TASK", label: "Task" },
  { value: "WARRANTY", label: "Warranty" },
  { value: "VEHICLE_CHECK", label: "Vehicle Check" },
  { value: "DOCUMENT", label: "Document" },
];

function statusLabel(s: string) {
  return s.replace(/_/g, " ");
}

export default function SupportTickets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ticketsQuery, createTicket } = useSupportTickets();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    category: "GENERAL",
    priority: "MEDIUM",
    description: "",
    related_entity_type: "NONE",
    related_entity_id: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const tickets = ticketsQuery.data ?? [];

  const myTickets = tickets.filter((t) => t.created_by_user_id === user?.id);
  const allDealerTickets = tickets;

  const applyFilters = (list: SupportTicket[]) => {
    let result = list;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.ticket_number.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    if (categoryFilter !== "all") {
      result = result.filter((t) => t.category === categoryFilter);
    }
    return result;
  };

  const byTab = (tab: string) => {
    const base = tab === "my" ? myTickets : allDealerTickets;
    const filtered = applyFilters(base);
    if (tab === "open") return applyFilters(allDealerTickets).filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS");
    if (tab === "waiting") return applyFilters(allDealerTickets).filter((t) => t.status.startsWith("WAITING"));
    if (tab === "resolved") return applyFilters(allDealerTickets).filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");
    return filtered;
  };

  const handleCreate = async () => {
    if (!form.subject || !form.description) return;
    await createTicket.mutateAsync({
      ...form,
      attachments: files.length > 0 ? files : undefined,
    });
    setForm({ subject: "", category: "GENERAL", priority: "MEDIUM", description: "", related_entity_type: "NONE", related_entity_id: "" });
    setFiles([]);
    setCreateOpen(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...newFiles]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Stats
  const openCount = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
  const waitingOnYou = tickets.filter((t) => t.status === "WAITING_ON_DEALER").length;
  const waitingOnSupport = tickets.filter((t) => t.status === "WAITING_ON_SUPERADMIN").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Support</h1>
          <p className="text-sm text-muted-foreground">Get help from the DealerOps team</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> New Ticket</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Support Ticket</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Subject *</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Brief description of your issue" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Link to record */}
              <div>
                <Label className="flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5" /> Link to Record (optional)</Label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <Select value={form.related_entity_type} onValueChange={(v) => setForm({ ...form, related_entity_type: v, related_entity_id: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((e) => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.related_entity_type !== "NONE" && (
                    <Input
                      value={form.related_entity_id}
                      onChange={(e) => setForm({ ...form, related_entity_id: e.target.value })}
                      placeholder="Record ID"
                    />
                  )}
                </div>
              </div>

              <div>
                <Label>Description *</Label>
                <Textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your issue in detail..."
                />
              </div>

              {/* Attachments */}
              <div>
                <Label>Attachments</Label>
                <div className="mt-1">
                  <input ref={fileRef} type="file" className="hidden" multiple onChange={handleFileSelect} />
                  <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                    <Paperclip className="h-4 w-4 mr-1" /> Add Files
                  </Button>
                  {files.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs bg-muted/30 rounded px-2 py-1">
                          <span className="truncate flex-1">{f.name}</span>
                          <span className="text-muted-foreground">{(f.size / 1024).toFixed(0)}KB</span>
                          <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={handleCreate} disabled={createTicket.isPending || !form.subject || !form.description} className="w-full">
                {createTicket.isPending ? "Creating..." : "Submit Ticket"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Open", count: openCount, icon: MessageSquare },
          { label: "Waiting on You", count: waitingOnYou, icon: AlertTriangle },
          { label: "Waiting on Support", count: waitingOnSupport, icon: Clock },
          { label: "Resolved", count: resolvedCount, icon: MessageSquare },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-border/50 bg-card/50">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-bold">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["OPEN", "IN_PROGRESS", "WAITING_ON_DEALER", "WAITING_ON_SUPERADMIN", "RESOLVED", "CLOSED"].map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Category</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="my">
        <TabsList>
          <TabsTrigger value="my">My Tickets ({applyFilters(myTickets).length})</TabsTrigger>
          <TabsTrigger value="all">All Dealer Tickets ({applyFilters(allDealerTickets).length})</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="waiting">Waiting</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        {["my", "all", "open", "waiting", "resolved"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div className="rounded-xl border border-border/50 overflow-hidden">
              {byTab(tab).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No tickets found</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {byTab(tab).map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/app/support/${ticket.id}`)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                            <Badge className={priorityColors[ticket.priority] || ""} variant="secondary">
                              {ticket.priority}
                            </Badge>
                            <Badge className={statusColors[ticket.status] || ""} variant="secondary">
                              {statusLabel(ticket.status)}
                            </Badge>
                            {ticket.related_entity_type !== "NONE" && (
                              <Badge variant="outline" className="text-[10px]">
                                <Link2 className="h-2.5 w-2.5 mr-0.5" />
                                {ticket.related_entity_type}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {ticket.category.replace(/_/g, " ")} · Last activity {format(new Date(ticket.last_message_at), "dd MMM yyyy HH:mm")}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(ticket.created_at), "dd MMM")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}
