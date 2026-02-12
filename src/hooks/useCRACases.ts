import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserDealerId } from "./useCustomers";
import { useAuth } from "@/contexts/AuthContext";

export function useCRACases(statusFilter?: string) {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["cra-cases", dealerId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("cra_cases")
        .select("*")
        .order("created_at", { ascending: false });
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("case_status", statusFilter as any);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

export function useCRACase(id: string | undefined) {
  return useQuery({
    queryKey: ["cra-case", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("cra_cases")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCRACase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (caseData: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from("cra_cases")
        .insert(caseData as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cra-cases"] });
    },
  });
}

export function useUpdateCRACase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase
        .from("cra_cases")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cra-cases"] });
      queryClient.invalidateQueries({ queryKey: ["cra-case", variables.id] });
    },
  });
}

export function useCRACaseActivities(caseId: string | undefined) {
  return useQuery({
    queryKey: ["cra-activities", caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const { data, error } = await supabase
        .from("cra_case_activities")
        .select("*")
        .eq("cra_case_id", caseId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });
}

export function useCreateCRACaseActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (activity: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from("cra_case_activities")
        .insert(activity as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["cra-activities", data.cra_case_id] });
    },
  });
}

export function useCRACaseDocuments(caseId: string | undefined) {
  return useQuery({
    queryKey: ["cra-documents", caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const { data, error } = await supabase
        .from("cra_case_documents")
        .select("*")
        .eq("cra_case_id", caseId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });
}

export function useUploadCRADocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: dealerId } = useUserDealerId();

  return useMutation({
    mutationFn: async ({ caseId, file, documentType }: { caseId: string; file: File; documentType: string }) => {
      if (!dealerId || !user) throw new Error("Not authenticated");
      const filePath = `${dealerId}/${caseId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("cra-evidence").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("cra_case_documents")
        .insert({
          dealer_id: dealerId,
          cra_case_id: caseId,
          uploaded_by_user_id: user.id,
          document_type: documentType,
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
      queryClient.invalidateQueries({ queryKey: ["cra-documents", data.cra_case_id] });
    },
  });
}
