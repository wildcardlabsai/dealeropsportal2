
-- ====================================================================
-- PLANS table (global, not dealer-scoped)
-- ====================================================================
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  monthly_price numeric NOT NULL DEFAULT 0,
  annual_price numeric,
  features_json jsonb DEFAULT '[]'::jsonb,
  max_users int,
  max_checks_per_month int,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view active plans
CREATE POLICY "Anyone can view active plans" ON public.plans FOR SELECT USING (true);
-- Only SuperAdmin can manage plans
CREATE POLICY "SuperAdmin can manage plans" ON public.plans FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ====================================================================
-- DEALER_SUBSCRIPTIONS table
-- ====================================================================
CREATE TABLE public.dealer_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  next_review_date date,
  notes text,
  updated_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_dealer_subscriptions_dealer ON public.dealer_subscriptions(dealer_id);
ALTER TABLE public.dealer_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dealer subscription" ON public.dealer_subscriptions FOR SELECT USING (dealer_id = public.get_user_dealer_id());
CREATE POLICY "SuperAdmin full access on dealer_subscriptions" ON public.dealer_subscriptions FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ====================================================================
-- UPGRADE_REQUESTS table
-- ====================================================================
CREATE TABLE public.upgrade_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  current_plan_id uuid REFERENCES public.plans(id),
  requested_plan_id uuid NOT NULL REFERENCES public.plans(id),
  requested_by_user_id uuid NOT NULL,
  request_notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'cancelled')),
  admin_notes text,
  approved_by_user_id uuid,
  approved_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_upgrade_requests_dealer ON public.upgrade_requests(dealer_id);
ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dealer upgrade requests" ON public.upgrade_requests FOR SELECT USING (dealer_id = public.get_user_dealer_id());
CREATE POLICY "DealerAdmin can create upgrade requests" ON public.upgrade_requests FOR INSERT WITH CHECK (dealer_id = public.get_user_dealer_id());
CREATE POLICY "SuperAdmin full access on upgrade_requests" ON public.upgrade_requests FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ====================================================================
-- BILLING_DOCUMENTS table
-- ====================================================================
CREATE TABLE public.billing_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  upgrade_request_id uuid REFERENCES public.upgrade_requests(id),
  document_type text NOT NULL DEFAULT 'proforma' CHECK (document_type IN ('proforma', 'invoice', 'quote')),
  pdf_url text,
  amount numeric NOT NULL DEFAULT 0,
  description text,
  created_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_documents_dealer ON public.billing_documents(dealer_id);
ALTER TABLE public.billing_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dealer billing docs" ON public.billing_documents FOR SELECT USING (dealer_id = public.get_user_dealer_id());
CREATE POLICY "SuperAdmin full access on billing_documents" ON public.billing_documents FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ====================================================================
-- PERMISSION_FLAGS table
-- ====================================================================
CREATE TABLE public.permission_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(dealer_id, user_id, key)
);

CREATE INDEX idx_permission_flags_user ON public.permission_flags(user_id);
ALTER TABLE public.permission_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own permissions" ON public.permission_flags FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "DealerAdmin can manage permissions" ON public.permission_flags FOR ALL USING (public.is_dealer_admin_or_super(dealer_id)) WITH CHECK (public.is_dealer_admin_or_super(dealer_id));
CREATE POLICY "SuperAdmin full access on permission_flags" ON public.permission_flags FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ====================================================================
-- Seed default plans (only if none exist)
-- ====================================================================
INSERT INTO public.plans (name, monthly_price, annual_price, max_users, max_checks_per_month, features_json)
SELECT * FROM (VALUES
  ('Starter'::text, 49::numeric, 470::numeric, 3::int, 50::int, '["Customers & Vehicles","Lead Pipeline","Invoice Generation","5 Vehicle Checks/month","Email Support"]'::jsonb),
  ('Professional'::text, 99::numeric, 950::numeric, 10::int, 200::int, '["Everything in Starter","Warranty Tracking","Aftersales Management","Courtesy Car Tracking","Reports & KPIs","200 Vehicle Checks/month","Priority Support"]'::jsonb),
  ('Elite'::text, 199::numeric, 1900::numeric, NULL::int, NULL::int, '["Everything in Professional","Unlimited Users","Unlimited Vehicle Checks","Review Booster","Document Storage","Audit Logging","Dedicated Account Manager"]'::jsonb)
) AS t(name, monthly_price, annual_price, max_users, max_checks_per_month, features_json)
WHERE NOT EXISTS (SELECT 1 FROM public.plans LIMIT 1);

-- Add updated_at triggers
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dealer_subscriptions_updated_at BEFORE UPDATE ON public.dealer_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_upgrade_requests_updated_at BEFORE UPDATE ON public.upgrade_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
