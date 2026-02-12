
-- Auto-generate ticket_number using a sequence
CREATE SEQUENCE IF NOT EXISTS support_ticket_number_seq START WITH 1;

-- Function to auto-set ticket_number if not provided
CREATE OR REPLACE FUNCTION public.generate_support_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := 'SUP-' || LPAD(nextval('support_ticket_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_generate_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_support_ticket_number();

-- Sync the sequence to existing data
DO $$
DECLARE
  max_num INT;
BEGIN
  SELECT COALESCE(MAX(
    CASE WHEN ticket_number ~ '^SUP-[0-9]+$'
      THEN CAST(SUBSTRING(ticket_number FROM 5) AS INT)
      ELSE 0
    END
  ), 0) INTO max_num FROM public.support_tickets;
  IF max_num > 0 THEN
    PERFORM setval('support_ticket_number_seq', max_num);
  END IF;
END $$;

-- Create storage bucket for support attachments (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for support attachments
CREATE POLICY "Dealer users upload support attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'support-attachments'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Dealer users view own support attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'support-attachments'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "SuperAdmin view all support attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'support-attachments'
  AND is_super_admin()
);
