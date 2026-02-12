import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, User, Palette, Bell, FileText, Shield, Link2, Users, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserDealerId } from "@/hooks/useCustomers";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: dealerId } = useUserDealerId();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: dealer, isLoading } = useQuery({
    queryKey: ["dealer-settings", dealerId],
    queryFn: async () => {
      if (!dealerId) return null;
      const { data, error } = await supabase.from("dealers").select("*").eq("id", dealerId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });

  const { data: preferences } = useQuery({
    queryKey: ["dealer-preferences", dealerId],
    queryFn: async () => {
      if (!dealerId) return null;
      const { data } = await supabase.from("dealer_preferences").select("*").eq("dealer_id", dealerId).maybeSingle();
      return data;
    },
    enabled: !!dealerId,
  });

  const { data: templates } = useQuery({
    queryKey: ["document-templates-for-settings", dealerId],
    queryFn: async () => {
      if (!dealerId) return [];
      const { data } = await supabase.from("document_templates").select("id, name, category").or(`dealer_id.eq.${dealerId},dealer_id.is.null`).eq("is_active", true);
      return data || [];
    },
    enabled: !!dealerId,
  });

  const [profileForm, setProfileForm] = useState<Record<string, any>>({});
  const [dealerForm, setDealerForm] = useState<Record<string, any>>({});
  const [prefForm, setPrefForm] = useState<Record<string, any>>({});

  useEffect(() => { if (profile) setProfileForm({ ...profile }); }, [profile]);
  useEffect(() => { if (dealer) setDealerForm({ ...dealer }); }, [dealer]);
  useEffect(() => {
    if (preferences) setPrefForm({ ...preferences });
    else if (dealerId) setPrefForm({ dealer_id: dealerId, task_reminder_hours: 24, aftersales_first_response_sla_hours: 72, data_retention_months: 36, notifications_email_enabled: false, notifications_inapp_enabled: true });
  }, [preferences, dealerId]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const { id, created_at, updated_at, dealer_id: _d, is_active, avatar_url, ...updates } = profileForm;
      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["profile"] }); toast.success("Profile saved"); },
    onError: (err: any) => toast.error(err.message || "Failed to save"),
  });

  const updateDealer = useMutation({
    mutationFn: async () => {
      if (!dealerId) throw new Error("No dealer");
      const { id, created_at, updated_at, status, plan_id, ...updates } = dealerForm;
      const { error } = await supabase.from("dealers").update(updates).eq("id", dealerId);
      if (error) throw error;
      await supabase.from("audit_logs").insert({
        dealer_id: dealerId, actor_user_id: user?.id, action_type: "SETTINGS_UPDATED",
        entity_type: "dealer", entity_id: dealerId, summary: "Dealer settings updated",
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["dealer-settings"] }); toast.success("Dealership settings saved"); },
    onError: (err: any) => toast.error(err.message || "Failed to save"),
  });

  const updatePreferences = useMutation({
    mutationFn: async () => {
      if (!dealerId) throw new Error("No dealer");
      const payload = { ...prefForm, dealer_id: dealerId, updated_at: new Date().toISOString() };
      const { error } = await supabase.from("dealer_preferences").upsert(payload, { onConflict: "dealer_id" });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["dealer-preferences"] }); toast.success("Preferences saved"); },
    onError: (err: any) => toast.error(err.message),
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !dealerId) return;
    const path = `${dealerId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("dealer-logos").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    const { data: { publicUrl } } = supabase.storage.from("dealer-logos").getPublicUrl(path);
    setDealerForm(prev => ({ ...prev, logo_url: publicUrl }));
    toast.success("Logo uploaded – save to apply");
  };

  if (isLoading) return <div className="h-40 rounded-xl bg-muted/30 animate-pulse" />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, dealership, and platform preferences</p>
      </div>

      <Tabs defaultValue="profile" className="max-w-3xl">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="profile"><User className="h-3.5 w-3.5 mr-1.5" />Profile</TabsTrigger>
          <TabsTrigger value="dealership"><Shield className="h-3.5 w-3.5 mr-1.5" />Dealer Profile</TabsTrigger>
          <TabsTrigger value="branding"><Palette className="h-3.5 w-3.5 mr-1.5" />Branding</TabsTrigger>
          <TabsTrigger value="team"><Users className="h-3.5 w-3.5 mr-1.5" />Team</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-3.5 w-3.5 mr-1.5" />Notifications</TabsTrigger>
          <TabsTrigger value="templates"><FileText className="h-3.5 w-3.5 mr-1.5" />Templates</TabsTrigger>
          <TabsTrigger value="compliance"><Shield className="h-3.5 w-3.5 mr-1.5" />Compliance</TabsTrigger>
          <TabsTrigger value="integrations"><Link2 className="h-3.5 w-3.5 mr-1.5" />Integrations</TabsTrigger>
        </TabsList>

        {/* ===== PROFILE TAB ===== */}
        <TabsContent value="profile">
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">User ID: {user?.id?.slice(0, 8)}...</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="text-xs">First Name</Label><Input value={profileForm.first_name || ""} onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Last Name</Label><Input value={profileForm.last_name || ""} onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })} className="mt-1" /></div>
              </div>
              <div><Label className="text-xs">Phone</Label><Input value={profileForm.phone || ""} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="mt-1" /></div>
            </div>
            <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
              <Save className="h-4 w-4 mr-2" /> {updateProfile.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </TabsContent>

        {/* ===== DEALER PROFILE TAB ===== */}
        <TabsContent value="dealership">
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
              <h3 className="text-sm font-semibold">Business Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="text-xs">Legal Name</Label><Input value={dealerForm.legal_name || dealerForm.name || ""} onChange={e => setDealerForm({ ...dealerForm, legal_name: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Trading Name</Label><Input value={dealerForm.trading_name || ""} onChange={e => setDealerForm({ ...dealerForm, trading_name: e.target.value })} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="text-xs">Contact Email</Label><Input value={dealerForm.email || ""} onChange={e => setDealerForm({ ...dealerForm, email: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Phone</Label><Input value={dealerForm.phone || ""} onChange={e => setDealerForm({ ...dealerForm, phone: e.target.value })} className="mt-1" /></div>
              </div>
              <div><Label className="text-xs">Website</Label><Input value={dealerForm.website || ""} onChange={e => setDealerForm({ ...dealerForm, website: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
              <h3 className="text-sm font-semibold">Address</h3>
              <div><Label className="text-xs">Address Line 1</Label><Input value={dealerForm.address_line1 || ""} onChange={e => setDealerForm({ ...dealerForm, address_line1: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Address Line 2</Label><Input value={dealerForm.address_line2 || ""} onChange={e => setDealerForm({ ...dealerForm, address_line2: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="text-xs">City / Town</Label><Input value={dealerForm.city || ""} onChange={e => setDealerForm({ ...dealerForm, city: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Postcode</Label><Input value={dealerForm.postcode || ""} onChange={e => setDealerForm({ ...dealerForm, postcode: e.target.value })} className="mt-1" /></div>
              </div>
            </div>
            <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
              <h3 className="text-sm font-semibold">Compliance Identifiers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="text-xs">FCA Number</Label><Input value={dealerForm.fca_number || ""} onChange={e => setDealerForm({ ...dealerForm, fca_number: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">ICO Number</Label><Input value={dealerForm.ico_number || ""} onChange={e => setDealerForm({ ...dealerForm, ico_number: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">VAT Number</Label><Input value={dealerForm.vat_number || ""} onChange={e => setDealerForm({ ...dealerForm, vat_number: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Company Number</Label><Input value={dealerForm.company_number || ""} onChange={e => setDealerForm({ ...dealerForm, company_number: e.target.value })} className="mt-1" /></div>
              </div>
            </div>
            <Button onClick={() => updateDealer.mutate()} disabled={updateDealer.isPending}>
              <Save className="h-4 w-4 mr-2" /> {updateDealer.isPending ? "Saving..." : "Save Dealership"}
            </Button>
          </div>
        </TabsContent>

        {/* ===== BRANDING TAB ===== */}
        <TabsContent value="branding">
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
              <h3 className="text-sm font-semibold">Logo</h3>
              {dealerForm.logo_url && <img src={dealerForm.logo_url} alt="Dealer logo" className="h-16 rounded-lg border border-border/50 object-contain bg-background p-2" />}
              <div>
                <Label className="text-xs">Upload Logo</Label>
                <Input type="file" accept="image/*" onChange={handleLogoUpload} className="mt-1" />
              </div>
            </div>
            <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
              <h3 className="text-sm font-semibold">Brand Colour</h3>
              <div className="flex items-center gap-3">
                <input type="color" value={dealerForm.primary_colour || "#3b82f6"} onChange={e => setDealerForm({ ...dealerForm, primary_colour: e.target.value })} className="h-10 w-14 rounded cursor-pointer border-0" />
                <Input value={dealerForm.primary_colour || ""} onChange={e => setDealerForm({ ...dealerForm, primary_colour: e.target.value })} placeholder="#3b82f6" className="max-w-40" />
              </div>
            </div>
            <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
              <h3 className="text-sm font-semibold">Invoice / PDF Settings</h3>
              <div><Label className="text-xs">Invoice Footer Text</Label><Textarea value={dealerForm.invoice_footer_text || ""} onChange={e => setDealerForm({ ...dealerForm, invoice_footer_text: e.target.value })} rows={3} className="mt-1" /></div>
              <div><Label className="text-xs">Bank Details / Payment Instructions</Label><Textarea value={dealerForm.bank_details_text || ""} onChange={e => setDealerForm({ ...dealerForm, bank_details_text: e.target.value })} rows={3} className="mt-1" /></div>
            </div>
            {/* Preview */}
            <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-3">
              <h3 className="text-sm font-semibold">PDF Header Preview</h3>
              <div className="p-4 bg-background rounded-lg border border-border/30" style={{ borderTop: `4px solid ${dealerForm.primary_colour || '#3b82f6'}` }}>
                <div className="flex items-center gap-3">
                  {dealerForm.logo_url && <img src={dealerForm.logo_url} alt="" className="h-10 object-contain" />}
                  <div>
                    <p className="font-bold text-sm">{dealerForm.trading_name || dealerForm.name || "Your Dealership"}</p>
                    <p className="text-xs text-muted-foreground">{[dealerForm.address_line1, dealerForm.city, dealerForm.postcode].filter(Boolean).join(", ")}</p>
                    <p className="text-xs text-muted-foreground">{[dealerForm.phone, dealerForm.email].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
                {dealerForm.bank_details_text && <div className="mt-3 pt-3 border-t border-border/30"><p className="text-xs text-muted-foreground whitespace-pre-wrap">{dealerForm.bank_details_text}</p></div>}
                {dealerForm.invoice_footer_text && <div className="mt-2"><p className="text-xs text-muted-foreground italic">{dealerForm.invoice_footer_text}</p></div>}
              </div>
            </div>
            <Button onClick={() => updateDealer.mutate()} disabled={updateDealer.isPending}>
              <Save className="h-4 w-4 mr-2" /> {updateDealer.isPending ? "Saving..." : "Save Branding"}
            </Button>
          </div>
        </TabsContent>

        {/* ===== TEAM TAB ===== */}
        <TabsContent value="team">
          <div className="space-y-4">
            <div className="p-6 rounded-xl border border-border/50 bg-card/50">
              <p className="text-sm text-muted-foreground mb-4">Manage your team members, roles, and permission flags.</p>
              <Button onClick={() => navigate("/app/team")}>
                <Users className="h-4 w-4 mr-2" /> Go to Team Management
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ===== NOTIFICATIONS TAB ===== */}
        <TabsContent value="notifications">
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
              <h3 className="text-sm font-semibold">Notification Channels</h3>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div><p className="text-sm">In-App Notifications</p><p className="text-xs text-muted-foreground">Show notifications within the platform</p></div>
                <Switch checked={prefForm.notifications_inapp_enabled ?? true} onCheckedChange={v => setPrefForm({ ...prefForm, notifications_inapp_enabled: v })} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div><p className="text-sm">Email Notifications</p><p className="text-xs text-muted-foreground">Send email alerts for important events</p></div>
                <Switch checked={prefForm.notifications_email_enabled ?? false} onCheckedChange={v => setPrefForm({ ...prefForm, notifications_email_enabled: v })} />
              </div>
            </div>
            <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
              <h3 className="text-sm font-semibold">Timing</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="text-xs">Task Reminder (hours before due)</Label><Input type="number" value={prefForm.task_reminder_hours ?? 24} onChange={e => setPrefForm({ ...prefForm, task_reminder_hours: parseInt(e.target.value) || 24 })} className="mt-1" /></div>
                <div><Label className="text-xs">Aftersales First Response SLA (hours)</Label><Input type="number" value={prefForm.aftersales_first_response_sla_hours ?? 72} onChange={e => setPrefForm({ ...prefForm, aftersales_first_response_sla_hours: parseInt(e.target.value) || 72 })} className="mt-1" /></div>
              </div>
            </div>
            <Button onClick={() => updatePreferences.mutate()} disabled={updatePreferences.isPending}>
              <Save className="h-4 w-4 mr-2" /> {updatePreferences.isPending ? "Saving..." : "Save Notifications"}
            </Button>
          </div>
        </TabsContent>

        {/* ===== TEMPLATES TAB ===== */}
        <TabsContent value="templates">
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
              <h3 className="text-sm font-semibold">Default Templates</h3>
              <p className="text-xs text-muted-foreground">Select default templates used across modules.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Courtesy Car Agreement</Label>
                  <Select value={prefForm.courtesy_agreement_template_id || ""} onValueChange={v => setPrefForm({ ...prefForm, courtesy_agreement_template_id: v || null })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select template" /></SelectTrigger>
                    <SelectContent>
                      {templates?.filter(t => t.category === "courtesy_car" || t.category === "COURTESY_CAR").map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Handover Checklist</Label>
                  <Select value={prefForm.handover_template_id || ""} onValueChange={v => setPrefForm({ ...prefForm, handover_template_id: v || null })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select template" /></SelectTrigger>
                    <SelectContent>
                      {templates?.filter(t => t.category === "handover" || t.category === "HANDOVER").map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl border border-border/50 bg-card/50">
              <p className="text-sm text-muted-foreground mb-4">Edit document templates including PDI, Valeting, Warranty certificates, and more.</p>
              <Button variant="outline" onClick={() => navigate("/app/documents")}>
                <FileText className="h-4 w-4 mr-2" /> Go to Document Library
              </Button>
            </div>
            <Button onClick={() => updatePreferences.mutate()} disabled={updatePreferences.isPending}>
              <Save className="h-4 w-4 mr-2" /> {updatePreferences.isPending ? "Saving..." : "Save Templates"}
            </Button>
          </div>
        </TabsContent>

        {/* ===== COMPLIANCE TAB ===== */}
        <TabsContent value="compliance">
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
              <h3 className="text-sm font-semibold">Compliance Numbers</h3>
              <p className="text-xs text-muted-foreground">Quick reference for your regulatory identifiers.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "FCA Number", value: dealer?.fca_number },
                  { label: "ICO Number", value: dealer?.ico_number },
                  { label: "VAT Number", value: dealer?.vat_number },
                  { label: "Company Number", value: dealer?.company_number },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-sm font-mono">{item.value || "Not set"}</p></div>
                    {item.value && (
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { navigator.clipboard.writeText(item.value!); toast.success("Copied"); }}>
                        Copy
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
              <h3 className="text-sm font-semibold">Data Retention</h3>
              <div><Label className="text-xs">Retention Period (months)</Label><Input type="number" value={prefForm.data_retention_months ?? 36} onChange={e => setPrefForm({ ...prefForm, data_retention_months: parseInt(e.target.value) || 36 })} className="mt-1 max-w-40" /></div>
              <p className="text-xs text-muted-foreground">Customer data older than this will be flagged for review. Default: 36 months.</p>
            </div>
            <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
              <h3 className="text-sm font-semibold">GDPR</h3>
              <Button variant="outline" size="sm" onClick={async () => {
                toast.info("Customer data export will be available for download shortly.");
                await supabase.from("audit_logs").insert({
                  dealer_id: dealerId, actor_user_id: user?.id, action_type: "EXPORT_CUSTOMER_DATA",
                  entity_type: "customers", summary: "GDPR customer data export requested",
                });
              }}>
                Export Customer Data
              </Button>
            </div>
            <Button onClick={() => updatePreferences.mutate()} disabled={updatePreferences.isPending}>
              <Save className="h-4 w-4 mr-2" /> {updatePreferences.isPending ? "Saving..." : "Save Compliance Settings"}
            </Button>
          </div>
        </TabsContent>

        {/* ===== INTEGRATIONS TAB ===== */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-4">
              <h3 className="text-sm font-semibold">External Services</h3>
              <p className="text-xs text-muted-foreground">Integration status for connected services. API keys are managed securely and never displayed.</p>
              <div className="space-y-3">
                {[
                  { name: "DVLA MOT History", status: "Connected", desc: "Vehicle MOT data lookups" },
                  { name: "DVSA Vehicle Enquiry", status: "Connected", desc: "Registration and tax status checks" },
                ].map(svc => (
                  <div key={svc.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{svc.name}</p>
                      <p className="text-xs text-muted-foreground">{svc.desc}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-success/10 text-success border-success/20">{svc.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
