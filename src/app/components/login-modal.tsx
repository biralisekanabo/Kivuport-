"use client";

import { ChangeEvent, FormEvent, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  X,
  Shield,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  RotateCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase-browser";

type LoginModalProps = {
  onClose: () => void;
  onSignup: () => void;
};

export function LoginModal({ onClose, onSignup }: LoginModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  const [formData, setFormData] = useState({ email: "", password: "" });

  const [status, setStatus] = useState<{
    type: "error" | "success" | null;
    message: string;
  }>({ type: null, message: "" });

  // ===== MODAL "MOT DE PASSE OUBLIÉ" — FLOW OTP =====
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "password" | "success">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpResendSeconds, setOtpResendSeconds] = useState(0);
  const [forgotState, setForgotState] = useState<"idle" | "loading" | "sent">("idle");
  const [forgotError, setForgotError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  // ===== Handlers mot de passe oublié =====
  function openForgot() {
    setForgotEmail(formData.email.trim());
    setForgotError("");
    setForgotState("idle");
    setForgotStep("email");
    setOtpDigits(["", "", "", "", "", ""]);
    setNewPassword("");
    setNewPasswordConfirm("");
    setShowForgot(true);
  }

  function closeForgot() {
    setShowForgot(false);
    setOtpResendSeconds(0);
  }

  function handleForgotBack() {
    if (forgotStep === "otp") {
      setForgotStep("email");
      setForgotError("");
      setOtpDigits(["", "", "", "", "", ""]);
    } else if (forgotStep === "password") {
      setForgotStep("otp");
      setForgotError("");
      setNewPassword("");
      setNewPasswordConfirm("");
    }
  }

  useEffect(() => {
    if (!showForgot) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeForgot();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showForgot]);

  useEffect(() => {
    if (otpResendSeconds <= 0) return;
    const timer = setTimeout(() => setOtpResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpResendSeconds]);

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }, [otpDigits]);

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newDigits = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtpDigits(newDigits);
    const nextEmpty = newDigits.findIndex((d) => !d);
    otpRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  }, []);

  async function handleForgotSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setForgotError("");

    const mail = forgotEmail.trim();
    if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setForgotError("Veuillez saisir une adresse email valide.");
      return;
    }

    setForgotState("loading");
    let response: Response;
    try {
      response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mail }),
      });
    } catch {
      setForgotState("idle");
      setForgotError("Impossible de contacter le serveur. Réessayez dans un instant.");
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setForgotState("idle");
      setForgotError(data.error || "Une erreur est survenue. Réessayez.");
      return;
    }

    setForgotState("idle");
    setForgotStep("otp");
    setOtpResendSeconds(60);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }

  async function handleVerifyOtp() {
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setForgotError("Veuillez saisir les 6 chiffres du code.");
      return;
    }

    setForgotError("");
    setForgotState("loading");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), code }),
      });

      const data = await response.json();

      if (!response.ok) {
        setForgotState("idle");
        setForgotError(data.error || "Code invalide.");
        return;
      }

      setForgotState("idle");
      setForgotStep("password");
      setTimeout(() => {
        const fields = document.querySelectorAll('input[type="password"]');
        if (fields[0]) (fields[0] as HTMLInputElement).focus();
      }, 100);
    } catch {
      setForgotState("idle");
      setForgotError("Erreur de connexion. Réessayez.");
    }
  }

  async function handleResendOtp() {
    if (otpResendSeconds > 0) return;

    setForgotError("");
    setForgotState("loading");
    setOtpDigits(["", "", "", "", "", ""]);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setForgotState("idle");
        setForgotError(data.error || "Erreur lors du renvoi.");
        return;
      }

      setForgotState("idle");
      setOtpResendSeconds(60);
      otpRefs.current[0]?.focus();
    } catch {
      setForgotState("idle");
      setForgotError("Impossible de contacter le serveur.");
    }
  }

  async function handleUpdatePassword() {
    setForgotError("");

    if (newPassword.length < 6) {
      setForgotError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setForgotError("Les mots de passe ne correspondent pas.");
      return;
    }

    setForgotState("loading");

    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          code: otpDigits.join(""),
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setForgotState("idle");
        setForgotError(data.error || "Erreur lors de la mise à jour.");
        return;
      }

      setForgotState("idle");
      setForgotStep("success");
      setTimeout(() => {
        onClose();
        window.location.href = "/login";
      }, 2000);
    } catch {
      setForgotState("idle");
      setForgotError("Erreur de connexion. Réessayez.");
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    setStatus({ type: null, message: "" });

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) {
      setIsGoogleLoading(false);
      setStatus({ type: "error", message: error.message });
    }
  }

  async function handleGithubLogin() {
    setIsGithubLoading(true);
    setStatus({ type: null, message: "" });

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setIsGithubLoading(false);
      setStatus({ type: "error", message: error.message });
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      setStatus({ type: "error", message: "Le mot de passe doit contenir au moins 6 caractères." });
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (error) {
        setStatus({ type: "error", message: error.message });
        return;
      }

      setStatus({ type: "success", message: "Connexion réussie !" });

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      setStatus({ type: "error", message: "Une erreur est survenue. Réessayez." });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClassName =
    "w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200 text-slate-700 placeholder:text-slate-400";

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm"
        role="presentation"
        onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      >
        <div className="w-full max-w-[360px] mx-auto">
          <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative bg-white p-6 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden"
          >
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center"
                >
                  <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                  <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest">
                    Traitement...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={onClose}
              className="absolute right-5 top-5 text-slate-300 hover:text-slate-500 transition-colors z-10"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center mb-5">
              <motion.div
                layout
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 mb-2"
              >
                <Shield className="text-white" size={20} />
              </motion.div>
              <motion.h2
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold text-slate-800 tracking-tight"
              >
                Connexion
              </motion.h2>
            </div>

            <AnimatePresence mode="wait">
              {status.message && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`mb-4 p-2.5 rounded-xl text-[11px] text-center font-bold flex items-center justify-center gap-2 ${
                    status.type === "success"
                      ? "bg-green-50 text-green-600 border border-green-100"
                      : "bg-red-50 text-red-600 border border-red-100"
                  }`}
                >
                  {status.type === "success" && <CheckCircle2 size={14} />}
                  {status.message}
                </motion.div>
              )}
            </AnimatePresence>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <motion.div layout className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClassName}
                  aria-label="Email"
                />
              </motion.div>

              <motion.div layout className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Mot de passe"
                  value={formData.password}
                  onChange={handleChange}
                  className={`${inputClassName} pr-10`}
                  aria-label="Mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </motion.div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={openForgot}
                  className="text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <motion.button
                layout
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 mt-2"
                aria-label="Se connecter"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    Se connecter
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-5">
              <div className="relative flex items-center justify-center mb-4">
                <div className="w-full border-t border-slate-100"></div>
                <span className="absolute px-3 bg-white text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  Connexion sociale
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  layout
                  type="button"
                  whileHover={{ y: -2 }}
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-60"
                  aria-label="Se connecter avec Google"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  <span className="text-[11px] font-bold text-slate-600">Google</span>
                </motion.button>

                <motion.button
                  layout
                  type="button"
                  whileHover={{ y: -2 }}
                  onClick={handleGithubLogin}
                  disabled={isGithubLoading}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-black transition-all text-white shadow-sm disabled:opacity-60"
                  aria-label="Se connecter avec GitHub"
                >
                  {isGithubLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  )}
                  <span className="text-[11px] font-bold">GitHub</span>
                </motion.button>
              </div>
            </div>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={onSignup}
                className="text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors"
                aria-label="Créer un compte"
              >
                Créer un compte
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== MODAL MOT DE PASSE OUBLIÉ — FLOW OTP ===== */}
      <AnimatePresence>
        {showForgot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeForgot();
            }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-[430px] rounded-[2rem] border-[3px] border-[#7bd7f8] bg-[#eaf0f2] p-4 shadow-[0_24px_70px_rgba(42,61,102,0.25)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="forgot-title"
            >
              <button
                type="button"
                onClick={closeForgot}
                aria-label="Fermer"
                className="absolute right-5 top-5 text-slate-300 hover:text-slate-500 transition-colors z-10"
              >
                <X size={20} />
              </button>

              {/* ===== ÉTAPE 1 : SAISIE EMAIL ===== */}
              {forgotStep === "email" && (
                <motion.div
                  key="step-email"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                      <KeyRound className="text-blue-600" size={22} />
                    </div>
                    <h3 id="forgot-title" className="text-lg font-bold text-slate-800">
                      Mot de passe oublié
                    </h3>
                    <p className="mt-1.5 text-[12px] text-slate-400 text-center leading-relaxed">
                      Entrez votre email. Nous vous enverrons un{" "}
                      <strong className="text-slate-600">code à 6 chiffres</strong>.
                    </p>
                  </div>

                  <form onSubmit={handleForgotSubmit} className="space-y-3">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(event) => setForgotEmail(event.target.value)}
                        placeholder="vous@exemple.com"
                        autoComplete="email"
                        autoFocus
                        required
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200 text-slate-700 placeholder:text-slate-400"
                      />
                    </div>

                    {forgotError && (
                      <p className="rounded-xl bg-red-50 p-2.5 text-[11px] text-center font-bold text-red-600 border border-red-100" role="alert">
                        {forgotError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={forgotState === "loading"}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
                    >
                      {forgotState === "loading" ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <>
                          Envoyer le code
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={closeForgot}
                    className="mt-3 w-full rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft size={12} />
                    Retour à la connexion
                  </button>
                </motion.div>
              )}

              {/* ===== ÉTAPE 2 : SAISIE CODE OTP ===== */}
              {forgotStep === "otp" && (
                <motion.div
                  key="step-otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="rounded-[1.5rem] border-[3px] border-[#7bd7f8] bg-[#edf1f3] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.38),0_14px_24px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:p-5"
                >
                  <div className="flex flex-col items-center">
                    <div className="mb-3 grid size-12 place-items-center rounded-full border border-[#dfeaf1] bg-[#eef4f7] shadow-[inset_0_2px_7px_rgba(255,255,255,0.8),0_10px_18px_rgba(15,23,42,0.08)] sm:mb-5 sm:size-16">
                      <ShieldCheck className="text-[#1d4d5f]" size={22} />
                    </div>
                    <h3 id="forgot-title" className="text-center text-[2rem] font-black leading-[0.9] tracking-[-0.08em] text-slate-700 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] sm:text-[2.5rem]">
                      Verify Your OTP
                    </h3>
                    <p className="mt-3 text-[1rem] text-slate-500 text-center sm:mt-5 sm:text-[1.05rem]">
                      We&apos;ve sent a 6-digit verification code to
                    </p>
                    <p className="mt-1 text-[1rem] font-semibold tracking-[0.1em] text-slate-700 sm:text-[1.05rem]">
                      +91 XXXXX 00945
                    </p>
                  </div>

                  <div className="mt-4 flex justify-center gap-1.5 sm:mt-6 sm:gap-2.5">
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={handleOtpPaste}
                        className="h-11 w-11 rounded-[1rem] border-2 border-[#dfe6ec] bg-[#edf2f5] text-center text-xl font-bold text-slate-700 shadow-[inset_0_3px_5px_rgba(15,23,42,0.04)] outline-none transition-all duration-200 focus:border-[#5ecaf6] focus:bg-white focus:shadow-[0_0_0_3px_rgba(94,202,246,0.18)] sm:h-14 sm:w-14 sm:rounded-[1.2rem] sm:text-2xl"
                        aria-label={`Chiffre ${i + 1}`}
                      />
                    ))}
                  </div>

                  {forgotError && (
                    <p className="mt-5 rounded-xl bg-red-50 p-2.5 text-[11px] text-center font-bold text-red-600 border border-red-100" role="alert">
                      {forgotError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpDigits.join("").length !== 6 || forgotState === "loading"}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-[1.1rem] border border-[#dfeaf0] bg-[#edf4f5] px-5 py-3.5 text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#01b2ea] shadow-[inset_0_2px_5px_rgba(255,255,255,0.8)] transition-all hover:bg-[#e6f3f5] disabled:opacity-70"
                  >
                    {forgotState === "loading" ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        <ShieldCheck size={17} />
                        Verify OTP
                      </>
                    )}
                  </button>

                  <div className="mt-5 text-center">
                    {otpResendSeconds > 0 ? (
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                        Resend OTP in{" "}
                        <span className="font-bold text-slate-600">{otpResendSeconds}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={forgotState === "loading"}
                        className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0ea5e9] transition-colors hover:text-[#0284c7]"
                      >
                        <RotateCw size={12} />
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleForgotBack}
                    className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white/40 px-5 py-2.5 text-xs font-semibold text-slate-500 transition hover:bg-white/70 hover:text-slate-700"
                  >
                    <ArrowLeft size={12} />
                    Change email
                  </button>
                </motion.div>
              )}

              {/* ===== ÉTAPE 3 : NOUVEAU MOT DE PASSE ===== */}
              {forgotStep === "password" && (
                <motion.div
                  key="step-password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-3">
                      <CheckCircle2 className="text-green-600" size={22} />
                    </div>
                    <h3 id="forgot-title" className="text-lg font-bold text-slate-800">
                      Nouveau mot de passe
                    </h3>
                    <p className="mt-1.5 text-[12px] text-slate-400 text-center leading-relaxed">
                      Choisissez un nouveau mot de passe pour votre compte.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nouveau mot de passe (6 car. min.)"
                        autoComplete="new-password"
                        autoFocus
                        required
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-10 text-sm outline-none transition-all duration-200 text-slate-700 placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                        aria-label={showPassword ? "Masquer" : "Afficher"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                        placeholder="Confirmer le mot de passe"
                        autoComplete="new-password"
                        required
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200 text-slate-700 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {forgotError && (
                    <p className="mt-3 rounded-xl bg-red-50 p-2.5 text-[11px] text-center font-bold text-red-600 border border-red-100" role="alert">
                      {forgotError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleUpdatePassword}
                    disabled={!newPassword || !newPasswordConfirm || forgotState === "loading"}
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
                  >
                    {forgotState === "loading" ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        Mettre à jour
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleForgotBack}
                    className="mt-3 w-full rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft size={12} />
                    Retour
                  </button>
                </motion.div>
              )}

              {/* ===== ÉTAPE 4 : SUCCÈS ===== */}
              {forgotStep === "success" && (
                <motion.div
                  key="step-success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-[2rem] border-[3px] border-[#7bd7f8] bg-[#edf1f3] p-6 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.38),0_14px_24px_rgba(15,23,42,0.06)]"
                >
                  <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full border border-[#d7ebda] bg-[#effaf0] text-[#38c98f] shadow-[inset_0_2px_7px_rgba(255,255,255,0.8),0_10px_18px_rgba(15,23,42,0.08)]">
                    <CheckCircle2 size={38} />
                  </div>
                  <h3 id="forgot-title" className="text-center text-[2rem] font-black leading-[0.95] tracking-[-0.08em] text-[#2f9f8f] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] sm:text-[2.3rem]">
                    Verification Successful
                  </h3>
                  <p className="mt-6 text-[1.05rem] text-slate-500 leading-relaxed">
                    Your OTP has been verified successfully.
                    <br />
                    Your account is now secure.
                  </p>
                  <button
                    type="button"
                    onClick={closeForgot}
                    className="mt-8 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    Close
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
