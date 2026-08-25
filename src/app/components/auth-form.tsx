"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useEffect } from "react";
import {
  ArrowRight,
  LockKeyhole,
  LoaderCircle,
  Mail,
  Ship,
  UserRound,
} from "lucide-react";
import { isAdminEmail } from "@/lib/admin";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";

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

  useEffect(() => {
    if (error) toast.error(error);
    if (notice) toast.info(notice);
  }, [error, notice]);

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
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (googleError) {
      setIsGoogleSubmitting(false);
      setError(googleError.message);
    }
  }

  return (
    <main className="auth-page min-h-screen px-4 py-6 text-[#182238] sm:px-8 sm:py-10">
      <div className="auth-card mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_70px_rgba(42,61,102,0.16)] lg:grid-cols-[0.92fr_1.08fr]">
        <section className="auth-welcome-panel flex flex-col items-center justify-center px-8 py-12 text-center text-white sm:px-14 lg:items-start lg:text-left">
          <Link href="/" className="auth-brand mb-auto flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-white/20"><Ship size={18} /></span>
            KivuPort
          </Link>
          <div className="my-auto max-w-sm py-12 lg:py-20">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-white/75">Port de Goma</p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{isSignup ? "Rejoignez-nous !" : "Bonjour, bienvenue !"}</h1>
            <p className="mt-4 text-sm leading-6 text-white/80">{isSignup ? "Créez votre compte et préparez vos prochaines traversées." : "Vous n'avez pas encore de compte ?"}</p>
            <Link href={isSignup ? "/login" : "/signup"} className="auth-outline-button mt-7 inline-flex min-w-36 items-center justify-center rounded-lg px-5 py-3 text-sm font-bold transition hover:bg-white hover:text-[#537bd1]">
              {isSignup ? "Se connecter" : "S'inscrire"}
            </Link>
          </div>
          <p className="mt-auto text-xs text-white/60">Votre voyage commence ici.</p>
        </section>

        <section className="flex items-center px-7 py-10 sm:px-14 sm:py-14">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#7894d7]">Espace client</p>
              <h2 className="text-3xl font-bold tracking-tight text-[#182238]">{isSignup ? "Créer un compte" : "Se connecter"}</h2>
              <p className="mt-2 text-sm text-[#8992a1]">{isSignup ? "Quelques secondes suffisent pour commencer." : "Accédez à votre espace KivuPort."}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && <label className="auth-field"><span>Nom complet</span><span className="auth-input-wrap"><UserRound size={17} /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Jean Mukendi" autoComplete="name" required /></span></label>}
              <label className="auth-field"><span>Adresse email</span><span className="auth-input-wrap"><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@exemple.com" autoComplete="email" required /></span></label>
              <label className="auth-field"><span>Mot de passe</span><span className="auth-input-wrap"><LockKeyhole size={17} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6 caractères minimum" autoComplete={isSignup ? "new-password" : "current-password"} required /></span></label>
              {!isSignup && <div className="text-right"><span className="text-xs font-semibold text-[#7894d7]">Mot de passe oublié ?</span></div>}
              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
              {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">{notice}</p>}
              <button type="submit" className="auth-submit flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3.5 font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : <>{isSignup ? "Créer mon compte" : "Se connecter"}<ArrowRight size={17} /></>}</button>
            </form>

            <div className="auth-divider auth-divider-page"><span>ou continuer avec</span></div>
            <button className="google-submit google-submit-page" type="button" onClick={handleGoogleAuth} disabled={isSubmitting || isGoogleSubmitting}><span className="google-mark">G</span>{isGoogleSubmitting ? "Redirection..." : "Google"}</button>
            <p className="mt-7 text-center text-sm text-[#8992a1]">{isSignup ? "Vous avez déjà un compte ?" : "Vous n'avez pas encore de compte ?"}{" "}<Link className="font-bold text-[#537bd1] hover:underline" href={isSignup ? "/login" : "/signup"}>{isSignup ? "Se connecter" : "S'inscrire"}</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}
