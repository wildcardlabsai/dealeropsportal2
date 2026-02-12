import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserDealerId } from "./useCustomers";

export const HANDOVER_STATUSES = ["draft", "in_progress", "awaiting_signature", "completed", "cancelled"] as const;

export const HANDOVER_STATUS_LABELS: Record<string, string> = {
  draft: "Draft", in_progress: "In Progress", awaiting_signature: "Awaiting Signature",
  completed: "Completed", cancelled: "Cancelled",
};

export const SECTION_LABELS: Record<string, string> = {
  documents: "Documents", vehicle_condition: "Vehicle Condition",
  controls_demo: "Controls Demo", warranty_info: "Warranty Info",
  finance_info: "Finance Info", keys_accessories: "Keys & Accessories",
  safety: "Safety", other: "Other",
};

export function useHandovers(statusFilter?: string) {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["handovers", dealerId, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("handovers")
        .select("*, customers(first_name, last_name), vehicles(vrm, make, model)")
        .order("created_at", { ascending: false });
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!dealerId,
  });
}

export function useHandover(id: string | undefined) {
  return useQuery({
    queryKey: ["handover", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("handovers")
        .select("*, customers(first_name, last_name, email, phone, address_line1, city, postcode), vehicles(vrm, make, model, vin, mileage, first_registration_date)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useHandoverItems(handoverId: string | undefined) {
  return useQuery({
    queryKey: ["handover-items", handoverId],
    queryFn: async () => {
      if (!handoverId) return [];
      const { data, error } = await supabase
        .from("handover_items")
        .select("*")
        .eq("handover_id", handoverId)
        .order("section", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!handoverId,
  });
}

export function useHandoverPhotos(handoverId: string | undefined) {
  return useQuery({
    queryKey: ["handover-photos", handoverId],
    queryFn: async () => {
      if (!handoverId) return [];
      const { data, error } = await supabase
        .from("handover_photos")
        .select("*")
        .eq("handover_id", handoverId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!handoverId,
  });
}

export function useHandoverTemplates() {
  return useQuery({
    queryKey: ["handover-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("handover_templates")
        .select("*")
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateHandover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (handover: any) => {
      const { data, error } = await supabase.from("handovers").insert(handover).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handovers"] });
    },
  });
}

export function useUpdateHandover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from("handovers").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["handovers"] });
      queryClient.invalidateQueries({ queryKey: ["handover", data.id] });
    },
  });
}

export function useCreateHandoverItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: any[]) => {
      const { error } = await supabase.from("handover_items").insert(items);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handover-items"] });
    },
  });
}

export function useUpdateHandoverItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from("handover_items").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handover-items"] });
    },
  });
}

export function useUploadHandoverPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ handoverId, dealerId, file, photoType, caption }: {
      handoverId: string; dealerId: string; file: File; photoType: string; caption?: string;
    }) => {
      const filePath = `${dealerId}/${handoverId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("handover-photos").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("handover-photos").getPublicUrl(filePath);
      const { error } = await supabase.from("handover_photos").insert({
        dealer_id: dealerId, handover_id: handoverId,
        photo_type: photoType, file_url: publicUrl, caption,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["handover-photos"] });
    },
  });
}

export function useHandoverStats() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["handover-stats", dealerId],
    queryFn: async () => {
      const { data } = await supabase.from("handovers").select("status, scheduled_delivery_at, created_at");
      const handovers = data || [];
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

      return {
        today: handovers.filter(h => h.scheduled_delivery_at && h.scheduled_delivery_at >= todayStart && h.scheduled_delivery_at < todayEnd).length,
        inProgress: handovers.filter(h => h.status === "in_progress").length,
        awaitingSignature: handovers.filter(h => h.status === "awaiting_signature").length,
        completedLast7: handovers.filter(h => h.status === "completed" && h.created_at >= weekAgo).length,
      };
    },
    enabled: !!dealerId,
  });
}
