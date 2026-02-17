
-- Add stripe_product_id and stripe_price_id columns to plans table
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS stripe_product_id text;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Update Starter plan: £49 → £99
UPDATE public.plans SET monthly_price = 99, stripe_product_id = 'prod_Tzs1NZUKGEA4a4', stripe_price_id = 'price_1T1sHQEIt2zwJjCt6zTU6Ksq' WHERE id = '44ba79ee-4ad1-4752-ba74-777b18a4ded6';

-- Update Professional plan: £99 → £125
UPDATE public.plans SET monthly_price = 125, stripe_product_id = 'prod_Tzs2bntmKaRf2N', stripe_price_id = 'price_1T1sIYEIt2zwJjCt0LcZWrLb' WHERE id = '6255c22b-14f3-47a3-9b0f-f2f0485df56b';

-- Update Elite plan: keep £199, add Stripe IDs
UPDATE public.plans SET stripe_product_id = 'prod_Tzs9ZhOe7EKYJz', stripe_price_id = 'price_1T1sPIEIt2zwJjCtsiGdtc1L' WHERE id = 'c5df6e93-e933-421a-865c-6317558c567c';
