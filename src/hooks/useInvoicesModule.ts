import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserDealerId } from "./useCustomers";
import { useAuth } from "@/contexts/AuthContext";

// ── Invoices ──
export function useInvoices(search?: string, statusFilter?: string, tab?: string) {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["invoices", dealerId, search, statusFilter, tab],
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select("*, customers(first_name, last_name), vehicles(vrm, make, model)")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`invoice_number.ilike.%${search}%`);
      }
      if (tab === "drafts") query = query.eq("status", "draft" as any);
      else if (tab === "issued") query = query.eq("status", "sent" as any);
      else if (tab === "paid") query = query.eq("status", "paid" as any);
      else if (tab === "outstanding") query = query.eq("status", "issued" as any).gt("balance_due", 0);
      else if (statusFilter && statusFilter !== "all") query = query.eq("status", statusFilter as any);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("invoices")
        .select("*, customers(first_name, last_name, email, phone, address_line1, address_line2, city, postcode), vehicles(vrm, vin, make, model, year, mileage), finance_companies(legal_name, trading_name, address_line1, address_line2, town, postcode), dealers(name, trading_name, legal_name, fca_number, ico_number, vat_number, company_number, address_line1, address_line2, city, postcode, phone, email, logo_url, bank_details_text, invoice_footer_text)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useInvoiceItems(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ["invoice-items", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      const { data, error } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ items, ...invoice }: any) => {
      const { data, error } = await supabase.from("invoices").insert(invoice).select().single();
      if (error) throw error;
      if (items?.length > 0) {
        const itemsWithInvoice = items.map((item: any) => ({ ...item, invoice_id: data.id }));
        const { error: itemsError } = await supabase.from("invoice_items").insert(itemsWithInvoice);
        if (itemsError) throw itemsError;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, items, ...updates }: any) => {
      const { data, error } = await supabase.from("invoices").update(updates).eq("id", id).select().single();
      if (error) throw error;

      // Replace items if provided
      if (items) {
        await supabase.from("invoice_items").delete().eq("invoice_id", id);
        if (items.length > 0) {
          const itemsWithInvoice = items.map((item: any) => ({ ...item, invoice_id: id }));
          const { error: itemsError } = await supabase.from("invoice_items").insert(itemsWithInvoice);
          if (itemsError) throw itemsError;
        }
      }
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", data.id] });
      queryClient.invalidateQueries({ queryKey: ["invoice-items", data.id] });
    },
  });
}

// ── Invoice Payments ──
export function useInvoicePayments(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ["invoice-payments", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      const { data, error } = await supabase
        .from("invoice_payments")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });
}

export function useAddInvoicePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payment: any) => {
      const { data, error } = await supabase.from("invoice_payments").insert(payment).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["invoice-payments", data.invoice_id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", data.invoice_id] });
    },
  });
}

export function useDeleteInvoicePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, invoiceId }: { id: string; invoiceId: string }) => {
      const { error } = await supabase.from("invoice_payments").delete().eq("id", id);
      if (error) throw error;
      return { invoiceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoice-payments", data.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

// ── Part Exchange ──
export function usePartExchange(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ["part-exchange", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      const { data, error } = await supabase
        .from("part_exchanges")
        .select("*")
        .eq("invoice_id", invoiceId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });
}

export function useUpsertPartExchange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (px: any) => {
      const { data, error } = await supabase.from("part_exchanges").upsert(px, { onConflict: "invoice_id" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["part-exchange", data.invoice_id] });
    },
  });
}

export function useDeletePartExchange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, invoiceId }: { id: string; invoiceId: string }) => {
      const { error } = await supabase.from("part_exchanges").delete().eq("id", id);
      if (error) throw error;
      return { invoiceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["part-exchange", data.invoiceId] });
    },
  });
}

// ── Finance Companies ──
export function useFinanceCompanies() {
  const { data: dealerId } = useUserDealerId();
  return useQuery({
    queryKey: ["finance-companies", dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_companies")
        .select("*")
        .order("legal_name");
      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

export function useCreateFinanceCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (company: any) => {
      const { data, error } = await supabase.from("finance_companies").insert(company).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-companies"] });
    },
  });
}
