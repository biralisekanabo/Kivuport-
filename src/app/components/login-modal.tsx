"use client";

import { ChangeEvent, FormEvent, useState, useEffect } from "react";
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
} from "lucide-react";

const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

type LoginModalProps = {
  onClose: () => void;
  onSignup: () => void;
};

export function LoginModal({ onClose, onSignup }: LoginModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({ email: "", password: "" });

  const [status, setStatus] = useState<{
    type: "error" | "success" | null;
    message: string;
  }>({ type: null, message: "" });

  // Fermer avec Échap et bloquer le scroll
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

  const handleGoogleLogin = () => {
    window.location.href = "https://accounts.google.com/o/oauth2/v2/auth";
  };

  const handleGithubLogin = () => {
    window.location.href = "https://github.com/login/oauth/authorize";
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const response = await fetch("https://blessing.alwaysdata.net/api/auth.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ type: "success", message: data.message });
        const userToStore = data.user;

        // Nettoyage du localStorage avant stockage
        localStorage.removeItem("user");
        localStorage.removeItem("djephy_user");
        localStorage.setItem("user", JSON.stringify(userToStore));
        localStorage.setItem("djephy_user", JSON.stringify(userToStore));
        window.dispatchEvent(new Event("auth:login"));

        setTimeout(() => {
          window.location.href =
            userToStore.role === "admin" ? "/admin" : "/dashboard";
        }, 1500);
      } else {
        setStatus({ type: "error", message: data.message });
      }
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      setStatus({ type: "error", message: "Le service d'authentification est indisponible." });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClassName =
    "w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200 text-slate-700 placeholder:text-slate-400";

  return (
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

          {/* Séparateur Social */}
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
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                aria-label="Se connecter avec Google"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-[11px] font-bold text-slate-600">Google</span>
              </motion.button>

              <motion.button
                layout
                type="button"
                whileHover={{ y: -2 }}
                onClick={handleGithubLogin}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-black transition-all text-white shadow-sm"
                aria-label="Se connecter avec GitHub"
              >
                <GithubIcon />
                <span className="text-[11px] font-bold">GitHub</span>
              </motion.button>
            </div>
          </div>

          {/* Lien pour basculer vers l'inscription */}
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
  );
}