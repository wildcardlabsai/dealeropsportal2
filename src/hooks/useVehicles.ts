import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useUserDealerId } from "./useCustomers";

export type Vehicle = Tables<"vehicles">;
export type VehicleInsert = TablesInsert<"vehicles">;
export type VehicleUpdate = TablesUpdate<"vehicles">;

export function useVehicles(search?: string, statusFilter?: string) {
  const { data: dealerId } = useUserDealerId();

  return useQuery({
    queryKey: ["vehicles", dealerId, search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("vehicles")
        .select("*, customers(first_name, last_name)")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(
          `vrm.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%,colour.ilike.%${search}%`
        );
      }

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter as Vehicle["status"]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, customers(id, first_name, last_name, email, phone)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vehicle: VehicleInsert) => {
      const { data, error } = await supabase
        .from("vehicles")
        .insert(vehicle)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: VehicleUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("vehicles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", data.id] });
    },
  });
}
