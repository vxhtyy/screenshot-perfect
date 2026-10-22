import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout, Divider, GoogleButton, btnCls, inputCls } from "@/components/AuthLayout";

export const Route = createFileRoute("/rejestracja")({
  head: () => ({
    meta: [
      { title: "Rejestracja — CzystaLista" },
      { name: "description", content: "Załóż konto klienta lub firmy sprzątającej w CzystaLista." },
      { property: "og:title", content: "Rejestracja — CzystaLista" },
      { property: "og:description", content: "Dołącz do CzystaLista jako klient lub firma sprzątająca." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Register,
});

function Register() {
  const [type, setType] = useState<"client" | "company">("client");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Hasło musi mieć co najmniej 8 znaków.");
    if (!/^[+\d\s-]{9,}$/.test(phone)) return setError("Podaj poprawny numer telefonu.");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim(), phone: phone.trim(), account_type: type },
      },
    });
    setLoading(false);
    if (error) return setError(error.message.includes("registered") ? "Konto z tym e-mailem już istnieje." : "Nie udało się założyć konta. Spróbuj ponownie.");
    setDone(true);
  }

  if (done) {
    return (
      <AuthLayout title="Sprawdź skrzynkę" subtitle={`Wysłaliśmy link aktywacyjny na ${email}.`}>
        <p className="text-sm">Kliknij link w wiadomości, aby potwierdzić konto, a potem się zaloguj.</p>
        <Link to="/logowanie" className={`${btnCls} mt-6 block text-center`}>Przejdź do logowania</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Załóż konto" subtitle="Dołącz do CzystaLista w minutę.">
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        {([["client", "Szukam firmy"], ["company", "Jestem firmą"]] as const).map(([v, l]) => (
          <button key={v} type="button" onClick={() => setType(v)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${type === v ? "bg-card shadow-card" : "text-muted-foreground"}`}>
            {l}
          </button>
        ))}
      </div>
      <GoogleButton onError={setError} />
      <Divider />
      <form onSubmit={submit} className="space-y-3">
        <input required placeholder={type === "company" ? "Imię i nazwisko osoby kontaktowej" : "Imię i nazwisko"} value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
        <input type="tel" required placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
        <input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        <input type="password" required placeholder="Hasło (min. 8 znaków)" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button disabled={loading} className={btnCls}>{loading ? "Zakładanie konta…" : "Zarejestruj się"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Masz już konto? <Link to="/logowanie" className="font-medium text-primary hover:underline">Zaloguj się</Link>
      </p>
    </AuthLayout>
  );
}
