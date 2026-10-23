-- Firmy: miasto działania w profilu
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;

-- Status zgłoszenia w panelu firmy
ALTER TABLE public.quote_requests ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

-- Zapis miasta przy rejestracji (metadane konta)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, account_type, city)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'client'),
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'city'), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name),
    phone = COALESCE(NEW.raw_user_meta_data->>'phone', profiles.phone),
    city = COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data->>'city'), ''), profiles.city);
  RETURN NEW;
END;
$$;

-- Dostęp dla zalogowanych: firma widzi i zmienia status tylko zapytań ze swojego miasta
GRANT SELECT, UPDATE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view requests in their city"
ON public.quote_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.account_type = 'company'
      AND profiles.city IS NOT NULL
      AND LOWER(BTRIM(profiles.city)) = LOWER(BTRIM(quote_requests.city))
  )
);

CREATE POLICY "Companies can update status of requests in their city"
ON public.quote_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.account_type = 'company'
      AND profiles.city IS NOT NULL
      AND LOWER(BTRIM(profiles.city)) = LOWER(BTRIM(quote_requests.city))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.account_type = 'company'
      AND profiles.city IS NOT NULL
      AND LOWER(BTRIM(profiles.city)) = LOWER(BTRIM(quote_requests.city))
  )
);

CREATE INDEX IF NOT EXISTS quote_requests_city_idx ON public.quote_requests (city, created_at DESC);