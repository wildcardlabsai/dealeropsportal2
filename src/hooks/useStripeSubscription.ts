import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface StripeSubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  price_id: string | null;
  subscription_end: string | null;
}

export function useStripeSubscription() {
  return useQuery({
    queryKey: ["stripe-subscription-status"],
    queryFn: async (): Promise<StripeSubscriptionStatus> => {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      return data as StripeSubscriptionStatus;
    },
    refetchInterval: 60000, // every minute
    staleTime: 30000,
  });
}

export async function startCheckout(priceId: string) {
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { priceId },
  });
  if (error) throw error;
  if (data?.url) {
    window.open(data.url, "_blank");
  }
}

export async function openCustomerPortal() {
  const { data, error } = await supabase.functions.invoke("customer-portal");
  if (error) throw error;
  if (data?.url) {
    window.open(data.url, "_blank");
  }
}
