import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { lovable } from "@/integrations/lovable/index";

export const inputCls = "w-full rounded-xl bg-muted px-4 py-3 outline-none focus:ring-2 focus:ring-ring";
export const btnCls = "w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-hero">
      <nav className="mx-auto max-w-6xl px-6 py-5">
        <Link to="/" className="font-display text-2xl font-bold text-primary">CzystaLista</Link>
      </nav>
      <div className="mx-auto max-w-md px-4 pb-16 pt-6">
        <div className="rounded-2xl bg-card p-8 shadow-card">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function GoogleButton({ onError }: { onError: (m: string) => void }) {
  return (
    <button
      type="button"
      onClick={async () => {
        const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
        if (r.error) onError("Nie udało się zalogować przez Google.");
        else if (!r.redirected) window.location.assign("/");
      }}
      className="flex w-full items-center justify-center gap-2 rounded-xl border bg-card px-4 py-3 font-medium hover:bg-muted"
    >
      <span className="font-bold text-primary">G</span> Kontynuuj z Google
    </button>
  );
}

export function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
      <div className="h-px flex-1 bg-border" /> lub <div className="h-px flex-1 bg-border" />
    </div>
  );
}
