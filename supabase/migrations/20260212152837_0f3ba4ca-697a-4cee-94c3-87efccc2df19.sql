
-- New enums for the enhanced aftersales module
CREATE TYPE public.aftersales_case_status AS ENUM (
  'new', 'investigating', 'awaiting_customer', 'awaiting_garage',
  'approved_repair', 'in_repair', 'resolved', 'rejected', 'closed'
);

CREATE TYPE public.aftersales_outcome AS ENUM (
  'repair', 'refund', 'reject', 'goodwill', 'partial_refund', 'diagnostic_only', 'other'
);

CREATE TYPE public.aftersales_update_type AS ENUM (
  'note', 'status_change', 'assignment', 'customer_contact',
  'garage_update', 'document_added', 'cost_update'
);

CREATE TYPE public.cra_window AS ENUM (
  'within_30_days', 'day_31_to_6_months', 'over_6_months'
);

-- 1) aftersales_cases table
CREATE TABLE public.aftersales_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  case_number text NOT NULL,
  customer_id uuid REFERENCES public.customers(id),
  vehicle_id uuid REFERENCES public.vehicles(id),
  invoice_id uuid REFERENCES public.invoices(id),
  warranty_id uuid REFERENCES public.warranties(id),
  created_by_user_id uuid NOT NULL,
  assigned_to_user_id uuid,
  complaint_date date NOT NULL DEFAULT CURRENT_DATE,
  sale_date date,
  cra_window public.cra_window,
  issue_category text NOT NULL,
  issue_subcategory text,
  summary text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status public.aftersales_case_status NOT NULL DEFAULT 'new',
  outcome public.aftersales_outcome,
  cost_estimate numeric,
  goodwill_amount numeric,
  internal_notes text,
  customer_comms_notes text,
  last_contacted_at timestamptz,
  next_action_at timestamptz,
  sla_target_hours int NOT NULL DEFAULT 72,
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dealer_id, case_number)
);

CREATE INDEX idx_aftersales_cases_dealer ON public.aftersales_cases(dealer_id);
CREATE INDEX idx_aftersales_cases_status ON public.aftersales_cases(status);
CREATE INDEX idx_aftersales_cases_assigned ON public.aftersales_cases(assigned_to_user_id);

ALTER TABLE public.aftersales_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmin full access on aftersales_cases"
  ON public.aftersales_cases FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Users can view own dealer aftersales_cases"
  ON public.aftersales_cases FOR SELECT
  USING (dealer_id = get_user_dealer_id());

CREATE POLICY "Users can insert own dealer aftersales_cases"
  ON public.aftersales_cases FOR INSERT
  WITH CHECK (dealer_id = get_user_dealer_id());

CREATE POLICY "Users can update own dealer aftersales_cases"
  ON public.aftersales_cases FOR UPDATE
  USING (dealer_id = get_user_dealer_id())
  WITH CHECK (dealer_id = get_user_dealer_id());

CREATE TRIGGER update_aftersales_cases_updated_at
  BEFORE UPDATE ON public.aftersales_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) aftersales_updates (timeline)
CREATE TABLE public.aftersales_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  case_id uuid NOT NULL REFERENCES public.aftersales_cases(id) ON DELETE CASCADE,
  created_by_user_id uuid NOT NULL,
  update_type public.aftersales_update_type NOT NULL DEFAULT 'note',
  message text NOT NULL,
  old_status text,
  new_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_aftersales_updates_case ON public.aftersales_updates(case_id);

ALTER TABLE public.aftersales_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmin full access on aftersales_updates"
  ON public.aftersales_updates FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Users can view own dealer aftersales_updates"
  ON public.aftersales_updates FOR SELECT
  USING (dealer_id = get_user_dealer_id());

CREATE POLICY "Users can insert own dealer aftersales_updates"
  ON public.aftersales_updates FOR INSERT
  WITH CHECK (dealer_id = get_user_dealer_id());

-- 3) aftersales_attachments
CREATE TABLE public.aftersales_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  case_id uuid NOT NULL REFERENCES public.aftersales_cases(id) ON DELETE CASCADE,
  uploaded_by_user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_aftersales_attachments_case ON public.aftersales_attachments(case_id);

ALTER TABLE public.aftersales_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmin full access on aftersales_attachments"
  ON public.aftersales_attachments FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Users can view own dealer aftersales_attachments"
  ON public.aftersales_attachments FOR SELECT
  USING (dealer_id = get_user_dealer_id());

CREATE POLICY "Users can insert own dealer aftersales_attachments"
  ON public.aftersales_attachments FOR INSERT
  WITH CHECK (dealer_id = get_user_dealer_id());

CREATE POLICY "Users can delete own dealer aftersales_attachments"
  ON public.aftersales_attachments FOR DELETE
  USING (dealer_id = get_user_dealer_id());

-- Storage bucket for aftersales attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('aftersales-attachments', 'aftersales-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload aftersales attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'aftersales-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view aftersales attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'aftersales-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete aftersales attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'aftersales-attachments' AND auth.uid() IS NOT NULL);

-- Auto-generate case numbers
CREATE OR REPLACE FUNCTION public.generate_aftersales_case_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num int;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(case_number FROM 4) AS int)), 0) + 1
    INTO next_num
    FROM public.aftersales_cases
    WHERE dealer_id = NEW.dealer_id;
  NEW.case_number := 'AF-' || LPAD(next_num::text, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_case_number
  BEFORE INSERT ON public.aftersales_cases
  FOR EACH ROW
  WHEN (NEW.case_number IS NULL OR NEW.case_number = '')
  EXECUTE FUNCTION public.generate_aftersales_case_number();
