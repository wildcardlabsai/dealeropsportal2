import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Paperclip, Lock, Download, Clock, CheckCircle, XCircle, User, Building2, Mail, Phone, Link2, X } from "lucide-react";
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
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
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

  // Get creator profile for ticket
  const ticket = ticketQuery.data;
  const { data: creatorProfile } = useQuery({
    queryKey: ["support-ticket-creator", ticket?.created_by_user_id],
    queryFn: async () => {
      if (!ticket?.created_by_user_id) return null;
      const { data } = await supabase.from("profiles").select("first_name, last_name").eq("id", ticket.created_by_user_id).single();
      return data;
    },
    enabled: !!ticket?.created_by_user_id,
  });

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
    await postReply.mutateAsync({
      message: reply,
      isInternalNote: isInternal,
      attachments: replyFiles.length > 0 ? replyFiles : undefined,
    });
    setReply("");
    setIsInternal(false);
    setReplyFiles([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setReplyFiles((prev) => [...prev, ...newFiles]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setReplyFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSingleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAttachment.mutateAsync(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const isClosed = ticket.status === "CLOSED";
  const canClose = !isSuperAdmin && (ticket.created_by_user_id === user?.id);

  // SLA indicators
  const slaFirstResponseOverdue =
    !ticket.first_response_at &&
    (Date.now() - new Date(ticket.created_at).getTime()) > 24 * 60 * 60 * 1000;

  const staleWaiting =
    ticket.status.startsWith("WAITING") &&
    (Date.now() - new Date(ticket.last_message_at).getTime()) > 3 * 24 * 60 * 60 * 1000;

  const dealerInfo = (ticket as any).dealers;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(isSuperAdmin ? "/app/admin/support" : "/app/support")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="p-6 rounded-xl border border-border/50 bg-card/50">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                  {staleWaiting && (
                    <Badge className="bg-orange-500/20 text-orange-400" variant="secondary">
                      <Clock className="h-3 w-3 mr-1" /> Stale
                    </Badge>
                  )}
                </div>
                <h1 className="text-xl font-bold">{ticket.subject}</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  {ticket.category.replace(/_/g, " ")} · Created {format(new Date(ticket.created_at), "dd MMM yyyy HH:mm")}
                  {creatorProfile && ` by ${creatorProfile.first_name || ""} ${creatorProfile.last_name || ""}`.trim()}
                </p>
                {ticket.related_entity_type !== "NONE" && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Linked: {ticket.related_entity_type}
                      {ticket.related_entity_id && ` (${ticket.related_entity_id.slice(0, 8)}...)`}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {isSuperAdmin && (
                  <>
                    <Select value={ticket.status} onValueChange={(v) => updateTicket.mutate({ status: v })}>
                      <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        {["OPEN", "IN_PROGRESS", "WAITING_ON_DEALER", "WAITING_ON_SUPERADMIN", "RESOLVED", "CLOSED"].map((s) => (
                          <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={ticket.priority} onValueChange={(v) => updateTicket.mutate({ priority: v })}>
                      <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
                      <SelectContent>
                        {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!ticket.assigned_to_superadmin_user_id && (
                      <Button size="sm" variant="outline" className="h-8 text-xs"
                        onClick={() => updateTicket.mutate({ assigned_to_superadmin_user_id: user?.id })}>
                        Assign to me
                      </Button>
                    )}
                    {ticket.assigned_to_superadmin_user_id === user?.id && (
                      <Button size="sm" variant="ghost" className="h-8 text-xs"
                        onClick={() => updateTicket.mutate({ assigned_to_superadmin_user_id: null })}>
                        Unassign
                      </Button>
                    )}
                  </>
                )}
                {!isSuperAdmin && !isClosed && canClose && (
                  <Button size="sm" variant="outline" onClick={() => updateTicket.mutate({ status: "CLOSED" })}>
                    <XCircle className="h-4 w-4 mr-1" /> Close
                  </Button>
                )}
                {!isSuperAdmin && isClosed && (
                  <Button size="sm" variant="outline" onClick={() => updateTicket.mutate({ status: "OPEN" })}>
                    Reopen
                  </Button>
                )}
              </div>
            </div>

            {/* SLA info */}
            {isSuperAdmin && (
              <div className="mt-4 flex gap-4 text-xs text-muted-foreground flex-wrap">
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
                {ticket.closed_at && (
                  <span>Closed: {format(new Date(ticket.closed_at), "dd MMM HH:mm")}</span>
                )}
              </div>
            )}
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="p-4 rounded-xl border border-border/50 bg-card/50">
              <p className="text-xs font-semibold mb-2">Attachments ({attachments.length})</p>
              <div className="flex flex-wrap gap-2">
                {attachments.map((a) => (
                  <a key={a.id} href={a.storage_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 text-xs transition-colors">
                    <Download className="h-3 w-3" />
                    {a.file_name}
                    {a.file_size && <span className="text-muted-foreground">({(a.file_size / 1024).toFixed(0)}KB)</span>}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Thread */}
          <div className="space-y-3">
            {messages.map((msg) => {
              const isAdmin = msg.author_role === "SUPERADMIN";
              // Get attachments linked to this message
              const msgAttachments = attachments.filter((a) => a.message_id === msg.id);
              return (
                <div key={msg.id}
                  className={`p-4 rounded-xl border ${
                    msg.is_internal_note
                      ? "border-yellow-500/30 bg-yellow-500/5"
                      : isAdmin
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50 bg-card/50"
                  }`}>
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
                  {msgAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msgAttachments.map((a) => (
                        <a key={a.id} href={a.storage_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded bg-muted/30 text-[10px] hover:bg-muted/50">
                          <Paperclip className="h-2.5 w-2.5" /> {a.file_name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reply box */}
          {!isClosed && (
            <div className="p-4 rounded-xl border border-border/50 bg-card/50">
              {isSuperAdmin && (
                <div className="flex items-center gap-2 mb-2">
                  <Button size="sm" variant={!isInternal ? "default" : "outline"} className="text-xs h-7"
                    onClick={() => setIsInternal(false)}>
                    Reply to Dealer
                  </Button>
                  <Button size="sm" variant={isInternal ? "default" : "outline"} className="text-xs h-7"
                    onClick={() => setIsInternal(true)}>
                    <Lock className="h-3 w-3 mr-1" /> Internal Note
                  </Button>
                </div>
              )}
              <Textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)}
                placeholder={isInternal ? "Add an internal note (not visible to dealer)..." : "Type your reply..."}
                className={isInternal ? "border-yellow-500/30" : ""} />

              {/* Reply attachments preview */}
              {replyFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {replyFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-1 px-2 py-1 rounded bg-muted/30 text-[10px]">
                      <Paperclip className="h-2.5 w-2.5" /> {f.name}
                      <button onClick={() => removeFile(i)} className="ml-1 text-muted-foreground hover:text-foreground">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <div>
                  <input ref={fileRef} type="file" className="hidden" multiple onChange={handleFileSelect} />
                  <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()}>
                    <Paperclip className="h-4 w-4 mr-1" /> Attach
                  </Button>
                </div>
                <Button size="sm" onClick={handleReply} disabled={postReply.isPending || !reply.trim()}>
                  <Send className="h-4 w-4 mr-1" />
                  {postReply.isPending ? "Sending..." : isInternal ? "Add Note" : "Send Reply"}
                </Button>
              </div>
            </div>
          )}

          {isClosed && (
            <div className="p-4 rounded-xl border border-border/50 bg-muted/20 text-center">
              <p className="text-sm text-muted-foreground">This ticket is closed.</p>
              {(canClose || isSuperAdmin) && (
                <Button size="sm" variant="outline" className="mt-2" onClick={() => updateTicket.mutate({ status: "OPEN" })}>
                  Reopen Ticket
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - dealer info (SuperAdmin only) */}
        {isSuperAdmin && (
          <div className="space-y-4">
            {/* Dealer Info */}
            {dealerInfo && (
              <div className="p-4 rounded-xl border border-border/50 bg-card/50">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> Dealer Info
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{dealerInfo.name}</p>
                  {dealerInfo.email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3 w-3" /> {dealerInfo.email}
                    </p>
                  )}
                  {dealerInfo.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3 w-3" /> {dealerInfo.phone}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Ticket Info */}
            <div className="p-4 rounded-xl border border-border/50 bg-card/50">
              <h3 className="text-sm font-semibold mb-3">Ticket Details</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(ticket.created_at), "dd MMM yyyy HH:mm")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span>{ticket.category.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created by</span>
                  <span>{creatorProfile ? `${creatorProfile.first_name || ""} ${creatorProfile.last_name || ""}`.trim() : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned to</span>
                  <span>{ticket.assigned_to_superadmin_user_id ? "You" : "Unassigned"}</span>
                </div>
                {ticket.related_entity_type !== "NONE" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Linked</span>
                    <span>{ticket.related_entity_type}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last activity</span>
                  <span>{format(new Date(ticket.last_message_at), "dd MMM HH:mm")}</span>
                </div>
              </div>
            </div>

            {/* SLA Panel */}
            <div className="p-4 rounded-xl border border-border/50 bg-card/50">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> SLA
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">First Response (24h)</span>
                  {ticket.first_response_at ? (
                    <Badge variant="secondary" className="text-[10px] bg-green-500/20 text-green-400">Met</Badge>
                  ) : slaFirstResponseOverdue ? (
                    <Badge variant="secondary" className="text-[10px] bg-red-500/20 text-red-400">Overdue</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Resolution (7 days)</span>
                  {ticket.resolved_at ? (
                    <Badge variant="secondary" className="text-[10px] bg-green-500/20 text-green-400">Resolved</Badge>
                  ) : (Date.now() - new Date(ticket.created_at).getTime()) > 7 * 24 * 60 * 60 * 1000 ? (
                    <Badge variant="secondary" className="text-[10px] bg-red-500/20 text-red-400">Overdue</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                  )}
                </div>
                {staleWaiting && (
                  <p className="text-orange-400 text-[10px] mt-1">⚠ No activity for 3+ days</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
