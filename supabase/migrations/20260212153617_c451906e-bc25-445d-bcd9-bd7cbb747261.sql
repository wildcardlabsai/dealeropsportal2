
-- New enums
CREATE TYPE public.sale_type AS ENUM ('cash', 'finance', 'part_finance');
CREATE TYPE public.payment_method_type AS ENUM ('bacs', 'card', 'cash', 'finance', 'other');

-- Finance Companies table
CREATE TABLE public.finance_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  legal_name text NOT NULL,
  trading_name text,
  address_line1 text,
  address_line2 text,
  town text,
  postcode text,
  contact_email text,
  contact_phone text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_finance_companies_dealer ON public.finance_companies(dealer_id);
ALTER TABLE public.finance_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmin full access on finance_companies" ON public.finance_companies FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Users can view own dealer finance_companies" ON public.finance_companies FOR SELECT
  USING (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can insert own dealer finance_companies" ON public.finance_companies FOR INSERT
  WITH CHECK (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can update own dealer finance_companies" ON public.finance_companies FOR UPDATE
  USING (dealer_id = get_user_dealer_id()) WITH CHECK (dealer_id = get_user_dealer_id());

CREATE TRIGGER update_finance_companies_updated_at
  BEFORE UPDATE ON public.finance_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add new columns to invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS sale_date date,
  ADD COLUMN IF NOT EXISTS sale_type public.sale_type NOT NULL DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS finance_company_id uuid REFERENCES public.finance_companies(id),
  ADD COLUMN IF NOT EXISTS deposit_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS vehicle_vrm_override text,
  ADD COLUMN IF NOT EXISTS vehicle_vin_override text,
  ADD COLUMN IF NOT EXISTS vehicle_mileage_override integer,
  ADD COLUMN IF NOT EXISTS vehicle_first_reg_override text,
  ADD COLUMN IF NOT EXISTS vehicle_make_model_override text;

-- Add vat_rate to invoice_items
ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS vat_rate numeric NOT NULL DEFAULT 20;

-- Rename 'total' to 'line_total' in invoice_items for clarity (keep both for compat)
-- We'll use line_total as alias in code

-- Part Exchanges table
CREATE TABLE public.part_exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  px_vrm text,
  px_make_model text,
  px_vin text,
  px_mileage numeric,
  px_allowance numeric NOT NULL DEFAULT 0,
  px_settlement numeric DEFAULT 0,
  px_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(invoice_id)
);
CREATE INDEX idx_part_exchanges_invoice ON public.part_exchanges(invoice_id);
ALTER TABLE public.part_exchanges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmin full access on part_exchanges" ON public.part_exchanges FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Users can view own dealer part_exchanges" ON public.part_exchanges FOR SELECT
  USING (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can insert own dealer part_exchanges" ON public.part_exchanges FOR INSERT
  WITH CHECK (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can update own dealer part_exchanges" ON public.part_exchanges FOR UPDATE
  USING (dealer_id = get_user_dealer_id()) WITH CHECK (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can delete own dealer part_exchanges" ON public.part_exchanges FOR DELETE
  USING (dealer_id = get_user_dealer_id());

-- Invoice Payments table
CREATE TABLE public.invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  method public.payment_method_type NOT NULL DEFAULT 'bacs',
  amount numeric NOT NULL DEFAULT 0,
  reference text,
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoice_payments_invoice ON public.invoice_payments(invoice_id);
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmin full access on invoice_payments" ON public.invoice_payments FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Users can view own dealer invoice_payments" ON public.invoice_payments FOR SELECT
  USING (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can insert own dealer invoice_payments" ON public.invoice_payments FOR INSERT
  WITH CHECK (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can delete own dealer invoice_payments" ON public.invoice_payments FOR DELETE
  USING (dealer_id = get_user_dealer_id());

-- Auto-generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num int;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS int)), 0) + 1
    INTO next_num
    FROM public.invoices
    WHERE dealer_id = NEW.dealer_id;
  NEW.invoice_number := 'INV-' || LPAD(next_num::text, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '' OR NEW.invoice_number LIKE 'INV-%')
  EXECUTE FUNCTION public.generate_invoice_number();
