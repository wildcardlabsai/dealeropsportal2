
-- Compliance Centre enums
CREATE TYPE public.consent_type AS ENUM ('marketing_email', 'marketing_sms', 'marketing_call', 'whatsapp', 'data_sharing_third_party');
CREATE TYPE public.consent_status AS ENUM ('granted', 'withdrawn');
CREATE TYPE public.legal_basis AS ENUM ('consent', 'legitimate_interest');
CREATE TYPE public.dsr_type AS ENUM ('sar', 'erasure', 'rectification', 'restriction', 'objection', 'portability');
CREATE TYPE public.dsr_status AS ENUM ('new', 'in_review', 'awaiting_id', 'completed', 'rejected');
CREATE TYPE public.retention_entity_type AS ENUM ('customer', 'invoice', 'aftersales', 'warranty', 'vehicle_check', 'task', 'courtesy_loan', 'document');
CREATE TYPE public.retention_queue_status AS ENUM ('pending', 'approved', 'deleted', 'skipped');
CREATE TYPE public.complaint_channel AS ENUM ('phone', 'email', 'in_person', 'letter', 'other');
CREATE TYPE public.complaint_category AS ENUM ('service', 'vehicle_quality', 'finance', 'warranty', 'aftersales', 'other');
CREATE TYPE public.complaint_status AS ENUM ('open', 'under_investigation', 'resolved', 'closed');
CREATE TYPE public.compliance_doc_type AS ENUM ('privacy_notice', 'complaints_policy', 'data_retention_policy', 'customer_dispute_template', 'subject_access_template', 'erasure_confirmation_template', 'other');
CREATE TYPE public.incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.incident_status AS ENUM ('open', 'monitoring', 'closed');

-- customer_consents
CREATE TABLE public.customer_consents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  consent_type public.consent_type NOT NULL,
  status public.consent_status NOT NULL DEFAULT 'granted',
  legal_basis public.legal_basis NOT NULL DEFAULT 'consent',
  source text,
  captured_by_user_id uuid NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_consents_dealer ON public.customer_consents(dealer_id);
CREATE INDEX idx_consents_customer ON public.customer_consents(customer_id);

-- data_subject_requests
CREATE TABLE public.data_subject_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  request_number text NOT NULL DEFAULT '',
  request_type public.dsr_type NOT NULL,
  customer_id uuid REFERENCES public.customers(id),
  requester_name text NOT NULL,
  requester_email text,
  requester_phone text,
  identity_verified boolean NOT NULL DEFAULT false,
  identity_verification_notes text,
  received_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  status public.dsr_status NOT NULL DEFAULT 'new',
  assigned_to_user_id uuid,
  outcome_notes text,
  exported_data_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dsr_dealer ON public.data_subject_requests(dealer_id);

CREATE OR REPLACE FUNCTION public.generate_dsr_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE next_num int;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 5) AS int)), 0) + 1
    INTO next_num FROM public.data_subject_requests WHERE dealer_id = NEW.dealer_id;
  NEW.request_number := 'DSR-' || LPAD(next_num::text, 6, '0');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_dsr_number BEFORE INSERT ON public.data_subject_requests
  FOR EACH ROW EXECUTE FUNCTION public.generate_dsr_number();
CREATE TRIGGER update_dsr_updated_at BEFORE UPDATE ON public.data_subject_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- retention_settings
CREATE TABLE public.retention_settings (
  dealer_id uuid PRIMARY KEY REFERENCES public.dealers(id),
  customers_retention_months int NOT NULL DEFAULT 72,
  invoices_retention_months int NOT NULL DEFAULT 72,
  aftersales_retention_months int NOT NULL DEFAULT 72,
  warranty_retention_months int NOT NULL DEFAULT 72,
  vehicle_checks_retention_months int NOT NULL DEFAULT 24,
  tasks_retention_months int NOT NULL DEFAULT 24,
  courtesy_loans_retention_months int NOT NULL DEFAULT 24,
  auto_delete_enabled boolean NOT NULL DEFAULT false,
  last_retention_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER update_retention_settings_updated_at BEFORE UPDATE ON public.retention_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- retention_queue
CREATE TABLE public.retention_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  entity_type public.retention_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  reason text,
  eligible_at timestamptz NOT NULL,
  status public.retention_queue_status NOT NULL DEFAULT 'pending',
  approved_by_user_id uuid,
  approved_at timestamptz,
  deleted_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_retention_queue_dealer ON public.retention_queue(dealer_id);

-- complaints
CREATE TABLE public.complaints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  complaint_ref text NOT NULL DEFAULT '',
  customer_id uuid REFERENCES public.customers(id),
  customer_name text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  channel public.complaint_channel NOT NULL DEFAULT 'phone',
  category public.complaint_category NOT NULL DEFAULT 'other',
  description text NOT NULL,
  status public.complaint_status NOT NULL DEFAULT 'open',
  assigned_to_user_id uuid,
  resolution_summary text,
  resolution_at timestamptz,
  goodwill_amount numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_complaints_dealer ON public.complaints(dealer_id);

CREATE OR REPLACE FUNCTION public.generate_complaint_ref()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE next_num int;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(complaint_ref FROM 6) AS int)), 0) + 1
    INTO next_num FROM public.complaints WHERE dealer_id = NEW.dealer_id;
  NEW.complaint_ref := 'COMP-' || LPAD(next_num::text, 6, '0');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_complaint_ref BEFORE INSERT ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.generate_complaint_ref();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- compliance_documents
