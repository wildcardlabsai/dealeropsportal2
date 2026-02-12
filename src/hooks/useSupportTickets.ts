import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SupportTicket {
  id: string;
  dealer_id: string;
  ticket_number: string;
  created_by_user_id: string;
  assigned_to_superadmin_user_id: string | null;
  subject: string;
  category: string;
  priority: string;
  status: string;
  related_entity_type: string;
  related_entity_id: string | null;
  last_message_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  dealers?: { name: string } | null;
  creator_profile?: { first_name: string | null; last_name: string | null } | null;
}

export interface SupportMessage {
  id: string;
  dealer_id: string;
  ticket_id: string;
  author_user_id: string | null;
  author_role: string;
  message: string;
  is_internal_note: boolean;
  created_at: string;
  author_profile?: { first_name: string | null; last_name: string | null } | null;
}

export interface SupportAttachment {
  id: string;
  dealer_id: string;
  ticket_id: string;
  message_id: string | null;
  uploaded_by_user_id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_url: string;
  created_at: string;
}

async function getDealerId(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("dealer_id")
    .eq("id", userId)
    .single();
  return data?.dealer_id;
}

async function checkSuperAdmin(userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  return !!data;
}

async function checkDealerAdmin(userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "dealer_admin")
    .maybeSingle();
  return !!data;
}

async function checkPermission(userId: string, dealerId: string, key: string) {
  const { data } = await supabase
    .from("permission_flags")
    .select("enabled")
    .eq("user_id", userId)
    .eq("dealer_id", dealerId)
    .eq("key", key)
    .maybeSingle();
  return data?.enabled ?? false;
}

