
-- ============================================================
-- PART 1: LEADS PIPELINE EXTENSIONS
-- ============================================================

-- Extend lead_status enum with pipeline stages
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'appointment_set';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'test_drive';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'reserved';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'sold';

-- Add new columns to leads table
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lead_number text,
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS budget_min numeric,
  ADD COLUMN IF NOT EXISTS budget_max numeric,
  ADD COLUMN IF NOT EXISTS finance_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS next_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS lost_reason text,
  ADD COLUMN IF NOT EXISTS vehicle_interest_text text,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid;

-- Create lead_number sequence
CREATE SEQUENCE IF NOT EXISTS lead_number_seq START 1;

-- Auto-generate lead_number
CREATE OR REPLACE FUNCTION public.generate_lead_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lead_number IS NULL OR NEW.lead_number = '' THEN
    NEW.lead_number := 'LEAD-' || LPAD(nextval('lead_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_generate_lead_number ON public.leads;
CREATE TRIGGER trg_generate_lead_number
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_lead_number();

-- Backfill existing leads with lead_number
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.leads WHERE lead_number IS NULL ORDER BY created_at LOOP
    UPDATE public.leads SET lead_number = 'LEAD-' || LPAD(nextval('lead_number_seq')::text, 6, '0') WHERE id = r.id;
  END LOOP;
END;
$$;

-- Create lead_activities table
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  created_by_user_id uuid,
  type text NOT NULL DEFAULT 'note',
  message text,
  old_stage text,
  new_stage text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_dealer ON public.lead_activities(dealer_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON public.lead_activities(lead_id);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmin full access on lead_activities" ON public.lead_activities FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Users can view own dealer lead_activities" ON public.lead_activities FOR SELECT
  USING (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can insert own dealer lead_activities" ON public.lead_activities FOR INSERT
  WITH CHECK (dealer_id = get_user_dealer_id());

-- Create lead_appointments table
CREATE TABLE IF NOT EXISTS public.lead_appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  appointment_type text NOT NULL DEFAULT 'viewing',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  location text,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_appointments_dealer ON public.lead_appointments(dealer_id);
CREATE INDEX IF NOT EXISTS idx_lead_appointments_lead ON public.lead_appointments(lead_id);

ALTER TABLE public.lead_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmin full access on lead_appointments" ON public.lead_appointments FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Users can view own dealer lead_appointments" ON public.lead_appointments FOR SELECT
  USING (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can insert own dealer lead_appointments" ON public.lead_appointments FOR INSERT
  WITH CHECK (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can update own dealer lead_appointments" ON public.lead_appointments FOR UPDATE
  USING (dealer_id = get_user_dealer_id()) WITH CHECK (dealer_id = get_user_dealer_id());

-- ============================================================
-- PART 2: HANDOVER PACK MODULE
-- ============================================================

-- Create handover_number sequence
CREATE SEQUENCE IF NOT EXISTS handover_number_seq START 1;

-- Create handovers table
CREATE TABLE IF NOT EXISTS public.handovers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  handover_number text,
  status text NOT NULL DEFAULT 'draft',
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id),
  invoice_id uuid REFERENCES public.invoices(id),
  scheduled_delivery_at timestamptz,
  delivered_at timestamptz,
  staff_user_id uuid,
  delivery_type text NOT NULL DEFAULT 'collection',
  delivery_address text,
  mileage_at_handover numeric,
  fuel_level text,
  keys_count integer NOT NULL DEFAULT 2,
  notes text,
  signature_name text,
  signature_mode text,
  signature_image_url text,
  signed_at timestamptz,
  handover_pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_handovers_dealer ON public.handovers(dealer_id);
CREATE INDEX IF NOT EXISTS idx_handovers_customer ON public.handovers(customer_id);
CREATE INDEX IF NOT EXISTS idx_handovers_vehicle ON public.handovers(vehicle_id);

-- Auto-generate handover_number
CREATE OR REPLACE FUNCTION public.generate_handover_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.handover_number IS NULL OR NEW.handover_number = '' THEN
    NEW.handover_number := 'HND-' || LPAD(nextval('handover_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_generate_handover_number
  BEFORE INSERT ON public.handovers
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_handover_number();

ALTER TABLE public.handovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmin full access on handovers" ON public.handovers FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Users can view own dealer handovers" ON public.handovers FOR SELECT
  USING (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can insert own dealer handovers" ON public.handovers FOR INSERT
  WITH CHECK (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can update own dealer handovers" ON public.handovers FOR UPDATE
  USING (dealer_id = get_user_dealer_id()) WITH CHECK (dealer_id = get_user_dealer_id());

-- Create handover_items table
CREATE TABLE IF NOT EXISTS public.handover_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  handover_id uuid NOT NULL REFERENCES public.handovers(id) ON DELETE CASCADE,
  section text NOT NULL DEFAULT 'other',
  item_label text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  completed_by_user_id uuid,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_handover_items_handover ON public.handover_items(handover_id);

ALTER TABLE public.handover_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmin full access on handover_items" ON public.handover_items FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Users can view own dealer handover_items" ON public.handover_items FOR SELECT
  USING (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can insert own dealer handover_items" ON public.handover_items FOR INSERT
  WITH CHECK (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can update own dealer handover_items" ON public.handover_items FOR UPDATE
  USING (dealer_id = get_user_dealer_id()) WITH CHECK (dealer_id = get_user_dealer_id());

-- Create handover_photos table
CREATE TABLE IF NOT EXISTS public.handover_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id),
  handover_id uuid NOT NULL REFERENCES public.handovers(id) ON DELETE CASCADE,
  photo_type text NOT NULL DEFAULT 'other',
  file_url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_handover_photos_handover ON public.handover_photos(handover_id);

ALTER TABLE public.handover_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmin full access on handover_photos" ON public.handover_photos FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Users can view own dealer handover_photos" ON public.handover_photos FOR SELECT
  USING (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can insert own dealer handover_photos" ON public.handover_photos FOR INSERT
  WITH CHECK (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can delete own dealer handover_photos" ON public.handover_photos FOR DELETE
  USING (dealer_id = get_user_dealer_id());

-- Create handover_templates table
CREATE TABLE IF NOT EXISTS public.handover_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id uuid REFERENCES public.dealers(id),
  name text NOT NULL,
  items_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.handover_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view default handover_templates" ON public.handover_templates FOR SELECT
  USING (dealer_id IS NULL);
CREATE POLICY "SuperAdmin full access on handover_templates" ON public.handover_templates FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Users can view own dealer handover_templates" ON public.handover_templates FOR SELECT
  USING (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can insert own dealer handover_templates" ON public.handover_templates FOR INSERT
  WITH CHECK (dealer_id = get_user_dealer_id());
CREATE POLICY "Users can update own dealer handover_templates" ON public.handover_templates FOR UPDATE
  USING (dealer_id = get_user_dealer_id()) WITH CHECK (dealer_id = get_user_dealer_id());

-- Seed default handover template
INSERT INTO public.handover_templates (name, is_default, items_json) VALUES
('Standard Vehicle Handover', true, '[
  {"section":"documents","items":["V5C / V5C/2 document status explained","Service book / service history provided","MOT certificate provided","Insurance / tax reminder given","Owner manual provided","Spare key handed over"]},
  {"section":"vehicle_condition","items":["Exterior walk-around completed - no damage noted","Interior condition checked","Tyre condition & pressures checked","All lights working","Windscreen wipers & washers working","Number plates secure & legal"]},
  {"section":"controls_demo","items":["Dashboard warning lights explained","Heating / air conditioning demo","Infotainment / Bluetooth pairing demo","Cruise control / driver aids explained","Electric mirrors / windows / seats demo","Boot release / fuel cap release shown"]},
  {"section":"warranty_info","items":["Warranty coverage explained","Warranty start/end dates confirmed","Claim process explained","Exclusions highlighted"]},
  {"section":"keys_accessories","items":["All keys handed over","Locking wheel nut key located","Jack & wheel brace present","Spare wheel / tyre repair kit present","Parcel shelf / load cover present"]},
  {"section":"safety","items":["First aid kit location shown (if fitted)","Warning triangle (if fitted)","Breakdown cover details provided","Emergency contact number given"]}
]'::jsonb)
ON CONFLICT DO NOTHING;

-- Storage bucket for handover photos
INSERT INTO storage.buckets (id, name, public) VALUES ('handover-photos', 'handover-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload handover photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'handover-photos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can view handover photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'handover-photos' AND auth.uid() IS NOT NULL);

-- Storage bucket for handover signatures
INSERT INTO storage.buckets (id, name, public) VALUES ('handover-signatures', 'handover-signatures', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload handover signatures" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'handover-signatures' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can view handover signatures" ON storage.objects FOR SELECT
  USING (bucket_id = 'handover-signatures' AND auth.uid() IS NOT NULL);
