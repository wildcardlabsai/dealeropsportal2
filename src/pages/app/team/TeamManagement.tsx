import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserDealerId } from "@/hooks/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Plus, Shield, ShieldCheck, User, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  dealer_admin: "Admin",
  dealer_user: "User",
};

const roleIcons: Record<string, typeof Shield> = {
  super_admin: ShieldCheck,
  dealer_admin: Shield,
  dealer_user: User,
};

const PERMISSION_KEYS = [
  { key: "Aftersales.ViewAll", label: "View all aftersales cases" },
  { key: "Invoices.ManageIssued", label: "Manage issued invoices" },
  { key: "CourtesyCars.ViewAll", label: "View all courtesy car loans" },
  { key: "ReviewBooster.ViewAll", label: "View all review requests" },
  { key: "Support.ViewAllDealerTickets", label: "View all support tickets" },
  { key: "Tasks.DeleteAny", label: "Delete any task" },
  { key: "Warranties.DeleteAny", label: "Delete any warranty" },
  { key: "VehicleChecks.ViewAll", label: "View all vehicle checks" },
];

export default function TeamManagement() {
  const { data: dealerId } = useUserDealerId();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [permOpen, setPermOpen] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    email: "", first_name: "", last_name: "", phone: "", role: "dealer_user",
  });

  const { data: members, isLoading } = useQuery({
    queryKey: ["team-members", dealerId],
    queryFn: async () => {
      if (!dealerId) return [];
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, phone, is_active, created_at")
        .eq("dealer_id", dealerId);
      if (error) throw error;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("dealer_id", dealerId);

      return profiles.map((p) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.id)?.role || "dealer_user",
      }));
    },
    enabled: !!dealerId,
  });

  const { data: permissionFlags } = useQuery({
    queryKey: ["permission-flags", dealerId],
    queryFn: async () => {
      if (!dealerId) return [];
      const { data, error } = await supabase
        .from("permission_flags")
        .select("*")
        .eq("dealer_id", dealerId);
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      if (!dealerId) throw new Error("No dealer");
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("dealer_id", dealerId);
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        dealer_id: dealerId,
        role: role as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Role updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_active: !isActive }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("User status updated");
    },
  });

  const togglePermission = useMutation({
    mutationFn: async ({ userId, key, enabled }: { userId: string; key: string; enabled: boolean }) => {
      if (!dealerId) throw new Error("No dealer");
      if (enabled) {
        const { error } = await supabase.from("permission_flags").upsert(
          { dealer_id: dealerId, user_id: userId, key, enabled: true },
          { onConflict: "dealer_id,user_id,key" }
        );
        if (error) throw error;
      } else {
        await supabase.from("permission_flags").delete()
          .eq("dealer_id", dealerId).eq("user_id", userId).eq("key", key);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permission-flags"] });
      toast.success("Permission updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createMember = useMutation({
    mutationFn: async () => {
      if (!dealerId) throw new Error("No dealer");
      // Use edge function to create user
      const { data, error } = await supabase.functions.invoke("create-team-member", {
        body: { ...createForm, dealer_id: dealerId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success(data?.message || "Team member created");
      setCreateOpen(false);
      setCreateForm({ email: "", first_name: "", last_name: "", phone: "", role: "dealer_user" });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getUserPermission = (userId: string, key: string) => {
    return permissionFlags?.some((f) => f.user_id === userId && f.key === key && f.enabled) ?? false;
  };

  const filtered = members?.filter((m) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name = `${m.first_name || ""} ${m.last_name || ""}`.toLowerCase();
    return name.includes(s) || m.phone?.toLowerCase().includes(s);
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-sm text-muted-foreground">{members?.length ?? 0} team member{members?.length !== 1 ? "s" : ""}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">First Name *</Label>
                  <Input value={createForm.first_name} onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Last Name *</Label>
                  <Input value={createForm.last_name} onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Email *</Label>
                <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Role</Label>
                <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dealer_admin">Admin</SelectItem>
                    <SelectItem value="dealer_user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => createMember.mutate()}
                disabled={!createForm.email || !createForm.first_name || !createForm.last_name || createMember.isPending}
                className="w-full"
              >
                {createMember.isPending ? "Creating..." : "Create Member"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}</div>
      ) : !filtered?.length ? (
        <div className="text-center py-20 rounded-xl border border-border/50 bg-card/50">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No team members found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const RoleIcon = roleIcons[m.role] || User;
            const isCurrentUser = m.id === user?.id;
            return (
              <div key={m.id} className="p-4 rounded-xl border border-border/50 bg-card/50">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <RoleIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {[m.first_name, m.last_name].filter(Boolean).join(" ") || "Unnamed User"}
                      {isCurrentUser && <span className="text-xs text-muted-foreground ml-2">(you)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {format(new Date(m.created_at), "d MMM yyyy")}
                      {m.phone && ` · ${m.phone}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Select
                      value={m.role}
                      onValueChange={(v) => updateRole.mutate({ userId: m.id, role: v })}
                      disabled={isCurrentUser}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dealer_admin">Admin</SelectItem>
                        <SelectItem value="dealer_user">User</SelectItem>
                      </SelectContent>
                    </Select>
                    {!isCurrentUser && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8"
                          onClick={() => setPermOpen(permOpen === m.id ? null : m.id)}
                        >
                          Permissions
                        </Button>
                        <Button
                          size="sm"
                          variant={m.is_active ? "outline" : "default"}
                          className="text-xs h-8"
                          onClick={() => toggleActive.mutate({ userId: m.id, isActive: m.is_active })}
                        >
                          {m.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {permOpen === m.id && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Permission Overrides</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PERMISSION_KEYS.map((perm) => (
                        <div key={perm.key} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30">
                          <span className="text-xs">{perm.label}</span>
                          <Switch
                            checked={getUserPermission(m.id, perm.key)}
                            onCheckedChange={(checked) =>
                              togglePermission.mutate({ userId: m.id, key: perm.key, enabled: checked })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
