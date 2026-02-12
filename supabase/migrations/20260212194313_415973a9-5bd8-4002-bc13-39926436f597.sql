
-- Store dealer review platform links
CREATE TABLE public.review_platform_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  review_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dealer_id, platform)
);

ALTER TABLE public.review_platform_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dealer review links"
  ON public.review_platform_links FOR SELECT
  USING (dealer_id IN (SELECT dealer_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage own dealer review links"
  ON public.review_platform_links FOR ALL
  USING (dealer_id IN (SELECT dealer_id FROM public.profiles WHERE id = auth.uid()));

-- Add review_link_url to review_requests to store the actual link sent
ALTER TABLE public.review_requests ADD COLUMN IF NOT EXISTS review_link_url TEXT;
