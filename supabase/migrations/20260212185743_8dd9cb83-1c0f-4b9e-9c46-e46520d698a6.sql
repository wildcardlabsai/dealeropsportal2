
-- Fix overly permissive "FOR ALL" policies - replace with specific operations
DROP POLICY IF EXISTS "Dealer preferences editable by admin" ON public.dealer_preferences;
DROP POLICY IF EXISTS "Dealer preferences insert by admin" ON public.dealer_preferences;

CREATE POLICY "Dealer preferences update by admin" ON public.dealer_preferences
  FOR UPDATE USING (public.is_dealer_admin_or_super(dealer_id));

CREATE POLICY "Dealer preferences insert by admin" ON public.dealer_preferences
  FOR INSERT WITH CHECK (public.is_dealer_admin_or_super(dealer_id));

CREATE POLICY "Dealer preferences delete by admin" ON public.dealer_preferences
  FOR DELETE USING (public.is_dealer_admin_or_super(dealer_id));

DROP POLICY IF EXISTS "Security settings editable by admin" ON public.dealer_security_settings;

CREATE POLICY "Security settings update by admin" ON public.dealer_security_settings
  FOR UPDATE USING (public.is_dealer_admin_or_super(dealer_id));

CREATE POLICY "Security settings insert by admin" ON public.dealer_security_settings
  FOR INSERT WITH CHECK (public.is_dealer_admin_or_super(dealer_id));

CREATE POLICY "Security settings delete by admin" ON public.dealer_security_settings
  FOR DELETE USING (public.is_dealer_admin_or_super(dealer_id));
