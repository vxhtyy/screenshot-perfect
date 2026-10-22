CREATE TABLE public.quote_requests (
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
  frequency text NOT NULL DEFAULT 'once'
);
GRANT ALL ON public.quote_requests TO service_role;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX quote_requests_phone_idx ON public.quote_requests (phone, created_at DESC);