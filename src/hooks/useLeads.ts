import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserDealerId } from "./useCustomers";
import { useAuth } from "@/contexts/AuthContext";

export type LeadStage = "new" | "contacted" | "appointment_set" | "test_drive" | "finance" | "negotiating" | "reserved" | "sold" | "lost";

export const STAGE_ORDER: LeadStage[] = [
  "new", "contacted", "appointment_set", "test_drive", "finance", "negotiating", "reserved", "sold", "lost"
];

export const STAGE_LABELS: Record<string, string> = {
  new: "New", contacted: "Contacted", appointment_set: "Appointment Set",
  test_drive: "Test Drive", finance: "Finance", negotiating: "Negotiation",
  reserved: "Reserved", sold: "Sold", lost: "Lost",
};

export const SOURCE_LABELS: Record<string, string> = {
  walk_in: "Walk-in", phone: "Phone", website: "Website",
  autotrader: "AutoTrader", ebay: "eBay", facebook: "Facebook",
  referral: "Referral", other: "Other",
};

export function useLeads(search?: string, statusFilter?: string) {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["leads", dealerId, search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("*, vehicles(vrm, make, model)")
        .order("created_at", { ascending: false });
      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,lead_number.ilike.%${search}%,vehicle_interest_text.ilike.%${search}%`
        );
      }
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("stage", statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

export function useLeadsByStage() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["leads-pipeline", dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, vehicles(vrm, make, model)")
        .neq("stage", "lost")
        .neq("stage", "sold")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const grouped: Record<string, typeof data> = {};
      STAGE_ORDER.forEach(s => grouped[s] = []);
      data?.forEach(lead => {
        const stage = (lead as any).stage || "new";
        if (!grouped[stage]) grouped[stage] = [];
        grouped[stage].push(lead);
      });
      return grouped;
    },
    enabled: !!dealerId,
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("leads")
        .select("*, vehicles(vrm, make, model), customers(first_name, last_name, email, phone)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useLeadActivities(leadId: string | undefined) {
  return useQuery({
    queryKey: ["lead-activities", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", leadId)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!leadId,
  });
}

export function useLeadAppointments(leadId: string | undefined) {
  return useQuery({
    queryKey: ["lead-appointments", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from("lead_appointments")
        .select("*")
        .eq("lead_id", leadId)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!leadId,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lead: any) => {
      const { data, error } = await supabase.from("leads").insert(lead).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads-pipeline"] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from("leads").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["lead", data.id] });
    },
  });
}

export function useAddLeadActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (activity: any) => {
      const { data, error } = await supabase.from("lead_activities").insert(activity).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_: any, vars: any) => {
      queryClient.invalidateQueries({ queryKey: ["lead-activities", vars.lead_id] });
    },
  });
}

export function useCreateLeadAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appt: any) => {
      const { data, error } = await supabase.from("lead_appointments").insert(appt).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_: any, vars: any) => {
      queryClient.invalidateQueries({ queryKey: ["lead-appointments", vars.lead_id] });
    },
  });
}

export function useLeadStats() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["lead-stats", dealerId],
    queryFn: async () => {
      const { data: allLeads } = await supabase.from("leads").select("stage, status, source, assigned_to, created_at");
      const leads = allLeads || [];
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      return {
        open: leads.filter(l => (l as any).status !== "won" && (l as any).status !== "lost").length,
        newToday: leads.filter(l => l.created_at >= todayStart).length,
        wonThisMonth: leads.filter(l => (l as any).stage === "sold" && l.created_at >= monthStart).length,
        lostThisMonth: leads.filter(l => (l as any).stage === "lost" && l.created_at >= monthStart).length,
        total: leads.length,
      };
    },
    enabled: !!dealerId,
  });
}
