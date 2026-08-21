"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, LoaderCircle, LogIn, Mail, Ship, X } from "lucide-react";
import { supabase } from "@/lib/supabase-browser";

export function LoginModal({ onClose, onSignup }: { onClose: () => void; onSignup: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 6) return setError("Le mot de passe doit contenir au moins 6 caractères.");
    setIsSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setIsSubmitting(false);
    if (signInError) return setError(signInError.message);
    onClose();
    router.push("/dashboard");
  }

  async function handleGoogleLogin() {
    setError("");
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
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fermer"><X size={19} /></button>
        <div className="modal-brand"><span><Ship size={17} /></span> KivuPort <small>Goma</small></div>
        <p className="modal-kicker">Port de Goma</p>
        <h2 id="login-modal-title">Se connecter</h2>
        <p className="modal-subtitle">Accédez à votre espace.</p>
        <form onSubmit={handleSubmit} className="modal-form">
          <label><span className="modal-label"><Mail size={15} /> Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@exemple.com" autoComplete="email" required /></label>
          <label><span className="modal-label"><KeyRound size={15} /> Mot de passe</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6 caractères minimum" autoComplete="current-password" required /></label>
          {error && <p className="modal-error" role="alert">{error}</p>}
          <button className="modal-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : <><LogIn size={17} /> Ouvrir ma session <ArrowRight size={17} /></>}</button>
        </form>
        <div className="auth-divider"><span>ou</span></div>
        <button className="google-submit" type="button" onClick={handleGoogleLogin} disabled={isSubmitting || isGoogleSubmitting}><span className="google-mark">G</span>{isGoogleSubmitting ? "Redirection..." : "Continuer avec Google"}</button>
        <p className="modal-switch">Pas encore de compte ? <button type="button" onClick={onSignup}>S&apos;inscrire</button></p>
      </section>
    </div>
  );
}
