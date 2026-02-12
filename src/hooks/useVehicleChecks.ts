import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useUserDealerId } from "./useCustomers";
import { useAuth } from "@/contexts/AuthContext";

export type VehicleCheck = Tables<"vehicle_checks">;

export function useVehicleChecks(search?: string) {
  const { data: dealerId } = useUserDealerId();

  return useQuery({
    queryKey: ["vehicle-checks", dealerId, search],
    queryFn: async () => {
      let query = supabase
        .from("vehicle_checks")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("vrm", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

export function useVehicleCheck(id: string | undefined) {
  return useQuery({
    queryKey: ["vehicle-check", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("vehicle_checks")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useRunVehicleCheck() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: dealerId } = useUserDealerId();

  return useMutation({
    mutationFn: async ({ vrm, forceFresh = false }: { vrm: string; forceFresh?: boolean }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vehicle-check`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ vrm, dealer_id: dealerId, force_fresh: forceFresh }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Check failed" }));
        throw new Error(err.error || "Vehicle check failed");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-checks"] });
    },
  });
}
