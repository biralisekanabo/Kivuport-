"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, LoaderCircle, Mail, Ship, UserPlus, UserRound, X } from "lucide-react";
import { isAdminEmail } from "@/lib/admin";
import { supabase } from "@/lib/supabase-browser";

export function SignupModal({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
  const router = useRouter();
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
    if (name.trim().length < 2) return setError("Veuillez saisir votre nom complet.");
    if (isAdminEmail(email)) return setError("Cette adresse est réservée à l'administration.");
    if (password.length < 6) return setError("Le mot de passe doit contenir au moins 6 caractères.");
    setIsSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() } } });
    setIsSubmitting(false);
    if (signUpError) return setError(signUpError.message);
    if (!data.session) return setNotice("Vérifiez votre adresse email pour activer votre compte.");
    onClose();
    router.push("/dashboard");
  }

  async function handleGoogleSignup() {
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
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="auth-modal signup-modal" role="dialog" aria-modal="true" aria-labelledby="signup-modal-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Fermer"><X size={19} /></button>
        <div className="modal-brand"><span><Ship size={17} /></span> KivuPort <small>Goma</small></div>
        <p className="modal-kicker">Port de Goma</p>
        <h2 id="signup-modal-title">Créer un compte</h2>
        <p className="modal-subtitle">Inscription rapide.</p>
        <form onSubmit={handleSubmit} className="modal-form">
          <label><span className="modal-label"><UserRound size={15} /> Nom complet</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Jean Mukendi" autoComplete="name" required /></label>
          <label><span className="modal-label"><Mail size={15} /> Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@exemple.com" autoComplete="email" required /></label>
          <label><span className="modal-label"><KeyRound size={15} /> Mot de passe</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6 caractères minimum" autoComplete="new-password" required /></label>
          {error && <p className="modal-error" role="alert">{error}</p>}
          {notice && <p className="modal-notice" role="status">{notice}</p>}
          <button className="modal-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : <><UserPlus size={17} /> Créer mon compte <ArrowRight size={17} /></>}</button>
        </form>
        <div className="auth-divider"><span>ou</span></div>
        <button className="google-submit" type="button" onClick={handleGoogleSignup} disabled={isSubmitting || isGoogleSubmitting}><span className="google-mark">G</span>{isGoogleSubmitting ? "Redirection..." : "Créer un compte avec Google"}</button>
        <p className="modal-switch">Déjà inscrit ? <button type="button" onClick={onLogin}>Se connecter</button></p>
      </section>
    </div>
  );
}
