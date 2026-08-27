import { FormEvent, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LogIn,
  Mail,
  Ship,
  UserPlus,
  X,
  ShieldCheck,
  Fingerprint,
  Bell,
  Sparkles,
  ChevronLeft,
  Lock,
  Zap,
  Shield,
  UserCheck,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";

type LoginModalProps = {
  onClose: () => void;
  onSignup: () => void;
};

// ===== ICÔNES SOCIALES =====
const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const GithubIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path className="text-zinc-900 dark:text-zinc-100" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const AppleIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path className="text-zinc-900 dark:text-zinc-100" d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

// ===== COMPOSANT BOUTON SOCIAL =====
function SocialButton({ 
  provider, 
  isLoading, 
  onClick, 
  icon, 
  label 
}: { 
  provider: string; 
  isLoading: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string; 
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.96 }}
      className="h-11 flex flex-col items-center justify-center gap-0.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-blue-50/50 dark:hover:bg-zinc-800/80 hover:border-blue-300 dark:hover:border-blue-800 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm group"
      aria-label={`Se connecter avec ${label}`}
    >
      {isLoading ? (
        <LoaderCircle size={16} className="animate-spin text-blue-600" />
      ) : (
        <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.3 }}>
          {icon}
        </motion.div>
      )}
      <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {label}
      </span>
    </motion.button>
  );
}

