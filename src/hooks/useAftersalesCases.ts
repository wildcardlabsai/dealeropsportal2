import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserDealerId } from "./useCustomers";
import { useAuth } from "@/contexts/AuthContext";

export interface AftersalesCase {
  id: string;
  dealer_id: string;
  case_number: string;
  customer_id: string | null;
  vehicle_id: string | null;
  invoice_id: string | null;
  warranty_id: string | null;
  created_by_user_id: string;
  assigned_to_user_id: string | null;
  complaint_date: string;
  sale_date: string | null;
  cra_window: string | null;
  issue_category: string;
  issue_subcategory: string | null;
  summary: string;
  description: string;
  priority: string;
  status: string;
  outcome: string | null;
  cost_estimate: number | null;
  goodwill_amount: number | null;
  internal_notes: string | null;
  customer_comms_notes: string | null;
  last_contacted_at: string | null;
  next_action_at: string | null;
  sla_target_hours: number;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  customers?: { first_name: string; last_name: string } | null;
  vehicles?: { vrm: string | null; make: string | null; model: string | null } | null;
  assigned_profile?: { first_name: string | null; last_name: string | null } | null;
}

export function useAftersalesCases(search?: string, statusFilter?: string) {
  const { data: dealerId } = useUserDealerId();

  return useQuery({
    queryKey: ["aftersales-cases", dealerId, search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("aftersales_cases")
        .select("*, customers(first_name, last_name), vehicles(vrm, make, model)")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`summary.ilike.%${search}%,case_number.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as AftersalesCase[];
    },
    enabled: !!dealerId,
  });
}

export function useAftersalesCase(id: string | undefined) {
  return useQuery({
    queryKey: ["aftersales-case", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("aftersales_cases")
        .select("*, customers(first_name, last_name, email, phone), vehicles(vrm, make, model, year)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as unknown as AftersalesCase;
    },
    enabled: !!id,
  });
}

export function useCreateAftersalesCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (caseData: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from("aftersales_cases")
        .insert(caseData as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aftersales-cases"] });
    },
  });
}

export function useUpdateAftersalesCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase
        .from("aftersales_cases")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["aftersales-cases"] });
      queryClient.invalidateQueries({ queryKey: ["aftersales-case", variables.id] });
    },
  });
}

// Timeline updates
export function useAftersalesUpdates(caseId: string | undefined) {
  return useQuery({
    queryKey: ["aftersales-updates", caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const { data, error } = await supabase
        .from("aftersales_updates")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });
}

export function useCreateAftersalesUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (update: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from("aftersales_updates")
        .insert(update as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["aftersales-updates", data.case_id] });
      queryClient.invalidateQueries({ queryKey: ["aftersales-cases"] });
    },
  });
}

// Attachments
export function useAftersalesAttachments(caseId: string | undefined) {
  return useQuery({
    queryKey: ["aftersales-attachments", caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const { data, error } = await supabase
        .from("aftersales_attachments")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });
}

export function useUploadAftersalesAttachment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: dealerId } = useUserDealerId();

  return useMutation({
    mutationFn: async ({ caseId, file }: { caseId: string; file: File }) => {
      if (!dealerId || !user) throw new Error("Not authenticated");
      const filePath = `${dealerId}/${caseId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("aftersales-attachments")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("aftersales_attachments")
        .insert({
          dealer_id: dealerId,
          case_id: caseId,
          uploaded_by_user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["aftersales-attachments", data.case_id] });
    },
  });
}
