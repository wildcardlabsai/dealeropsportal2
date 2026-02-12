
-- Support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id),
  ticket_number TEXT NOT NULL,
  created_by_user_id UUID NOT NULL,
  assigned_to_superadmin_user_id UUID,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'GENERAL',
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'OPEN',
  related_entity_type TEXT NOT NULL DEFAULT 'NONE',
  related_entity_id UUID,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_tickets_dealer ON public.support_tickets(dealer_id);
CREATE INDEX idx_support_tickets_created_by ON public.support_tickets(created_by_user_id);
CREATE INDEX idx_support_tickets_assigned ON public.support_tickets(assigned_to_superadmin_user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_last_message ON public.support_tickets(last_message_at DESC);
CREATE UNIQUE INDEX idx_support_tickets_number ON public.support_tickets(ticket_number);

-- Auto-generate ticket number
CREATE OR REPLACE FUNCTION public.generate_support_ticket_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE next_num int;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 5) AS int)), 0) + 1
    INTO next_num FROM public.support_tickets;
  NEW.ticket_number := 'SUP-' || LPAD(next_num::text, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_support_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.generate_support_ticket_number();

CREATE TRIGGER trg_support_tickets_updated
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dealer users see own dealer tickets" ON public.support_tickets
  FOR SELECT USING (
    public.is_super_admin() OR
    dealer_id = public.get_user_dealer_id()
  );

CREATE POLICY "Dealer users create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (dealer_id = public.get_user_dealer_id());

CREATE POLICY "Dealer admins and super update tickets" ON public.support_tickets
  FOR UPDATE USING (
    public.is_super_admin() OR
    dealer_id = public.get_user_dealer_id()
  );

-- Support messages table
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_user_id UUID,
  author_role TEXT NOT NULL DEFAULT 'DEALER',
  message TEXT NOT NULL,
  is_internal_note BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_messages_ticket ON public.support_messages(ticket_id);
CREATE INDEX idx_support_messages_dealer ON public.support_messages(dealer_id);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see messages for accessible tickets" ON public.support_messages
  FOR SELECT USING (
    public.is_super_admin() OR
    (dealer_id = public.get_user_dealer_id() AND is_internal_note = false)
  );

CREATE POLICY "Users create messages" ON public.support_messages
  FOR INSERT WITH CHECK (
    public.is_super_admin() OR
    dealer_id = public.get_user_dealer_id()
  );

-- Support attachments table
CREATE TABLE public.support_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.support_messages(id),
  uploaded_by_user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INT,
  storage_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_attachments_ticket ON public.support_attachments(ticket_id);

ALTER TABLE public.support_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see attachments for accessible tickets" ON public.support_attachments
  FOR SELECT USING (
    public.is_super_admin() OR
    dealer_id = public.get_user_dealer_id()
  );

CREATE POLICY "Users upload attachments" ON public.support_attachments
  FOR INSERT WITH CHECK (
    public.is_super_admin() OR
    dealer_id = public.get_user_dealer_id()
  );

-- Storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('support-attachments', 'support-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Support attachments upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'support-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Support attachments read" ON storage.objects
  FOR SELECT USING (bucket_id = 'support-attachments' AND auth.role() = 'authenticated');
