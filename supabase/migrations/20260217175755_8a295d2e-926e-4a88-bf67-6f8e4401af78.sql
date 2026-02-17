
-- Add 'trial' to dealer_status enum
ALTER TYPE dealer_status ADD VALUE IF NOT EXISTS 'trial';

-- Add trial tracking to dealers
ALTER TABLE public.dealers ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone;

-- Add 'trial' status to dealer_subscriptions for trial tracking  
-- (we'll use existing subscription table with status='trial')
