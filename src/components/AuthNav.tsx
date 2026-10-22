import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AuthNav() {
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setEmail(session?.user.email ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  if (email) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="hidden text-muted-foreground sm:inline">{email}</span>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/", replace: true });
          }}
          className="rounded-xl border bg-card px-4 py-2 font-medium hover:bg-muted"
        >
          Wyloguj
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-sm">
      <Link to="/logowanie" className="rounded-xl px-4 py-2 font-medium hover:bg-muted">Zaloguj się</Link>
      <Link to="/rejestracja" className="rounded-xl bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90">Załóż konto</Link>
    </div>
  );
}
