
-- Extend dealers table with new fields
ALTER TABLE public.dealers
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS trading_name text,
  ADD COLUMN IF NOT EXISTS fca_number text,
  ADD COLUMN IF NOT EXISTS ico_number text,
  ADD COLUMN IF NOT EXISTS vat_number text,
  ADD COLUMN IF NOT EXISTS company_number text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS primary_colour text,
  ADD COLUMN IF NOT EXISTS invoice_footer_text text,
  ADD COLUMN IF NOT EXISTS bank_details_text text,
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Europe/London',
  ADD COLUMN IF NOT EXISTS default_currency text DEFAULT 'GBP',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- dealer_preferences
CREATE TABLE IF NOT EXISTS public.dealer_preferences (
  dealer_id uuid PRIMARY KEY REFERENCES public.dealers(id) ON DELETE CASCADE,
  invoice_trigger_review_request text DEFAULT 'off',
  default_review_platform_id uuid,
  default_email_template_id uuid,
  default_sms_template_id uuid,
  task_reminder_hours int DEFAULT 24,
  aftersales_first_response_sla_hours int DEFAULT 72,
  courtesy_agreement_template_id uuid,
  handover_template_id uuid,
  data_retention_months int DEFAULT 36,
  notifications_email_enabled boolean DEFAULT false,
  notifications_inapp_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.dealer_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealer preferences visible to dealer members" ON public.dealer_preferences
  FOR SELECT USING (public.has_dealer_access(dealer_id));

CREATE POLICY "Dealer preferences editable by admin" ON public.dealer_preferences
  FOR ALL USING (public.is_dealer_admin_or_super(dealer_id));

CREATE POLICY "Dealer preferences insert by admin" ON public.dealer_preferences
  FOR INSERT WITH CHECK (public.is_dealer_admin_or_super(dealer_id));

-- dealer_security_settings
CREATE TABLE IF NOT EXISTS public.dealer_security_settings (
  dealer_id uuid PRIMARY KEY REFERENCES public.dealers(id) ON DELETE CASCADE,
  allow_password_reset boolean DEFAULT true,
  require_mfa boolean DEFAULT false,
  ip_allowlist_json jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.dealer_security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Security settings visible to dealer" ON public.dealer_security_settings
  FOR SELECT USING (public.has_dealer_access(dealer_id));

CREATE POLICY "Security settings editable by admin" ON public.dealer_security_settings
  FOR ALL USING (public.is_dealer_admin_or_super(dealer_id));

-- dealer_onboarding_events
CREATE TABLE IF NOT EXISTS public.dealer_onboarding_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  created_by_superadmin_user_id uuid,
  event_type text NOT NULL,
  payload_json jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.dealer_onboarding_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Onboarding events superadmin only" ON public.dealer_onboarding_events
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Onboarding events insert superadmin" ON public.dealer_onboarding_events
  FOR INSERT WITH CHECK (public.is_super_admin());

-- email_outbox
CREATE TABLE IF NOT EXISTS public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid REFERENCES public.dealers(id) ON DELETE SET NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  body_text text NOT NULL,
  body_html text,
  attachments_json jsonb,
  status text NOT NULL DEFAULT 'simulated',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Email outbox superadmin read" ON public.email_outbox
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Email outbox superadmin insert" ON public.email_outbox
  FOR INSERT WITH CHECK (public.is_super_admin());

-- Create logo storage bucket
INSERT INTO storage.buckets (id, name, public)
  VALUES ('dealer-logos', 'dealer-logos', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Dealer logos publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'dealer-logos');

CREATE POLICY "Dealer logos upload by authenticated" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'dealer-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Dealer logos update by authenticated" ON storage.objects
  FOR UPDATE USING (bucket_id = 'dealer-logos' AND auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dealer_onboarding_dealer ON public.dealer_onboarding_events(dealer_id);
CREATE INDEX IF NOT EXISTS idx_email_outbox_dealer ON public.email_outbox(dealer_id);