export function useSupportTickets() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const ticketsQuery = useQuery({
    queryKey: ["support-tickets", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const isSA = await checkSuperAdmin(user.id);
      const dealerId = await getDealerId(user.id);

      let query = supabase
        .from("support_tickets")
        .select("*")
        .order("last_message_at", { ascending: false });

      if (!isSA && dealerId) {
        query = query.eq("dealer_id", dealerId);
        const isAdmin = await checkDealerAdmin(user.id);
        const hasViewAll = dealerId ? await checkPermission(user.id, dealerId, "Support.ViewAllDealerTickets") : false;
        if (!isAdmin && !hasViewAll) {
          query = query.eq("created_by_user_id", user.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as SupportTicket[];
    },
    enabled: !!user,
  });

  const allTicketsQuery = useQuery({
    queryKey: ["support-tickets-admin", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const isSA = await checkSuperAdmin(user.id);
      if (!isSA) return [];

      const { data, error } = await supabase
        .from("support_tickets")
        .select("*, dealers(name)")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SupportTicket[];
    },
    enabled: !!user,
  });

  const createTicket = useMutation({
    mutationFn: async (input: {
      subject: string;
      category: string;
      priority: string;
      description: string;
      related_entity_type?: string;
      related_entity_id?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const dealerId = await getDealerId(user.id);
      if (!dealerId) throw new Error("No dealer");

      const { data: ticket, error } = await supabase
        .from("support_tickets")
        .insert({
          dealer_id: dealerId,
          created_by_user_id: user.id,
          subject: input.subject,
          category: input.category,
          priority: input.priority,
          related_entity_type: input.related_entity_type || "NONE",
          related_entity_id: input.related_entity_id || null,
        } as any)
        .select()
        .single();
      if (error) throw error;

      const { error: msgErr } = await supabase.from("support_messages").insert({
        dealer_id: dealerId,
        ticket_id: ticket.id,
        author_user_id: user.id,
        author_role: "DEALER",
        message: input.description,
      } as any);
      if (msgErr) throw msgErr;

      await supabase.from("audit_logs").insert({
        dealer_id: dealerId,
        actor_user_id: user.id,
        action_type: "SUPPORT_TICKET_CREATED",
        entity_type: "support_ticket",
        entity_id: ticket.id,
        after_data: ticket as any,
      });

      return ticket;
    },
    onSuccess: () => {
      toast.success("Ticket created");
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      qc.invalidateQueries({ queryKey: ["support-tickets-admin"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { ticketsQuery, allTicketsQuery, createTicket };
}

export function useSupportTicketDetail(ticketId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const ticketQuery = useQuery({
    queryKey: ["support-ticket", ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*, dealers(name)")
        .eq("id", ticketId)
        .single();
      if (error) throw error;
      return data as SupportTicket;
    },
    enabled: !!ticketId && !!user,
  });

  const messagesQuery = useQuery({
    queryKey: ["support-messages", ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Fetch profiles for author_user_ids
      const userIds = [...new Set((data ?? []).map((m: any) => m.author_user_id).filter(Boolean))];
      let profiles: Record<string, { first_name: string | null; last_name: string | null }> = {};
      if (userIds.length > 0) {
        const { data: pData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", userIds);
        (pData ?? []).forEach((p: any) => { profiles[p.id] = p; });
      }

      return (data ?? []).map((m: any) => ({
        ...m,
        author_profile: m.author_user_id ? profiles[m.author_user_id] || null : null,
      })) as SupportMessage[];
    },
    enabled: !!ticketId && !!user,
  });

  const attachmentsQuery = useQuery({
    queryKey: ["support-attachments", ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await supabase
        .from("support_attachments")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SupportAttachment[];
    },
    enabled: !!ticketId && !!user,
  });

  const postReply = useMutation({
    mutationFn: async (input: { message: string; isInternalNote?: boolean }) => {
      if (!user || !ticketId) throw new Error("Missing context");
      const ticket = ticketQuery.data;
      if (!ticket) throw new Error("No ticket");
      const isSA = await checkSuperAdmin(user.id);

      const { error: msgErr } = await supabase.from("support_messages").insert({
        dealer_id: ticket.dealer_id,
        ticket_id: ticketId,
        author_user_id: user.id,
        author_role: isSA ? "SUPERADMIN" : "DEALER",
        message: input.message,
        is_internal_note: input.isInternalNote ?? false,
      } as any);
      if (msgErr) throw msgErr;

      const updates: any = { last_message_at: new Date().toISOString() };

      if (isSA && !input.isInternalNote) {
        if (!ticket.first_response_at) {
          updates.first_response_at = new Date().toISOString();
        }
        if (ticket.status !== "CLOSED" && ticket.status !== "RESOLVED") {
          updates.status = "WAITING_ON_DEALER";
        }
      } else if (!isSA) {
        if (ticket.status !== "CLOSED" && ticket.status !== "RESOLVED") {
          updates.status = "WAITING_ON_SUPERADMIN";
        }
      }

      await supabase.from("support_tickets").update(updates).eq("id", ticketId);

      await supabase.from("audit_logs").insert({
        dealer_id: ticket.dealer_id,
        actor_user_id: user.id,
        action_type: input.isInternalNote ? "SUPPORT_INTERNAL_NOTE" : "SUPPORT_REPLY",
        entity_type: "support_ticket",
        entity_id: ticketId,
      });
    },
    onSuccess: () => {
      toast.success("Reply posted");
      qc.invalidateQueries({ queryKey: ["support-messages", ticketId] });
      qc.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      qc.invalidateQueries({ queryKey: ["support-tickets-admin"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateTicket = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (!user || !ticketId) throw new Error("Missing context");
      const ticket = ticketQuery.data;
      if (!ticket) throw new Error("No ticket");

      const finalUpdates: any = { ...updates };
      if (updates.status === "RESOLVED") finalUpdates.resolved_at = new Date().toISOString();
      if (updates.status === "CLOSED") finalUpdates.closed_at = new Date().toISOString();

      const { error } = await supabase.from("support_tickets").update(finalUpdates).eq("id", ticketId);
      if (error) throw error;

      await supabase.from("audit_logs").insert({
        dealer_id: ticket.dealer_id,
        actor_user_id: user.id,
        action_type: "SUPPORT_TICKET_UPDATED",
        entity_type: "support_ticket",
        entity_id: ticketId,
        before_data: ticket as any,
        after_data: finalUpdates,
      });
    },
    onSuccess: () => {
      toast.success("Ticket updated");
      qc.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      qc.invalidateQueries({ queryKey: ["support-tickets-admin"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const uploadAttachment = useMutation({
    mutationFn: async (file: File) => {
      if (!user || !ticketId) throw new Error("Missing context");
      const ticket = ticketQuery.data;
      if (!ticket) throw new Error("No ticket");

      const filePath = `${ticket.dealer_id}/${ticketId}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("support-attachments")
        .upload(filePath, file);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from("support-attachments")
        .getPublicUrl(filePath);

      const { error: dbErr } = await supabase.from("support_attachments").insert({
        dealer_id: ticket.dealer_id,
        ticket_id: ticketId,
        uploaded_by_user_id: user.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_url: urlData.publicUrl,
      } as any);
      if (dbErr) throw dbErr;

      await supabase.from("audit_logs").insert({
        dealer_id: ticket.dealer_id,
        actor_user_id: user.id,
        action_type: "SUPPORT_ATTACHMENT_UPLOADED",
        entity_type: "support_attachment",
        entity_id: ticketId,
      });
    },
    onSuccess: () => {
      toast.success("File uploaded");
      qc.invalidateQueries({ queryKey: ["support-attachments", ticketId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { ticketQuery, messagesQuery, attachmentsQuery, postReply, updateTicket, uploadAttachment };
}
