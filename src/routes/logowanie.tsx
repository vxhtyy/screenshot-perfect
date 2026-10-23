import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout, Divider, GoogleButton, btnCls, inputCls } from "@/components/AuthLayout";

export const Route = createFileRoute("/logowanie")({
  validateSearch: (search: Record<string, unknown>) => ({
    info: typeof search.info === "string" ? search.info : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Logowanie — CzystaLista" },
      { name: "description", content: "Zaloguj się do swojego konta w CzystaLista." },
      { property: "og:title", content: "Logowanie — CzystaLista" },
      { property: "og:description", content: "Zaloguj się do konta klienta lub firmy sprzątającej." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setInfo(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message.includes("confirm") ? "Najpierw potwierdź e-mail (sprawdź skrzynkę)." : "Nieprawidłowy e-mail lub hasło.");
    navigate({ to: "/" });
  }

  async function reset() {
    setError(""); setInfo("");
    if (!email) return setError("Wpisz najpierw swój e-mail.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) setError("Nie udało się wysłać linku.");
    else setInfo("Wysłaliśmy link do zmiany hasła na Twój e-mail.");
  }

  return (
    <AuthLayout title="Zaloguj się" subtitle="Witaj ponownie w CzystaLista.">
      <GoogleButton onError={setError} />
      <Divider />
      <form onSubmit={submit} className="space-y-3">
        <input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        <input type="password" required placeholder="Hasło" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        <div className="text-right">
          <button type="button" onClick={reset} className="text-sm text-primary hover:underline">Nie pamiętasz hasła?</button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {info && <p className="text-sm text-primary">{info}</p>}
        <button disabled={loading} className={btnCls}>{loading ? "Logowanie…" : "Zaloguj się"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Nie masz konta? <Link to="/rejestracja" className="font-medium text-primary hover:underline">Zarejestruj się</Link>
      </p>
    </AuthLayout>
  );
}
