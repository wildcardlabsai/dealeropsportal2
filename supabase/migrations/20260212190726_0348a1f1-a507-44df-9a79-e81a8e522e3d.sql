
-- CRA Shield enums
CREATE TYPE public.cra_sale_type AS ENUM ('on_premises', 'distance', 'hybrid');
CREATE TYPE public.cra_fault_category AS ENUM (
  'engine', 'gearbox', 'electrical', 'brakes', 'suspension', 'steering',
  'cooling', 'infotainment', 'hvac', 'body_cosmetic', 'wear_and_tear', 'other'
);
CREATE TYPE public.cra_customer_usage AS ENUM ('normal', 'heavy', 'unknown');
CREATE TYPE public.cra_risk_rating AS ENUM ('green', 'amber', 'red');
CREATE TYPE public.cra_case_status AS ENUM ('open', 'awaiting_evidence', 'awaiting_diagnostic', 'under_review', 'resolved');
CREATE TYPE public.cra_time_window AS ENUM ('within_30_days', '30_days_to_6_months', 'over_6_months');

-- CRA Cases table
CREATE TABLE public.cra_cases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  case_number text NOT NULL DEFAULT '',
  created_by_user_id uuid NOT NULL,
  assigned_to_user_id uuid,

  -- Sale & Vehicle
  sale_date date NOT NULL,
  issue_reported_date date NOT NULL,
  mileage_at_sale integer,
  mileage_at_issue integer,
  vehicle_first_reg_date date,
  vehicle_make text,
  vehicle_model text,
  vehicle_registration text,

  -- Sale Context
  sale_type public.cra_sale_type NOT NULL DEFAULT 'on_premises',

  -- Fault Details
  fault_category public.cra_fault_category NOT NULL,
  fault_description text NOT NULL,
  vehicle_drivable boolean NOT NULL DEFAULT true,
  warning_lights_present boolean NOT NULL DEFAULT false,
  customer_usage public.cra_customer_usage NOT NULL DEFAULT 'unknown',

  -- Evidence Flags
  pdi_present boolean NOT NULL DEFAULT false,
  handover_acknowledgement_signed boolean NOT NULL DEFAULT false,
  pre_delivery_photos_present boolean NOT NULL DEFAULT false,
  diagnostic_report_present boolean NOT NULL DEFAULT false,
  service_history_present boolean NOT NULL DEFAULT false,
  warranty_active boolean NOT NULL DEFAULT false,

  -- System Outputs (auto-calculated, immutable snapshot)
  days_since_sale integer,
  time_window public.cra_time_window,
  risk_rating public.cra_risk_rating,
  risk_reasons jsonb DEFAULT '[]'::jsonb,
  recommended_next_steps jsonb DEFAULT '[]'::jsonb,
  evidence_checklist jsonb DEFAULT '[]'::jsonb,
  customer_response_standard text,
  customer_response_firm text,
  customer_response_deescalation text,

  -- Snapshots
  inputs_snapshot jsonb,
  outputs_snapshot jsonb,

  -- Case management
  case_status public.cra_case_status NOT NULL DEFAULT 'open',
  internal_assessment_notes text,
  resolution_summary text,

  -- Linked entities
  customer_id uuid REFERENCES public.customers(id),
  vehicle_id uuid REFERENCES public.vehicles(id),
  aftersales_case_id uuid REFERENCES public.aftersales_cases(id),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_cra_cases_dealer ON public.cra_cases(dealer_id);
CREATE INDEX idx_cra_cases_status ON public.cra_cases(case_status);
CREATE INDEX idx_cra_cases_risk ON public.cra_cases(risk_rating);

-- Auto-number trigger
CREATE OR REPLACE FUNCTION public.generate_cra_case_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE next_num int;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(case_number FROM 5) AS int)), 0) + 1
    INTO next_num FROM public.cra_cases WHERE dealer_id = NEW.dealer_id;
  NEW.case_number := 'CRA-' || LPAD(next_num::text, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cra_case_number
  BEFORE INSERT ON public.cra_cases
  FOR EACH ROW EXECUTE FUNCTION public.generate_cra_case_number();

-- Updated_at trigger
CREATE TRIGGER update_cra_cases_updated_at
  BEFORE UPDATE ON public.cra_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CRA Case Documents (evidence vault)
CREATE TABLE public.cra_case_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  cra_case_id uuid NOT NULL REFERENCES public.cra_cases(id) ON DELETE CASCADE,
  uploaded_by_user_id uuid NOT NULL,
  document_type text NOT NULL DEFAULT 'other',
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cra_docs_case ON public.cra_case_documents(cra_case_id);

-- CRA Case Activity Timeline
CREATE TABLE public.cra_case_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  cra_case_id uuid NOT NULL REFERENCES public.cra_cases(id) ON DELETE CASCADE,
  created_by_user_id uuid NOT NULL,
  action_type text NOT NULL,
  message text,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cra_activities_case ON public.cra_case_activities(cra_case_id);

-- RLS
ALTER TABLE public.cra_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cra_case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cra_case_activities ENABLE ROW LEVEL SECURITY;

-- Policies for cra_cases
CREATE POLICY "Dealer members can view own CRA cases"
  ON public.cra_cases FOR SELECT
  USING (public.has_dealer_access(dealer_id));

CREATE POLICY "Dealer members can insert CRA cases"
  ON public.cra_cases FOR INSERT
  WITH CHECK (dealer_id = public.get_user_dealer_id());

CREATE POLICY "Dealer members can update own CRA cases"
  ON public.cra_cases FOR UPDATE
  USING (public.has_dealer_access(dealer_id));

-- Policies for cra_case_documents
CREATE POLICY "Dealer members can view CRA docs"
  ON public.cra_case_documents FOR SELECT
  USING (public.has_dealer_access(dealer_id));

CREATE POLICY "Dealer members can insert CRA docs"
  ON public.cra_case_documents FOR INSERT
  WITH CHECK (dealer_id = public.get_user_dealer_id());

-- Policies for cra_case_activities
CREATE POLICY "Dealer members can view CRA activities"
  ON public.cra_case_activities FOR SELECT
  USING (public.has_dealer_access(dealer_id));

CREATE POLICY "Dealer members can insert CRA activities"
  ON public.cra_case_activities FOR INSERT
  WITH CHECK (dealer_id = public.get_user_dealer_id());

-- Storage bucket for CRA evidence
INSERT INTO storage.buckets (id, name, public) VALUES ('cra-evidence', 'cra-evidence', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "CRA evidence select" ON storage.objects FOR SELECT
  USING (bucket_id = 'cra-evidence' AND auth.uid() IS NOT NULL);

CREATE POLICY "CRA evidence insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cra-evidence' AND auth.uid() IS NOT NULL);
