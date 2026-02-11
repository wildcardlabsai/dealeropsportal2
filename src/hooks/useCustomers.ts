import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

export type Customer = Tables<"customers">;
export type CustomerInsert = TablesInsert<"customers">;
export type CustomerUpdate = TablesUpdate<"customers">;

export function useUserDealerId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dealer-id", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("dealer_id")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data?.dealer_id;
    },
    enabled: !!user,
  });
}

export function useCustomers(search?: string) {
  const { data: dealerId } = useUserDealerId();

  return useQuery({
    queryKey: ["customers", dealerId, search],
    queryFn: async () => {
      let query = supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,postcode.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customer: CustomerInsert) => {
      const { data, error } = await supabase
        .from("customers")
        .insert(customer)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: CustomerUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", data.id] });
    },
  });
}

export function useSoftDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customers")
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
