"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, LoaderCircle, Ship } from "lucide-react";
import { isAdminEmail } from "@/lib/admin";
import { supabase } from "@/lib/supabase-browser";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (isSignup && name.trim().length < 2) {
      setError("Veuillez saisir votre nom complet.");
      return;
    }

    if (isSignup && isAdminEmail(email)) {
      setError("Cette adresse est réservée à l'administration.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setIsSubmitting(true);
    const result = isSignup
      ? await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() } },
        })
      : await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (isSignup && !result.data.session) {
      setNotice("Vérifiez votre adresse email pour activer votre compte.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleAuth() {
    setError("");
    setNotice("");
    setIsGoogleSubmitting(true);
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard`, queryParams: { prompt: "select_account" } },
    });
    if (googleError) {
      setIsGoogleSubmitting(false);
      setError(googleError.message);
    }
  }

  return (
    <main className={`auth-page${isSignup ? " signup-auth-page" : ""} min-h-screen bg-[#f4f7f5] px-6 py-10 text-[#17352e] sm:px-10`}>
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-4xl bg-[#17352e] shadow-2xl shadow-[#17352e]/15 lg:grid-cols-[1fr_0.9fr]">
        <section className="flex flex-col justify-between p-8 text-[#f4f7f5] sm:p-14">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight">
            <span className="grid size-10 place-items-center rounded-xl bg-[#d8e65b] text-[#17352e]"><Ship size={20} /></span>
            KivuPort
          </Link>
          <div className="max-w-md py-16">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-[#d8e65b]">Port de Goma</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">{isSignup ? "Créer votre accès." : "Bienvenue à bord."}</h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-[#b7cbc2]">Réservations et opérations du port de Goma.</p>
          </div>
          <p className="text-sm text-[#b7cbc2]">Espace sécurisé.</p>
        </section>

        <section className="flex items-center bg-white p-8 sm:p-14">
          <div className="w-full max-w-md">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#658077]">Port de Goma</p>
            <h2 className="text-3xl font-semibold tracking-tight text-[#17352e]">{isSignup ? "Créer un compte" : "Se connecter"}</h2>
            <p className="mt-3 text-sm leading-6 text-[#658077]">{isSignup ? "Inscription rapide." : "Accédez à votre espace."}</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {isSignup && <label className="block text-sm font-medium text-[#17352e]">Nom complet<input className="mt-2 block w-full rounded-xl border border-[#d6e1dc] px-4 py-3 outline-none transition focus:border-[#17352e] focus:ring-4 focus:ring-[#d8e65b]/30" value={name} onChange={(event) => setName(event.target.value)} placeholder="Jean Mukendi" autoComplete="name" required /></label>}
              <label className="block text-sm font-medium text-[#17352e]">Adresse email<input className="mt-2 block w-full rounded-xl border border-[#d6e1dc] px-4 py-3 outline-none transition focus:border-[#17352e] focus:ring-4 focus:ring-[#d8e65b]/30" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@exemple.com" autoComplete="email" required /></label>
              <label className="block text-sm font-medium text-[#17352e]">Mot de passe<input className="mt-2 block w-full rounded-xl border border-[#d6e1dc] px-4 py-3 outline-none transition focus:border-[#17352e] focus:ring-4 focus:ring-[#d8e65b]/30" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6 caractères minimum" autoComplete={isSignup ? "new-password" : "current-password"} required /></label>
              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
              {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">{notice}</p>}
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#17352e] px-5 py-3.5 font-semibold text-white transition hover:bg-[#285448] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : <>{isSignup ? "Créer mon compte" : "Ouvrir ma session"}<ArrowRight size={18} /></>}</button>
            </form>
            <><div className="auth-divider auth-divider-page"><span>ou</span></div><button className="google-submit google-submit-page" type="button" onClick={handleGoogleAuth} disabled={isSubmitting || isGoogleSubmitting}><span className="google-mark">G</span>{isGoogleSubmitting ? "Redirection..." : isSignup ? "Créer un compte avec Google" : "Continuer avec Google"}</button></>

            <p className="mt-8 text-center text-sm text-[#658077]">{isSignup ? "Vous avez déjà un compte ?" : "Vous n'avez pas encore de compte ?"}{" "}<Link className="font-semibold text-[#17352e] underline underline-offset-4" href={isSignup ? "/login" : "/signup"}>{isSignup ? "Se connecter" : "S'inscrire"}</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}
