import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout, btnCls, inputCls } from "@/components/AuthLayout";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nowe hasło — CzystaLista" },
      { name: "description", content: "Ustaw nowe hasło do konta CzystaLista." },
      { property: "og:title", content: "Nowe hasło — CzystaLista" },
      { property: "og:description", content: "Ustaw nowe hasło do konta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Hasło musi mieć co najmniej 8 znaków.");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setError("Link wygasł lub jest nieprawidłowy. Poproś o nowy.");
    navigate({ to: "/" });
  }

  return (
    <AuthLayout title="Ustaw nowe hasło" subtitle="Wpisz nowe hasło do swojego konta.">
      <form onSubmit={submit} className="space-y-3">
        <input type="password" required placeholder="Nowe hasło" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button className={btnCls}>Zapisz hasło</button>
      </form>
    </AuthLayout>
  );
}
