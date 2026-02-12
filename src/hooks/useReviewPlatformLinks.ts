import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserDealerId } from "./useCustomers";

export function useReviewPlatformLinks() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["review-platform-links", dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_platform_links" as any)
        .select("*")
        .eq("dealer_id", dealerId!)
        .order("platform");
      if (error) throw error;
      return data as any[];
    },
    enabled: !!dealerId,
  });
}

export function useUpsertPlatformLink() {
  const qc = useQueryClient();
  const { data: dealerId } = useUserDealerId();
  return useMutation({
    mutationFn: async ({ platform, review_url }: { platform: string; review_url: string }) => {
      const { data, error } = await supabase
        .from("review_platform_links" as any)
        .upsert({ dealer_id: dealerId, platform, review_url, updated_at: new Date().toISOString() } as any, { onConflict: "dealer_id,platform" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["review-platform-links"] }),
  });
}

export function useDeletePlatformLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("review_platform_links" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["review-platform-links"] }),
  });
}

export function useSendReviewRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.functions.invoke("send-review-request", {
        body: { requestId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["review-requests"] }),
  });
}
