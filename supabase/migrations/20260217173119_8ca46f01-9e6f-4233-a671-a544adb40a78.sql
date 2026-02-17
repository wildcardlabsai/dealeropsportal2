
-- Add length constraints to contact_leads table
ALTER TABLE public.contact_leads
  ADD CONSTRAINT contact_leads_first_name_length CHECK (length(first_name) <= 100),
  ADD CONSTRAINT contact_leads_last_name_length CHECK (length(last_name) <= 100),
  ADD CONSTRAINT contact_leads_email_length CHECK (length(email) <= 255),
  ADD CONSTRAINT contact_leads_message_length CHECK (length(message) <= 5000),
  ADD CONSTRAINT contact_leads_phone_length CHECK (length(phone) <= 30),
  ADD CONSTRAINT contact_leads_dealership_name_length CHECK (length(dealership_name) <= 200);
