/*
# Create profiles and quote_requests tables

## Purpose
Creates the core data tables for CzystaLista:
1. `profiles` — extends auth.users with full_name, phone, account_type (client/company), and city.
   Company accounts use city to filter incoming quote requests.
2. `quote_requests` — stores quote calculator submissions (service, city, area, phone, etc.).
   Companies see requests matching their city.

## New Tables

### profiles
- id (uuid, PK, references auth.users)
- full_name (text)
- phone (text)
- account_type (text, 'client' or 'company', default 'client')
- city (text, nullable — company accounts set this to receive matching leads)
- created_at, updated_at (timestamptz)

### quote_requests
- id (uuid, PK)
- created_at (timestamptz, default now())
- service (text, not null) — quote service type
- city (text, not null) — requested city
- area (int, not null) — square meters
- bathrooms (int, not null)
- extras (text[], default '{}')
- price_min (int, not null) — estimated min price
- price_max (int, not null) — estimated max price
- phone (text, not null) — customer phone
- timing (text, not null) — urgency
- consent (boolean, not null)
- frequency (text, not null, default 'once')
- status (text, not null, default 'new') — new / accepted / rejected by companies

## Security
- RLS enabled on both tables.
- profiles: users can CRUD only their own row (auth.uid() = id).
- quote_requests: company-type authenticated users can SELECT requests matching their city.
  Clients (the submitter) can be identified by phone but do not have direct row ownership
  since the calculator is submitted without login. Service role handles inserts server-side.
- Grants: authenticated gets SELECT on quote_requests (filtered by RLS);
  service_role gets ALL for server-side inserts and management.
- A SECURITY DEFINER trigger creates a profile row on auth.users insert.

## Important Notes
1. The quote calculator submits via a server function using supabaseAdmin (service_role),
   so inserts bypass RLS — no anon INSERT policy needed.
2. Companies see only requests in their city via the RLS SELECT policy.
3. city on profiles is set by the company during registration or in the panel.
*/

-- ===== PROFILES =====
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  account_type text NOT NULL DEFAULT 'client' CHECK (account_type IN ('client','company')),
  city text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

DROP POLICY IF EXISTS "Own profile select" ON public.profiles;
CREATE POLICY "Own profile select" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Own profile insert" ON public.profiles;
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Own profile update" ON public.profiles;
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, account_type, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'phone',
    CASE WHEN NEW.raw_user_meta_data->>'account_type' = 'company' THEN 'company' ELSE 'client' END,
    NEW.raw_user_meta_data->>'city'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name),
    phone = COALESCE(NEW.raw_user_meta_data->>'phone', profiles.phone),
    city = COALESCE(NEW.raw_user_meta_data->>'city', profiles.city);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== QUOTE_REQUESTS =====
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  service text NOT NULL,
  city text NOT NULL,
  area int NOT NULL,
  bathrooms int NOT NULL,
  extras text[] NOT NULL DEFAULT '{}',
  price_min int NOT NULL,
  price_max int NOT NULL,
  phone text NOT NULL,
  timing text NOT NULL,
  consent boolean NOT NULL,
  frequency text NOT NULL DEFAULT 'once',
  status text NOT NULL DEFAULT 'new'
);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Companies (authenticated) can see requests in their city
GRANT SELECT ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;

DROP POLICY IF EXISTS "Companies can view requests in their city" ON public.quote_requests;
CREATE POLICY "Companies can view requests in their city"
  ON public.quote_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.account_type = 'company'
        AND profiles.city = quote_requests.city
    )
  );

CREATE INDEX IF NOT EXISTS quote_requests_city_idx ON public.quote_requests (city, created_at DESC);
CREATE INDEX IF NOT EXISTS quote_requests_phone_idx ON public.quote_requests (phone, created_at DESC);