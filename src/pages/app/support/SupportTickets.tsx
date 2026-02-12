import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Plus, Search, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupportTickets, SupportTicket } from "@/hooks/useSupportTickets";
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

function statusLabel(s: string) {
  return s.replace(/_/g, " ");
}

export default function SupportTickets() {
  const navigate = useNavigate();
  const { ticketsQuery, createTicket } = useSupportTickets();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    category: "GENERAL",
    priority: "MEDIUM",
    description: "",
  });

  const tickets = ticketsQuery.data ?? [];

  const filtered = tickets.filter(
    (t) =>
      t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const byTab = (tab: string) => {
    if (tab === "all") return filtered;
    if (tab === "open") return filtered.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS");
    if (tab === "waiting") return filtered.filter((t) => t.status.startsWith("WAITING"));
    if (tab === "resolved") return filtered.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");
    return filtered;
  };

  const handleCreate = async () => {
    if (!form.subject || !form.description) return;
    await createTicket.mutateAsync(form);
    setForm({ subject: "", category: "GENERAL", priority: "MEDIUM", description: "" });
    setCreateOpen(false);
  };

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
          <DialogContent className="max-w-lg">
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
                      {["GENERAL", "BUG", "BILLING", "FEATURE_REQUEST", "DATA_ISSUE", "INTEGRATION", "OTHER"].map((c) => (
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
                      {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
          { label: "Open", count: tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length, icon: MessageSquare },
          { label: "Waiting on You", count: tickets.filter((t) => t.status === "WAITING_ON_DEALER").length, icon: AlertTriangle },
          { label: "Waiting on Support", count: tickets.filter((t) => t.status === "WAITING_ON_SUPERADMIN").length, icon: Clock },
          { label: "Resolved", count: tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length, icon: MessageSquare },
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

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="waiting">Waiting</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        {["all", "open", "waiting", "resolved"].map((tab) => (
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
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                            <Badge className={priorityColors[ticket.priority] || ""} variant="secondary">
                              {ticket.priority}
                            </Badge>
                            <Badge className={statusColors[ticket.status] || ""} variant="secondary">
                              {statusLabel(ticket.status)}
                            </Badge>
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