CREATE TABLE public.compliance_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  doc_type public.compliance_doc_type NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  version text NOT NULL DEFAULT '1.0',
  is_active boolean NOT NULL DEFAULT true,
  updated_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_compliance_docs_dealer ON public.compliance_documents(dealer_id);
CREATE TRIGGER update_compliance_docs_updated_at BEFORE UPDATE ON public.compliance_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- compliance_incidents
CREATE TABLE public.compliance_incidents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  severity public.incident_severity NOT NULL DEFAULT 'low',
  title text NOT NULL,
  description text NOT NULL,
  actions_taken text,
  status public.incident_status NOT NULL DEFAULT 'open',
  created_by_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_incidents_dealer ON public.compliance_incidents(dealer_id);
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON public.compliance_incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS on all tables
ALTER TABLE public.customer_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_incidents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Dealer access consents" ON public.customer_consents FOR SELECT USING (public.has_dealer_access(dealer_id));
CREATE POLICY "Dealer insert consents" ON public.customer_consents FOR INSERT WITH CHECK (dealer_id = public.get_user_dealer_id());
CREATE POLICY "Dealer update consents" ON public.customer_consents FOR UPDATE USING (public.has_dealer_access(dealer_id));

CREATE POLICY "Dealer access dsr" ON public.data_subject_requests FOR SELECT USING (public.has_dealer_access(dealer_id));
CREATE POLICY "Dealer insert dsr" ON public.data_subject_requests FOR INSERT WITH CHECK (dealer_id = public.get_user_dealer_id());
CREATE POLICY "Dealer update dsr" ON public.data_subject_requests FOR UPDATE USING (public.has_dealer_access(dealer_id));

CREATE POLICY "Dealer access retention_settings" ON public.retention_settings FOR SELECT USING (public.has_dealer_access(dealer_id));
CREATE POLICY "Dealer insert retention_settings" ON public.retention_settings FOR INSERT WITH CHECK (dealer_id = public.get_user_dealer_id());
CREATE POLICY "Dealer update retention_settings" ON public.retention_settings FOR UPDATE USING (public.has_dealer_access(dealer_id));

CREATE POLICY "Dealer access retention_queue" ON public.retention_queue FOR SELECT USING (public.has_dealer_access(dealer_id));
CREATE POLICY "Dealer insert retention_queue" ON public.retention_queue FOR INSERT WITH CHECK (dealer_id = public.get_user_dealer_id());
CREATE POLICY "Dealer update retention_queue" ON public.retention_queue FOR UPDATE USING (public.has_dealer_access(dealer_id));

CREATE POLICY "Dealer access complaints" ON public.complaints FOR SELECT USING (public.has_dealer_access(dealer_id));
CREATE POLICY "Dealer insert complaints" ON public.complaints FOR INSERT WITH CHECK (dealer_id = public.get_user_dealer_id());
CREATE POLICY "Dealer update complaints" ON public.complaints FOR UPDATE USING (public.has_dealer_access(dealer_id));

CREATE POLICY "Dealer access compliance_documents" ON public.compliance_documents FOR SELECT USING (public.has_dealer_access(dealer_id));
CREATE POLICY "Dealer insert compliance_documents" ON public.compliance_documents FOR INSERT WITH CHECK (dealer_id = public.get_user_dealer_id());
CREATE POLICY "Dealer update compliance_documents" ON public.compliance_documents FOR UPDATE USING (public.has_dealer_access(dealer_id));

CREATE POLICY "Dealer access incidents" ON public.compliance_incidents FOR SELECT USING (public.has_dealer_access(dealer_id));
CREATE POLICY "Dealer insert incidents" ON public.compliance_incidents FOR INSERT WITH CHECK (dealer_id = public.get_user_dealer_id());
CREATE POLICY "Dealer update incidents" ON public.compliance_incidents FOR UPDATE USING (public.has_dealer_access(dealer_id));
