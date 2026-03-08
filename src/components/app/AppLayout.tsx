import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { DealerAIChat } from "./DealerAIChat";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, AlertTriangle, CreditCard, Command, LayoutDashboard, Users, Car, Target, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "./CommandPalette";
import { AppBreadcrumb } from "./AppBreadcrumb";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserDealerId } from "@/hooks/useCustomers";
import { useStripeSubscription } from "@/hooks/useStripeSubscription";
import { differenceInDays } from "date-fns";

function TrialBanner() {
  const { data: dealerId } = useUserDealerId();
  const { data: stripeStatus } = useStripeSubscription();

  const { data: dealer } = useQuery({
    queryKey: ["dealer-trial", dealerId],
    queryFn: async () => {
      if (!dealerId) return null;
      const { data } = await supabase
        .from("dealers")
        .select("status, trial_ends_at")
        .eq("id", dealerId)
        .single();
      return data;
    },
    enabled: !!dealerId,
  });

  // Don't show banner if they have an active Stripe subscription
  if (stripeStatus?.subscribed) return null;
  // Only show for trial dealers
  if (!dealer || dealer.status !== "trial" || !dealer.trial_ends_at) return null;

  const trialEnd = new Date(dealer.trial_ends_at);
  const daysLeft = Math.max(0, differenceInDays(trialEnd, new Date()));
  const isExpired = daysLeft === 0;

  if (isExpired) {
    return (
      <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive font-medium">
            Your free trial has expired. Subscribe to continue using DealerOps.
          </p>
        </div>
        <Link to="/app/billing">
          <Button size="sm" variant="destructive">
            <CreditCard className="h-4 w-4 mr-2" /> Choose a Plan
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-primary/5 border-b border-primary/10 px-4 py-2 flex items-center justify-between">
      <p className="text-xs text-primary">
        <span className="font-semibold">{daysLeft} day{daysLeft !== 1 ? "s" : ""}</span> left on your free trial
      </p>
      <Link to="/app/billing">
        <Button size="sm" variant="outline" className="h-7 text-xs">
          <CreditCard className="h-3 w-3 mr-1" /> Subscribe
        </Button>
      </Link>
    </div>
  );
}

export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-lg bg-primary animate-pulse-glow" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between px-4 border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <AppBreadcrumb />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground h-8 px-2.5"
                onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
              >
                <Command className="h-3 w-3" />
                <span>Search</span>
                <kbd className="ml-1 px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">⌘K</kbd>
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <CommandPalette />
          <TrialBanner />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <DealerAIChat />
    </SidebarProvider>
  );
}
