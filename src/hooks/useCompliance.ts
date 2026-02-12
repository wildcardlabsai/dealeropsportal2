import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserDealerId } from "./useCustomers";
import { useAuth } from "@/contexts/AuthContext";

// ── Customer Consents ──
export function useCustomerConsents(customerId?: string) {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["customer-consents", dealerId, customerId],
    queryFn: async () => {
      let q = supabase.from("customer_consents").select("*, customers(first_name, last_name, email)").order("captured_at", { ascending: false });
      if (customerId) q = q.eq("customer_id", customerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

export function useCreateConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Record<string, unknown>) => {
      const { data, error } = await supabase.from("customer_consents").insert(d as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer-consents"] }),
  });
}

export function useUpdateConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: { id: string; [k: string]: unknown }) => {
      const { data, error } = await supabase.from("customer_consents").update(u as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer-consents"] }),
  });
}

// ── Data Subject Requests ──
export function useDataSubjectRequests(statusFilter?: string) {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["dsr", dealerId, statusFilter],
    queryFn: async () => {
      let q = supabase.from("data_subject_requests").select("*, customers(first_name, last_name)").order("created_at", { ascending: false });
      if (statusFilter && statusFilter !== "all") q = q.eq("status", statusFilter as any);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

export function useCreateDSR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Record<string, unknown>) => {
      const { data, error } = await supabase.from("data_subject_requests").insert(d as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dsr"] }),
  });
}

export function useUpdateDSR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: { id: string; [k: string]: unknown }) => {
      const { data, error } = await supabase.from("data_subject_requests").update(u as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dsr"] }),
  });
}

// ── Retention Settings ──
export function useRetentionSettings() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["retention-settings", dealerId],
    queryFn: async () => {
      if (!dealerId) return null;
      const { data, error } = await supabase.from("retention_settings").select("*").eq("dealer_id", dealerId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

export function useUpsertRetentionSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Record<string, unknown>) => {
      const { data, error } = await supabase.from("retention_settings").upsert(d as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retention-settings"] }),
  });
}

// ── Retention Queue ──
export function useRetentionQueue(statusFilter?: string) {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["retention-queue", dealerId, statusFilter],
    queryFn: async () => {
      let q = supabase.from("retention_queue").select("*").order("eligible_at", { ascending: true });
      if (statusFilter && statusFilter !== "all") q = q.eq("status", statusFilter as any);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

export function useCreateRetentionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Record<string, unknown>) => {
      const { data, error } = await supabase.from("retention_queue").insert(d as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retention-queue"] }),
  });
}

export function useUpdateRetentionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: { id: string; [k: string]: unknown }) => {
      const { data, error } = await supabase.from("retention_queue").update(u as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retention-queue"] }),
  });
}

// ── Complaints ──
export function useComplaints(statusFilter?: string) {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["complaints", dealerId, statusFilter],
    queryFn: async () => {
      let q = supabase.from("complaints").select("*, customers(first_name, last_name)").order("created_at", { ascending: false });
      if (statusFilter && statusFilter !== "all") q = q.eq("status", statusFilter as any);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

export function useCreateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Record<string, unknown>) => {
      const { data, error } = await supabase.from("complaints").insert(d as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["complaints"] }),
  });
}

export function useUpdateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: { id: string; [k: string]: unknown }) => {
      const { data, error } = await supabase.from("complaints").update(u as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["complaints"] }),
  });
}

// ── Compliance Documents ──
export function useComplianceDocuments() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["compliance-docs", dealerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("compliance_documents").select("*").order("doc_type", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

export function useCreateComplianceDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Record<string, unknown>) => {
      const { data, error } = await supabase.from("compliance_documents").insert(d as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compliance-docs"] }),
  });
}

export function useUpdateComplianceDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: { id: string; [k: string]: unknown }) => {
      const { data, error } = await supabase.from("compliance_documents").update(u as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compliance-docs"] }),
  });
}

// ── Compliance Incidents ──
export function useComplianceIncidents() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["compliance-incidents", dealerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("compliance_incidents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Record<string, unknown>) => {
      const { data, error } = await supabase.from("compliance_incidents").insert(d as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compliance-incidents"] }),
  });
}

export function useUpdateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: { id: string; [k: string]: unknown }) => {
      const { data, error } = await supabase.from("compliance_incidents").update(u as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compliance-incidents"] }),
  });
}
