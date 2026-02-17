
-- Fix 1: Dealer logos - replace permissive upload/update policies with dealer-scoped ones
DROP POLICY IF EXISTS "Dealer logos upload by authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Dealer logos update by authenticated" ON storage.objects;

CREATE POLICY "Dealer logos upload by own dealer" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'dealer-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT dealer_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Dealer logos update by own dealer" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'dealer-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT dealer_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Fix 2: Audit logs - replace permissive insert policy with strict validation
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;

CREATE POLICY "Users can insert own audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_user_id = auth.uid()
    AND (dealer_id IS NULL OR dealer_id = public.get_user_dealer_id())
  );
