import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Search, Clock, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSupportTickets, SupportTicket } from "@/hooks/useSupportTickets";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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

export default function SuperAdminSupport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { allTicketsQuery } = useSupportTickets();
  const [search, setSearch] = useState("");

  const tickets = allTicketsQuery.data ?? [];

  const filtered = tickets.filter(
    (t) =>
      t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      (t.dealers?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const slaOverdue = (t: SupportTicket) =>
    !t.first_response_at && (Date.now() - new Date(t.created_at).getTime()) > 24 * 60 * 60 * 1000;

  const byTab = (tab: string) => {
    if (tab === "all") return filtered;
    if (tab === "unassigned") return filtered.filter((t) => !t.assigned_to_superadmin_user_id && t.status !== "CLOSED");
    if (tab === "assigned_me") return filtered.filter((t) => t.assigned_to_superadmin_user_id === user?.id);
    if (tab === "waiting_sa") return filtered.filter((t) => t.status === "WAITING_ON_SUPERADMIN");
    if (tab === "waiting_dealer") return filtered.filter((t) => t.status === "WAITING_ON_DEALER");
    if (tab === "urgent") return filtered.filter((t) => t.priority === "URGENT" && t.status !== "CLOSED");
    if (tab === "resolved") return filtered.filter((t) => t.status === "RESOLVED");
    if (tab === "closed") return filtered.filter((t) => t.status === "CLOSED");
    return filtered;
  };

  const exportCSV = () => {
    const headers = ["Ticket", "Dealer", "Subject", "Status", "Priority", "Category", "Created", "Last Activity"];
    const rows = filtered.map((t) => [
      t.ticket_number,
      t.dealers?.name || "",
      t.subject,
      t.status,
      t.priority,
      t.category,
      format(new Date(t.created_at), "yyyy-MM-dd"),
      format(new Date(t.last_message_at), "yyyy-MM-dd HH:mm"),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `support-tickets-${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { value: "all", label: "All" },
    { value: "unassigned", label: "Unassigned" },
    { value: "assigned_me", label: "My Tickets" },
    { value: "waiting_sa", label: "Waiting on You" },
    { value: "waiting_dealer", label: "Waiting on Dealer" },
    { value: "urgent", label: "Urgent" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Support Inbox</h1>
          <p className="text-sm text-muted-foreground">All dealer support tickets</p>
        </div>
        <Button size="sm" variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Open", count: tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length },
          { label: "Waiting on You", count: tickets.filter((t) => t.status === "WAITING_ON_SUPERADMIN").length },
          { label: "Urgent", count: tickets.filter((t) => t.priority === "URGENT" && t.status !== "CLOSED").length },
          { label: "SLA Overdue", count: tickets.filter(slaOverdue).length },
          { label: "Unassigned", count: tickets.filter((t) => !t.assigned_to_superadmin_user_id && t.status !== "CLOSED").length },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-xl border border-border/50 bg-card/50">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold">{s.count}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search tickets, dealers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex-wrap">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">
              {t.label} ({byTab(t.value).length})
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <div className="rounded-xl border border-border/50 overflow-hidden">
              {byTab(tab.value).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No tickets</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {byTab(tab.value).map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/app/support/${ticket.id}`)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                            {ticket.dealers?.name && (
                              <Badge variant="outline" className="text-[10px]">{ticket.dealers.name}</Badge>
                            )}
                            <Badge className={priorityColors[ticket.priority]} variant="secondary">{ticket.priority}</Badge>
                            <Badge className={statusColors[ticket.status]} variant="secondary">{ticket.status.replace(/_/g, " ")}</Badge>
                            {slaOverdue(ticket) && (
                              <Badge className="bg-red-500/20 text-red-400" variant="secondary">
                                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> SLA
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {ticket.category.replace(/_/g, " ")} · Last activity {format(new Date(ticket.last_message_at), "dd MMM HH:mm")}
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
