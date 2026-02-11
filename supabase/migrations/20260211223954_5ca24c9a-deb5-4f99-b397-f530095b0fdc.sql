
-- =============================================
-- PHASE 2: CUSTOMERS, VEHICLES, VEHICLE CHECKS
-- =============================================

-- ENUMS
CREATE TYPE public.vehicle_status AS ENUM ('in_stock', 'reserved', 'sold', 'in_repair', 'returned');
CREATE TYPE public.vehicle_location AS ENUM ('on_site', 'garage', 'customer', 'other');
CREATE TYPE public.fuel_type AS ENUM ('petrol', 'diesel', 'electric', 'hybrid', 'plug_in_hybrid', 'other');
CREATE TYPE public.transmission_type AS ENUM ('manual', 'automatic', 'other');
CREATE TYPE public.contact_method AS ENUM ('phone', 'email', 'whatsapp', 'post');

-- =============================================
-- CUSTOMERS TABLE
-- =============================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postcode TEXT,
  preferred_contact_method public.contact_method DEFAULT 'phone',
  consent_marketing BOOLEAN NOT NULL DEFAULT false,
  consent_marketing_at TIMESTAMPTZ,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_customers_dealer_id ON public.customers(dealer_id);
CREATE INDEX idx_customers_name ON public.customers(last_name, first_name);
CREATE INDEX idx_customers_email ON public.customers(email);

-- Customers RLS
CREATE POLICY "SuperAdmin full access on customers"
  ON public.customers FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Users can view own dealer customers"
  ON public.customers FOR SELECT TO authenticated
  USING (dealer_id = public.get_user_dealer_id() AND is_deleted = false);

CREATE POLICY "Users can insert own dealer customers"
  ON public.customers FOR INSERT TO authenticated
  WITH CHECK (dealer_id = public.get_user_dealer_id());

CREATE POLICY "Users can update own dealer customers"
  ON public.customers FOR UPDATE TO authenticated
  USING (dealer_id = public.get_user_dealer_id())
  WITH CHECK (dealer_id = public.get_user_dealer_id());

-- =============================================
-- VEHICLES TABLE
-- =============================================
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  vrm TEXT,
  vin TEXT,
  make TEXT,
  model TEXT,
  derivative TEXT,
  year INTEGER,
  mileage INTEGER,
  fuel_type public.fuel_type,
  transmission public.transmission_type,
  colour TEXT,
  purchase_date DATE,
  purchase_price NUMERIC(10,2),
  advertised_price NUMERIC(10,2),
  status public.vehicle_status NOT NULL DEFAULT 'in_stock',
  location public.vehicle_location NOT NULL DEFAULT 'on_site',
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_vehicles_dealer_id ON public.vehicles(dealer_id);
CREATE INDEX idx_vehicles_vrm ON public.vehicles(vrm);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_customer_id ON public.vehicles(customer_id);

-- Vehicles RLS
CREATE POLICY "SuperAdmin full access on vehicles"
  ON public.vehicles FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Users can view own dealer vehicles"
  ON public.vehicles FOR SELECT TO authenticated
  USING (dealer_id = public.get_user_dealer_id() AND is_deleted = false);

CREATE POLICY "Users can insert own dealer vehicles"
  ON public.vehicles FOR INSERT TO authenticated
  WITH CHECK (dealer_id = public.get_user_dealer_id());

CREATE POLICY "Users can update own dealer vehicles"
  ON public.vehicles FOR UPDATE TO authenticated
  USING (dealer_id = public.get_user_dealer_id())
  WITH CHECK (dealer_id = public.get_user_dealer_id());

-- =============================================
-- VEHICLE CHECKS TABLE
-- =============================================
CREATE TABLE public.vehicle_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  vrm TEXT NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dvla_data JSONB,
  dvsa_data JSONB,
  gvd_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_checks ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_vehicle_checks_dealer_id ON public.vehicle_checks(dealer_id);
CREATE INDEX idx_vehicle_checks_vrm ON public.vehicle_checks(vrm);
CREATE INDEX idx_vehicle_checks_created_at ON public.vehicle_checks(created_at DESC);

-- Vehicle Checks RLS
CREATE POLICY "SuperAdmin full access on vehicle_checks"
  ON public.vehicle_checks FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Users can view own dealer checks"
  ON public.vehicle_checks FOR SELECT TO authenticated
  USING (dealer_id = public.get_user_dealer_id());

CREATE POLICY "Users can insert own dealer checks"
  ON public.vehicle_checks FOR INSERT TO authenticated
  WITH CHECK (dealer_id = public.get_user_dealer_id());

-- =============================================
-- COMMUNICATION LOG TABLE
-- =============================================
CREATE TABLE public.communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  log_type TEXT NOT NULL, -- call, email, whatsapp, meeting, document_sent
  subject TEXT,
  content TEXT,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_comm_logs_dealer_id ON public.communication_logs(dealer_id);
CREATE INDEX idx_comm_logs_customer_id ON public.communication_logs(customer_id);

CREATE POLICY "SuperAdmin full access on communication_logs"
  ON public.communication_logs FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Users can view own dealer comm logs"
  ON public.communication_logs FOR SELECT TO authenticated
  USING (dealer_id = public.get_user_dealer_id());

CREATE POLICY "Users can insert own dealer comm logs"
  ON public.communication_logs FOR INSERT TO authenticated
  WITH CHECK (dealer_id = public.get_user_dealer_id());