// ===== COMPOSANT CHAMP DE SAISIE =====
function InputGroup({ icon, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative group ${className}`}
    >
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors duration-200">
        {icon}
      </div>
      <input
        {...props}
        className="w-full h-12 pl-11 pr-4 bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 dark:focus:border-blue-500 transition-all duration-200 shadow-sm hover:border-blue-300 dark:hover:border-blue-900"
      />
    </motion.div>
  );
}

// ===== MODAL PRINCIPAL =====
export function LoginModal({ onClose, onSignup }: LoginModalProps) {
  const router = useRouter();
  
  // ===== ÉTATS =====
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isGithubSubmitting, setIsGithubSubmitting] = useState(false);
  const [isAppleSubmitting, setIsAppleSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [isResetMode, setIsResetMode] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [step, setStep] = useState<"idle" | "checking" | "connecting" | "redirecting">("idle");
  const emailInputRef = useRef<HTMLInputElement>(null);

  // ===== DÉTECTION MOBILE =====
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ===== ANIMATION D'ENTRÉE =====
  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      emailInputRef.current?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // ===== EMAIL SAUVEGARDÉ =====
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // ===== LOCKOUT TIMER =====
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // ===== TOASTS =====
  useEffect(() => {
    if (error) toast.error(error);
    if (successMessage) toast.success(successMessage);
  }, [error, successMessage]);

  // ===== KEYBOARD SHORTCUTS =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter ou Cmd+Enter pour soumettre
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        const form = document.querySelector("form");
        if (form) form.dispatchEvent(new Event("submit", { bubbles: true }));
      }
      // Escape pour fermer
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // ===== FONCTIONS =====
  function clearMessages() {
    setError("");
    setSuccessMessage("");
  }

  function switchToReset() {
    clearMessages();
    setIsResetMode(true);
    setPassword("");
  }

  function switchToLogin() {
    clearMessages();
    setIsResetMode(false);
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isEmailValid = emailTouched && email && isValidEmail(email);
  const isEmailInvalid = emailTouched && email && !isValidEmail(email);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-gray-200" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score, label: "Faible", color: "bg-red-500" };
    if (score <= 3) return { score, label: "Moyen", color: "bg-amber-500" };
    if (score <= 4) return { score, label: "Bon", color: "bg-blue-500" };
    return { score, label: "Sécurisé", color: "bg-emerald-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  // ===== MESSAGES D'ERREUR PRÉCIS =====
  const errorMessages: Record<string, string> = {
    "Invalid login credentials": "Email ou mot de passe incorrect",
    "Email not confirmed": "Veuillez confirmer votre email avant de vous connecter",
    "Too many requests": "Trop de tentatives, veuillez patienter",
    "User not found": "Aucun compte associé à cet email",
    "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères",
  };

  const getFriendlyErrorMessage = (errorMessage: string): string => {
    return errorMessages[errorMessage] || errorMessage;
  };

  const handleFillDemo = () => {
    setEmail("demo@kivuport.com");
    setPassword("password123");
    setEmailTouched(true);
    setPasswordTouched(true);
    toast.info("🔑 Identifiants de démonstration injectés !");
  };

  // ===== SUBMIT =====
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (lockoutTimer > 0) {
      setError(`Trop de tentatives échouées. Veuillez patienter ${lockoutTimer}s.`);
      return;
    }

    if (!email.trim()) {
      setError("Veuillez entrer votre adresse email.");
      setEmailTouched(true);
      return;
    }

    if (!isValidEmail(email.trim())) {
      setError("Veuillez entrer une adresse email valide.");
      setEmailTouched(true);
      return;
    }

    if (isResetMode) {
      setIsSubmitting(true);
      setStep("checking");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );
      setIsSubmitting(false);
      setStep("idle");

      if (resetError) {
        setError(getFriendlyErrorMessage(resetError.message));
        return;
      }

      setSuccessMessage("📧 Un email de réinitialisation a été envoyé.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setPasswordTouched(true);
      return;
    }

    setIsSubmitting(true);
    setStep("checking");
    
    setTimeout(() => setStep("connecting"), 500);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    
    setIsSubmitting(false);
    setStep("idle");

    if (signInError) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      if (newAttempts >= 3) {
        setLockoutTimer(30);
        setLoginAttempts(0);
        setError("🔒 Trop d'échecs consécutifs. Compte temporairement verrouillé (30s).");
      } else {
        setError(getFriendlyErrorMessage(signInError.message));
      }
      return;
    }

    setLoginAttempts(0);

    if (rememberMe) {
      localStorage.setItem("rememberEmail", email.trim());
    } else {
      localStorage.removeItem("rememberEmail");
    }

    setStep("redirecting");
    toast.success("✅ Connexion réussie ! Redirection...");
    
    setTimeout(() => {
      onClose();
      router.push("/dashboard");
      router.refresh();
    }, 500);
  }

  // ===== SOCIAL LOGIN =====
  async function handleOAuth(provider: "google" | "github" | "apple") {
    clearMessages();
    
    if (provider === "google") setIsGoogleSubmitting(true);
    if (provider === "github") setIsGithubSubmitting(true);
    if (provider === "apple") setIsAppleSubmitting(true);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
      },
    });

    if (provider === "google") setIsGoogleSubmitting(false);
    if (provider === "github") setIsGithubSubmitting(false);
    if (provider === "apple") setIsAppleSubmitting(false);

    if (oauthError) {
      setError(getFriendlyErrorMessage(oauthError.message));
    }
  }

  // ===== ANIMATIONS =====
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      y: isMobile ? 20 : 20,
      scale: isMobile ? 0.95 : 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      y: isMobile ? 20 : 20,
      scale: isMobile ? 0.95 : 0.95,
    },
  };

  const backgroundImage = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=800&fit=crop";

  // ===== RENDU =====
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            isMobile ? "p-0" : "p-2 md:p-3"
          }`}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && onClose()
          }
        >
          {isMobile ? (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          )}

          <motion.section
            className={`relative bg-white shadow-2xl flex flex-col overflow-hidden border border-white/20 ${
              isMobile
                ? "w-[92%] max-h-[88vh] rounded-2xl"
                : "max-w-md md:max-w-2xl max-h-[98vh] md:max-h-[95vh] rounded-2xl md:rounded-3xl"
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.4,
            }}
          >
            {/* ===== BOUTON FERMETURE ===== */}
            <motion.button
              className={`absolute z-30 p-1.5 md:p-2 text-gray-400 hover:text-gray-800 bg-white/95 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 backdrop-blur-sm border border-gray-100 ${
                isMobile ? "top-2 right-2" : "top-2 right-2 md:top-3 md:right-3"
              }`}
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              whileHover={{ rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={isMobile ? 16 : 18} />
            </motion.button>

            {/* ===== BADGE SÉCURITÉ AMÉLIORÉ ===== */}
            <motion.div
              className={`absolute z-30 flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 bg-blue-50 border border-blue-200 rounded-full ${
                isMobile ? "top-2 left-2" : "top-2 left-2 md:top-3 md:left-3"
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ShieldCheck size={isMobile ? 10 : 12} className="text-blue-600" />
              <span className="text-[8px] md:text-[10px] font-medium text-blue-700 whitespace-nowrap">
                {isMobile ? "Sécurisé" : "Connexion sécurisée"}
              </span>
            </motion.div>

            <div className="flex flex-col md:flex-row h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              
              {/* ===== PANEL GAUCHE - BIENVENUE ===== */}
              <motion.div
                className={`bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex flex-col justify-between items-center text-center md:items-start md:text-left shrink-0 relative overflow-hidden ${
                  isMobile 
                    ? "p-3 w-full" 
                    : "p-6 md:p-8 md:w-5/12"
                }`}
                initial={{ opacity: 0, x: isMobile ? 0 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* Effets de lumière */}
                <motion.div
                  className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />

                <div className="relative z-10 w-full">
                  <motion.div
                    className={`flex items-center justify-center md:justify-start gap-2 font-bold ${
                      isMobile ? "text-sm" : "text-base sm:text-lg"
                    }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <span className={`${
                      isMobile ? "p-1.5" : "p-2"
                    } bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/30`}>
                      <Ship size={isMobile ? 14 : 20} />
                    </span>
                    <span className="text-white">KivuPort</span>
                    <span className={`font-normal text-blue-300 bg-white/10 px-1.5 py-0.5 rounded-full ${
                      isMobile ? "text-[8px]" : "text-xs"
                    }`}>
                      Goma
                    </span>
                  </motion.div>

                  <motion.div
                    className={isMobile ? "my-1.5" : "my-6 md:my-8"}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.h3
                      className={`font-bold mb-1 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent ${
                        isMobile ? "text-sm" : "text-xl sm:text-3xl"
                      }`}
                      key={isResetMode ? "reset" : "login"}
                    >
                      {isResetMode ? "Réinitialisation 🔑" : "Bienvenue ! ⚓"}
                    </motion.h3>
                    <p className={`text-blue-200 leading-relaxed ${
                      isMobile ? "text-[10px]" : "text-sm sm:text-base"
                    }`}>
                      {isResetMode
                        ? "Recevez un lien sécurisé pour retrouver votre compte."
                        : "Connectez-vous et gérez vos opérations portuaires."}
                    </p>
                    
                    {!isResetMode && (
                      <div className="flex flex-wrap items-center gap-2">
                        <motion.button
                          type="button"
                          onClick={onSignup}
                          className={`inline-flex items-center gap-1.5 font-semibold text-white rounded-xl transition-all border border-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl group ${
                            isMobile 
                              ? "mt-2 px-2.5 py-1 text-[10px]" 
                              : "mt-5 px-5 py-2.5 text-sm sm:text-base"
                          } bg-white/10 hover:bg-white/20`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <UserPlus size={isMobile ? 12 : 16} className="group-hover:rotate-12 transition-transform" />
                          S&apos;inscrire
                          <ArrowRight size={isMobile ? 10 : 14} className="group-hover:translate-x-1 transition-transform" />
                        </motion.button>

                        <motion.button
                          type="button"
                          onClick={handleFillDemo}
                          className={`inline-flex items-center gap-1 font-medium text-blue-300 rounded-xl transition-all border border-blue-400/30 backdrop-blur-sm ${
                            isMobile ? "mt-2 px-2 py-1 text-[9px]" : "mt-5 px-3 py-2.5 text-xs"
                          } bg-blue-500/10 hover:bg-blue-500/20`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Remplir avec un compte de test"
                        >
                          <Zap size={isMobile ? 10 : 12} className="text-yellow-400" />
                          Mode Démo
                        </motion.button>
                      </div>
                    )}
                  </motion.div>

                  {/* Badges de sécurité améliorés */}
                  <div className="flex flex-wrap items-center gap-2">
                    <motion.div
                      className={`flex items-center justify-center md:justify-start gap-1.5 text-blue-300 bg-white/5 px-2 py-1 rounded-full backdrop-blur-sm ${
                        isMobile ? "text-[8px]" : "text-xs"
                      }`}
                    >
                      <Fingerprint size={isMobile ? 8 : 12} />
                      Chiffrement SSL
                    </motion.div>
                    <motion.div
                      className={`flex items-center justify-center md:justify-start gap-1.5 text-blue-300 bg-white/5 px-2 py-1 rounded-full backdrop-blur-sm ${
                        isMobile ? "text-[8px]" : "text-xs"
                      }`}
                    >
                      <Shield size={isMobile ? 8 : 12} />
                      2FA disponible
                    </motion.div>
                  </div>
                </div>

                <div className={`text-blue-400 ${isMobile ? "text-[8px] mt-1.5" : "text-xs mt-4"}`}>
                  © {new Date().getFullYear()} KivuPort. Tous droits réservés.
                </div>
              </motion.div>

              {/* ===== PANEL DROIT - FORMULAIRE ===== */}
              <motion.div
                className={`flex-1 bg-white ${
                  isMobile ? "p-3" : "p-4 sm:p-5 md:p-8"
                }`}
                initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: isMobile ? 0.1 : 0.2 }}
              >
                <motion.div className={isMobile ? "mb-2" : "mb-0"}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold tracking-wider text-blue-600 uppercase flex items-center gap-1 ${
                        isMobile ? "text-[8px]" : "text-[10px]"
                      }`}>
                        <Sparkles size={isMobile ? 8 : 12} />
                        Espace client
                      </p>
                      <h2
                        id="login-modal-title"
                        className={`font-bold text-gray-900 ${
                          isMobile ? "text-base" : "text-lg sm:text-2xl"
                        }`}
                      >
                        {isResetMode ? "Réinitialiser" : "Se connecter"}
                      </h2>
                    </div>
                    {isResetMode && (
                      <motion.button
                        type="button"
                        onClick={switchToLogin}
                        className="flex items-center gap-1 text-[10px] text-blue-600 font-medium"
                        whileHover={{ x: -2 }}
                      >
                        <ChevronLeft size={12} />
                        Retour
                      </motion.button>
                    )}
                  </div>
                  <p className={`text-gray-500 ${isMobile ? "text-[10px]" : "text-xs"}`}>
                    {isResetMode
                      ? "Un lien sécurisé sera envoyé par email."
                      : "Accédez à votre espace KivuPort en toute sécurité."}
                  </p>
                </motion.div>

                <form
                  onSubmit={handleSubmit}
                  className={isMobile ? "space-y-2" : "space-y-3"}
                >
                  {/* ===== CHAMP EMAIL ===== */}
                  <label className="block">
                    <span className={`flex items-center gap-1 font-medium text-gray-700 mb-0.5 ${
                      isMobile ? "text-[10px]" : "text-xs"
                    }`}>
                      <Mail size={isMobile ? 12 : 14} className="text-blue-500" />
                      Adresse email
                    </span>
                    <div className="relative">
                      <input
                        ref={emailInputRef}
                        type="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setEmailTouched(true);
                        }}
                        onBlur={() => setEmailTouched(true)}
                        placeholder="kivuport@gmail.com"
                        autoComplete="email"
                        required
                        className={`w-full ${
                          isMobile ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
                        } bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all ${
                          isEmailInvalid
                            ? "border-red-300 focus:ring-red-500/20"
                            : isEmailValid
                            ? "border-emerald-300 focus:ring-emerald-500/20"
                            : "border-gray-200"
                        }`}
                      />
                      {isEmailValid && (
                        <CheckCircle2
                          size={isMobile ? 12 : 16}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500"
                        />
                      )}
                      {isEmailInvalid && (
                        <AlertCircle
                          size={isMobile ? 12 : 16}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500"
                        />
                      )}
                    </div>
                    {isEmailInvalid && (
                      <p className={`text-red-500 mt-0.5 ${isMobile ? "text-[10px]" : "text-xs"}`}>
                        Format d&apos;email invalide
                      </p>
                    )}
                  </label>

                  {/* ===== CHAMP MOT DE PASSE AVEC JAUGE ===== */}
                  {!isResetMode && (
                    <label className="block">
                      <span className={`flex items-center justify-between font-medium text-gray-700 mb-0.5 ${
                        isMobile ? "text-[10px]" : "text-xs"
                      }`}>
                        <span className="flex items-center gap-1">
                          <KeyRound size={isMobile ? 12 : 14} className="text-blue-500" />
                          Mot de passe
                        </span>
                        <motion.button
                          type="button"
                          className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                          onClick={switchToReset}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Oublié ?
                        </motion.button>
                      </span>
                      <div className="relative flex items-center">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(event) => {
                            setPassword(event.target.value);
                            setPasswordTouched(true);
                          }}
                          onBlur={() => setPasswordTouched(true)}
                          placeholder="8 caractères minimum"
                          autoComplete="current-password"
                          required
                          className={`w-full ${
                            isMobile ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
                          } bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all ${
                            isMobile ? "pr-9" : "pr-10"
                          } ${
                            passwordTouched && password.length > 0 && password.length < 8
                              ? "border-red-300 focus:ring-red-500/20"
                              : passwordTouched && password.length >= 8
                              ? "border-emerald-300 focus:ring-emerald-500/20"
                              : "border-gray-200"
                          }`}
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowPassword((visible) => !visible)}
                          aria-label={showPassword ? "Masquer" : "Afficher"}
                          className={`absolute ${
                            isMobile ? "right-2.5" : "right-3"
                          } text-gray-400 hover:text-gray-600 transition-colors`}
                        >
                          {showPassword ? <EyeOff size={isMobile ? 12 : 16} /> : <Eye size={isMobile ? 12 : 16} />}
                        </motion.button>
                      </div>

                      {/* Jauge de force du mot de passe */}
                      {password.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-medium ${
                            passwordStrength.score <= 2 ? 'text-red-500' : 
                            passwordStrength.score <= 3 ? 'text-amber-500' : 
                            passwordStrength.score <= 4 ? 'text-blue-500' : 
                            'text-emerald-500'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                      )}
                    </label>
                  )}

                  {/* ===== OPTIONS ===== */}
                  {!isResetMode && (
                    <div className="flex items-center justify-between">
                      <label className={`flex items-center gap-1.5 text-gray-600 cursor-pointer ${
                        isMobile ? "text-[10px]" : "text-xs"
                      }`}>
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className={`${
                            isMobile ? "w-3 h-3" : "w-3.5 h-3.5"
                          } rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2`}
                        />
                        Se souvenir de moi
                      </label>
                      <div className={`flex items-center gap-1 text-gray-400 ${
                        isMobile ? "text-[8px]" : "text-[10px]"
                      }`}>
                        <Bell size={isMobile ? 10 : 12} />
                        Sécurisé
                      </div>
                    </div>
                  )}

                  {/* ===== MESSAGES ===== */}
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        className={`flex items-center gap-1.5 ${
                          isMobile ? "p-2" : "p-2.5"
                        } text-red-700 bg-red-50 border border-red-200 rounded-xl ${
                          isMobile ? "text-[10px]" : "text-xs"
                        }`}
                        role="alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <AlertCircle size={isMobile ? 12 : 16} className="shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}

                    {successMessage && (
                      <motion.div
                        className={`flex items-center gap-1.5 ${
                          isMobile ? "p-2" : "p-2.5"
                        } text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl ${
                          isMobile ? "text-[10px]" : "text-xs"
                        }`}
                        role="status"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <CheckCircle2 size={isMobile ? 12 : 16} className="shrink-0" />
                        <span>{successMessage}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ===== PROGRESS BAR ===== */}
                  {isSubmitting && (
                    <motion.div 
                      className="w-full h-1 bg-gray-200 rounded-full overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: step === "checking" ? "33%" : 
                                 step === "connecting" ? "66%" : 
                                 step === "redirecting" ? "100%" : "0%" 
                        }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                      />
                    </motion.div>
                  )}

                  {/* ===== BOUTON PRINCIPAL ===== */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting || lockoutTimer > 0}
                    className={`w-full flex items-center justify-center gap-1.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl disabled:opacity-50 mt-0.5 ${
                      isMobile ? "py-1.5 text-xs" : "py-2.5 text-sm"
                    }`}
                    whileHover={{ scale: lockoutTimer > 0 ? 1 : 1.01 }}
                    whileTap={{ scale: lockoutTimer > 0 ? 1 : 0.98 }}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <LoaderCircle size={isMobile ? 14 : 18} className="animate-spin" />
                        <span className="text-[10px] text-gray-300">
                          {step === "checking" && "Vérification..."}
                          {step === "connecting" && "Connexion..."}
                          {step === "redirecting" && "Redirection..."}
                        </span>
                      </div>
                    ) : lockoutTimer > 0 ? (
                      <>
                        <Lock size={isMobile ? 12 : 16} />
                        <span>Patienter ({lockoutTimer}s)</span>
                      </>
                    ) : isResetMode ? (
                      <>
                        Envoyer le lien <ArrowRight size={isMobile ? 12 : 16} />
                      </>
                    ) : (
                      <>
                        <LogIn size={isMobile ? 12 : 16} />
                        <span>Se connecter</span>
                        <ArrowRight size={isMobile ? 12 : 16} />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* ===== SOCIAL LOGIN ===== */}
                {!isResetMode && (
                  <>
                    <div className={`relative flex ${isMobile ? "py-2" : "py-3"} items-center`}>
                      <div className="flex-grow border-t border-gray-200"></div>
                      <span className={`flex-shrink mx-2 text-gray-400 uppercase font-medium ${
                        isMobile ? "text-[8px]" : "text-[10px]"
                      }`}>
                        ou continuer avec
                      </span>
                      <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <SocialButton
                        provider="google"
                        isLoading={isGoogleSubmitting}
                        onClick={() => handleOAuth("google")}
                        icon={<GoogleIcon />}
                        label="Google"
                      />
                      <SocialButton
                        provider="github"
                        isLoading={isGithubSubmitting}
                        onClick={() => handleOAuth("github")}
                        icon={<GithubIcon />}
                        label="GitHub"
                      />
                      <SocialButton
                        provider="apple"
                        isLoading={isAppleSubmitting}
                        onClick={() => handleOAuth("apple")}
                        icon={<AppleIcon />}
                        label="Apple"
                      />
                    </div>
                  </>
                )}

                {/* ===== RACCOURCI CLAVIER ===== */}
                <div className={`flex items-center justify-center gap-3 mt-3 text-[10px] text-gray-400 ${
                  isMobile ? "text-[8px]" : "text-[10px]"
                }`}>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[8px]">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[8px]">↵</kbd>
                    <span>Soumettre</span>
                  </span>
                  <span className="w-px h-3 bg-gray-200" />
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[8px]">⎋</kbd>
                    <span>Fermer</span>
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}