import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Paperclip, Lock, Download, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupportTicketDetail } from "@/hooks/useSupportTickets";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

export default function SupportTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ticketQuery, messagesQuery, attachmentsQuery, postReply, updateTicket, uploadAttachment } = useSupportTicketDetail(id);
  const [reply, setReply] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: isSuperAdmin } = useQuery({
    queryKey: ["is-super-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "super_admin").maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const ticket = ticketQuery.data;
  const messages = messagesQuery.data ?? [];
  const attachments = attachmentsQuery.data ?? [];

  if (ticketQuery.isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!ticket) {
    return <div className="p-8 text-center text-muted-foreground">Ticket not found</div>;
  }

  const handleReply = async () => {
    if (!reply.trim()) return;
    await postReply.mutateAsync({ message: reply, isInternalNote: isInternal });
    setReply("");
    setIsInternal(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAttachment.mutateAsync(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const isClosed = ticket.status === "CLOSED";

  // SLA: first response overdue (24h default)
  const slaFirstResponseOverdue =
    !ticket.first_response_at &&
    (Date.now() - new Date(ticket.created_at).getTime()) > 24 * 60 * 60 * 1000;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(isSuperAdmin ? "/app/admin/support" : "/app/support")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
      </Button>

      {/* Header */}
      <div className="p-6 rounded-xl border border-border/50 bg-card/50 mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono text-muted-foreground">{ticket.ticket_number}</span>
              <Badge className={statusColors[ticket.status]} variant="secondary">
                {ticket.status.replace(/_/g, " ")}
              </Badge>
              <Badge className={priorityColors[ticket.priority]} variant="secondary">
                {ticket.priority}
              </Badge>
              {slaFirstResponseOverdue && (
                <Badge className="bg-red-500/20 text-red-400" variant="secondary">
                  <Clock className="h-3 w-3 mr-1" /> SLA Overdue
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold">{ticket.subject}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {ticket.category.replace(/_/g, " ")} · Created {format(new Date(ticket.created_at), "dd MMM yyyy HH:mm")}
              {(ticket as any).dealers?.name && ` · ${(ticket as any).dealers.name}`}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {isSuperAdmin && (
              <>
                <Select
                  value={ticket.status}
                  onValueChange={(v) => updateTicket.mutate({ status: v })}
                >
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {["OPEN", "IN_PROGRESS", "WAITING_ON_DEALER", "WAITING_ON_SUPERADMIN", "RESOLVED", "CLOSED"].map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={ticket.priority}
                  onValueChange={(v) => updateTicket.mutate({ priority: v })}
                >
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            {!isSuperAdmin && !isClosed && (
              <Button size="sm" variant="outline" onClick={() => updateTicket.mutate({ status: "CLOSED" })}>
                <XCircle className="h-4 w-4 mr-1" /> Close
              </Button>
            )}
            {!isSuperAdmin && isClosed && (
              <Button size="sm" variant="outline" onClick={() => updateTicket.mutate({ status: "OPEN" })}>
                Reopen
              </Button>
            )}
            {isSuperAdmin && ticket.status === "RESOLVED" && (
              <Button size="sm" variant="outline" onClick={() => updateTicket.mutate({ status: "CLOSED" })}>
                Close
              </Button>
            )}
          </div>
        </div>

        {/* SLA info */}
        {isSuperAdmin && (
          <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              {ticket.first_response_at ? (
                <><CheckCircle className="h-3 w-3 text-green-400" /> First response: {format(new Date(ticket.first_response_at), "dd MMM HH:mm")}</>
              ) : (
                <><Clock className="h-3 w-3 text-orange-400" /> Awaiting first response</>
              )}
            </span>
            {ticket.resolved_at && (
              <span>Resolved: {format(new Date(ticket.resolved_at), "dd MMM HH:mm")}</span>
            )}
          </div>
        )}
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="p-4 rounded-xl border border-border/50 bg-card/50 mb-4">
          <p className="text-xs font-semibold mb-2">Attachments ({attachments.length})</p>
          <div className="flex flex-wrap gap-2">
            {attachments.map((a) => (
              <a
                key={a.id}
                href={a.storage_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 text-xs transition-colors"
              >
                <Download className="h-3 w-3" />
                {a.file_name}
                {a.file_size && <span className="text-muted-foreground">({(a.file_size / 1024).toFixed(0)}KB)</span>}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Thread */}
      <div className="space-y-3 mb-4">
        {messages.map((msg) => {
          const isAdmin = msg.author_role === "SUPERADMIN";
          return (
            <div
              key={msg.id}
              className={`p-4 rounded-xl border ${
                msg.is_internal_note
                  ? "border-yellow-500/30 bg-yellow-500/5"
                  : isAdmin
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/50 bg-card/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium">
                  {msg.author_profile
                    ? `${msg.author_profile.first_name || ""} ${msg.author_profile.last_name || ""}`.trim() || "User"
                    : "User"}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {isAdmin ? "Support" : "Dealer"}
                </Badge>
                {msg.is_internal_note && (
                  <Badge variant="secondary" className="text-[10px] bg-yellow-500/20 text-yellow-400">
                    <Lock className="h-2.5 w-2.5 mr-0.5" /> Internal
                  </Badge>
                )}
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {format(new Date(msg.created_at), "dd MMM yyyy HH:mm")}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
            </div>
          );
        })}
      </div>

      {/* Reply box */}
      {!isClosed && (
        <div className="p-4 rounded-xl border border-border/50 bg-card/50">
          {isSuperAdmin && (
            <div className="flex items-center gap-2 mb-2">
              <Button
                size="sm"
                variant={!isInternal ? "default" : "outline"}
                className="text-xs h-7"
                onClick={() => setIsInternal(false)}
              >
                Reply to Dealer
              </Button>
              <Button
                size="sm"
                variant={isInternal ? "default" : "outline"}
                className="text-xs h-7"
                onClick={() => setIsInternal(true)}
              >
                <Lock className="h-3 w-3 mr-1" /> Internal Note
              </Button>
            </div>
          )}
          <Textarea
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={isInternal ? "Add an internal note (not visible to dealer)..." : "Type your reply..."}
            className={isInternal ? "border-yellow-500/30" : ""}
          />
          <div className="flex items-center justify-between mt-2">
            <div>
              <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
              <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()} disabled={uploadAttachment.isPending}>
                <Paperclip className="h-4 w-4 mr-1" />
                {uploadAttachment.isPending ? "Uploading..." : "Attach"}
              </Button>
            </div>
            <Button size="sm" onClick={handleReply} disabled={postReply.isPending || !reply.trim()}>
              <Send className="h-4 w-4 mr-1" />
              {postReply.isPending ? "Sending..." : isInternal ? "Add Note" : "Send Reply"}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
