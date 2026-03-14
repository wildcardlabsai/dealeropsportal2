import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { DealerAIChat } from "./DealerAIChat";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, Car, FileText, Shield, ShieldAlert, Wrench, CarFront,
  Target, ClipboardCheck, Star, FolderOpen, BarChart3, MessageSquare,
  CreditCard, Settings, ScrollText, Search, LogOut, UsersRound, TrendingUp, Gauge, PackageCheck,
  Bell, Command, AlertTriangle, ChevronDown, Menu, X, BookOpen,
  HeartPulse, Megaphone, ToggleLeft, FileSearch, Inbox, LineChart, Crosshair, Building2
} from "lucide-react";
import doLogo from "@/assets/dologo.png";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "./CommandPalette";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserDealerId } from "@/hooks/useCustomers";
import { useStripeSubscription } from "@/hooks/useStripeSubscription";
import { differenceInDays } from "date-fns";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

/* ─── Nav structure ─── */

const navGroups = [
  {
    label: "Core",
    items: [
      { title: "Dashboard", url: "/app", icon: LayoutDashboard },
      { title: "Customers", url: "/app/customers", icon: Users },
      { title: "Vehicles", url: "/app/vehicles", icon: Car },
      { title: "Leads", url: "/app/leads", icon: Target },
      { title: "Invoices", url: "/app/invoices", icon: FileText },
      { title: "Vehicle Checks", url: "/app/checks", icon: Search },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Warranties", url: "/app/warranties", icon: Shield },
      { title: "Aftersales", url: "/app/aftersales", icon: Wrench },
      { title: "CRA Shield", url: "/app/cra", icon: ShieldAlert },
      { title: "Handovers", url: "/app/handovers", icon: PackageCheck },
      { title: "Courtesy Cars", url: "/app/courtesy-cars", icon: CarFront },
      { title: "Tasks", url: "/app/tasks", icon: ClipboardCheck },
      { title: "Reviews", url: "/app/reviews", icon: Star },
    ],
  },
  {
    label: "Admin",
    items: [
      { title: "Compliance", url: "/app/compliance", icon: Shield },
      { title: "Documents", url: "/app/documents", icon: FolderOpen },
      { title: "Reports", url: "/app/reports", icon: BarChart3 },
      { title: "Staff KPIs", url: "/app/kpis", icon: TrendingUp },
      { title: "My KPIs", url: "/app/my-kpis", icon: Gauge },
      { title: "Team", url: "/app/team", icon: UsersRound },
      { title: "Support", url: "/app/support", icon: MessageSquare },
      { title: "Billing", url: "/app/billing", icon: CreditCard },
      { title: "Audit Log", url: "/app/audit", icon: ScrollText },
      { title: "Settings", url: "/app/settings", icon: Settings },
    ],
  },
];

const superAdminGroup = {
  label: "Super Admin",
  items: [
    { title: "Analytics", url: "/app/admin/analytics", icon: LineChart },
    { title: "Lead Generator", url: "/app/admin/lead-generator", icon: Crosshair },
    { title: "Potential Leads", url: "/app/admin/leads", icon: Inbox },
    { title: "Dealer Health", url: "/app/admin/health", icon: HeartPulse },
    { title: "Dealers", url: "/app/admin/dealers", icon: Building2 },
    { title: "Announcements", url: "/app/admin/announcements", icon: Megaphone },
    { title: "Feature Flags", url: "/app/admin/feature-flags", icon: ToggleLeft },
    { title: "Audit Trail", url: "/app/admin/audit", icon: FileSearch },
    { title: "Billing Mgmt", url: "/app/admin/billing", icon: CreditCard },
    { title: "Support Inbox", url: "/app/admin/support", icon: MessageSquare },
  ],
};

/* ─── Dropdown menu ─── */

function NavDropdown({ label, items, isActive }: { label: string; items: typeof navGroups[0]["items"]; isActive: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
          isActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-background border border-border rounded-xl shadow-lg py-2 z-50">
          {items.map((item) => {
            const active = item.url === "/app"
              ? location.pathname === "/app"
              : location.pathname.startsWith(item.url);
            return (
              <Link
                key={item.url}
                to={item.url}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 mx-1 text-sm rounded-lg transition-colors",
                  active ? "text-primary bg-primary/5 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Trial Banner ─── */

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

  if (stripeStatus?.subscribed) return null;
  if (!dealer || dealer.status !== "trial" || !dealer.trial_ends_at) return null;

  const trialEnd = new Date(dealer.trial_ends_at);
  const daysLeft = Math.max(0, differenceInDays(trialEnd, new Date()));
  const isExpired = daysLeft === 0;

  if (isExpired) {
    return (
      <div className="bg-destructive/5 border-b border-destructive/20 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive font-medium">Your free trial has expired.</p>
        </div>
        <Link to="/app/billing">
          <Button size="sm" variant="destructive" className="h-7 text-xs">
            <CreditCard className="h-3 w-3 mr-1" /> Choose a Plan
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

/* ─── Mobile nav ─── */

const mobileNavItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Customers", url: "/app/customers", icon: Users },
  { title: "Vehicles", url: "/app/vehicles", icon: Car },
  { title: "Leads", url: "/app/leads", icon: Target },
  { title: "Invoices", url: "/app/invoices", icon: FileText },
];

function MobileBottomNav() {
  const location = useLocation();
  const isActive = (url: string) => url === "/app" ? location.pathname === "/app" : location.pathname.startsWith(url);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background">
      <div className="flex items-center justify-around h-14">
        {mobileNavItems.map(item => (
          <Link
            key={item.url}
            to={item.url}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1.5 transition-colors",
              isActive(item.url) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.title}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

/* ─── Main Layout ─── */

export function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: isSuperAdmin } = useQuery({
    queryKey: ["is-super-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "super_admin").maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  if (loading) {
    return (
      <div className="theme-light min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-lg bg-primary/20 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const allGroups = isSuperAdmin ? [...navGroups, superAdminGroup] : navGroups;

  const isGroupActive = (items: typeof navGroups[0]["items"]) =>
    items.some(item => item.url === "/app" ? location.pathname === "/app" : location.pathname.startsWith(item.url));

  return (
    <div className="theme-light min-h-screen flex flex-col bg-background text-foreground">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-[1440px] mx-auto">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link to="/app" className="flex items-center gap-2 shrink-0">
              <img src={doLogo} alt="DealerOps" className="h-7 w-7 object-contain" />
              <span className="text-base font-bold text-foreground hidden sm:inline">
                Dealer<span className="text-primary">Ops</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {allGroups.map((group) => (
                <NavDropdown
                  key={group.label}
                  label={group.label}
                  items={group.items}
                  isActive={isGroupActive(group.items)}
                />
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
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
            <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
              <Bell className="h-4 w-4" />
            </Button>
            <Link to="/help" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
                <BookOpen className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground h-8 w-8"
              onClick={async () => { await signOut(); }}
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-muted-foreground hover:text-foreground"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background max-h-[70vh] overflow-y-auto">
            <div className="p-3 space-y-4">
              {allGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 mb-1">{group.label}</p>
                  {group.items.map((item) => {
                    const active = item.url === "/app"
                      ? location.pathname === "/app"
                      : location.pathname.startsWith(item.url);
                    return (
                      <Link
                        key={item.url}
                        to={item.url}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 px-2 py-2 text-sm rounded-lg transition-colors",
                          active ? "text-primary bg-primary/5 font-medium" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      <CommandPalette />
      <TrialBanner />

      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </div>
      </main>

      <MobileBottomNav />
      <DealerAIChat />
    </div>
  );
}
