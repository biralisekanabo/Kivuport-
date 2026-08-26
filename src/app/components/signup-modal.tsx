"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Lock, User, Eye, EyeOff, Loader2, 
  X, CheckCircle2, ShieldCheck
} from "lucide-react";
import { isAdminEmail } from "@/lib/admin";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";

type AuthModalProps = {
  onClose: () => void;
  onLogin: () => void;
};

export function SignupModal({ onClose, onLogin }: AuthModalProps) {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Calculateur de force du mot de passe
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, label: "", color: "bg-zinc-200 dark:bg-zinc-800" };
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score, label: "Faible", color: "bg-red-500" };
    if (score <= 4) return { score, label: "Moyen", color: "bg-amber-500" };
    return { score, label: "Fort", color: "bg-emerald-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleOAuth = async (provider: "google" | "github" | "apple"  | "discord" | "twitter") => {
    setLoadingProvider(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || `Erreur de connexion avec ${provider}`);
      setLoadingProvider(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoadingProvider("email");

    if (name.trim().length < 2) {
      toast.error("Le nom doit contenir au moins 2 caractères.");
      setLoadingProvider(null);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Veuillez entrer une adresse email valide.");
      setLoadingProvider(null);
      return;
    }
    if (isAdminEmail(email)) {
      toast.error("Cette adresse email est réservée.");
      setLoadingProvider(null);
      return;
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      setLoadingProvider(null);
      return;
    }
    if (!acceptTerms) {
      toast.error("Veuillez accepter les conditions d'utilisation.");
      setLoadingProvider(null);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } },
      });

      if (signUpError) throw signUpError;

      if (!data.session) {
        toast.success("Compte créé ! Vérifiez vos emails pour l'activer.");
        onClose();
        onLogin();
      } else {
        toast.success("Bienvenue sur KivuPort !");
        onClose();
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoadingProvider(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.06, delayChildren: 0.05 } 
    },
    exit: { opacity: 0, transition: { duration: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring" as const, stiffness: 350, damping: 25 } 
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          {/* Backdrop avec animation subtile */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-blue-950/40 backdrop-blur-md" 
          />

          {/* Largeur réduite avec sm:max-w-sm */}
          <motion.div
            className="relative w-full sm:max-w-sm bg-white dark:bg-zinc-950 sm:rounded-3xl rounded-t-3xl shadow-2xl border border-blue-100 dark:border-blue-950 overflow-hidden max-h-[92dvh] flex flex-col"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* En-tête du Modal Centré */}
            <div className="relative flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
              <div className="w-full flex flex-col items-center text-center">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-medium mb-2 shadow-sm transition-shadow duration-200"
                >
                  <ShieldCheck size={14} className="text-blue-500 animate-pulse" />
                  Sécurisé par KivuPort
                </motion.div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Créer un compte</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Commencez l'aventure en quelques secondes.</p>
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
                className="absolute right-6 top-6 p-2.5 rounded-full bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors shadow-sm"
                aria-label="Fermer"
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Contenu sans scrollbar visible */}
            <div className="overflow-y-auto overscroll-contain px-6 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <motion.form onSubmit={handleSubmit} className="space-y-4" variants={containerVariants}>
                
                {/* Champs de saisie */}
                <motion.div variants={itemVariants} className="space-y-3.5">
                  <InputGroup
                    icon={<User size={18} />}
                    type="text"
                    placeholder="Nom complet"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                  <InputGroup
                    icon={<Mail size={18} />}
                    type="email"
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  
                  <div className="space-y-1.5">
                    <div className="relative">
                      <InputGroup
                        icon={<Lock size={18} />}
                        type={showPassword ? "text" : "password"}
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </motion.button>
                    </div>

                    {/* Jauge de sécurité du mot de passe */}
                    {password && (
                      <div className="px-1 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Sécurité :</span>
                          <span className={`font-semibold ${passwordStrength.score <= 2 ? 'text-red-500' : passwordStrength.score <= 4 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1 h-1.5 w-full">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div 
                              key={level} 
                              className={`h-full rounded-full transition-all duration-300 ${
                                passwordStrength.score >= level ? passwordStrength.color : 'bg-zinc-200 dark:bg-zinc-800'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Conditions d'utilisation */}
                <motion.div variants={itemVariants} className="flex items-start gap-2.5 pt-1">
                  <motion.input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer transition-transform"
                  />
                  <label htmlFor="terms" className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed cursor-pointer">
                    J'accepte les <a href="/terms" target="_blank" className="text-blue-600 dark:text-blue-400 underline underline-offset-2 font-medium hover:text-blue-700 transition-colors">Conditions d'utilisation</a> et la <a href="/privacy" target="_blank" className="text-blue-600 dark:text-blue-400 underline underline-offset-2 font-medium hover:text-blue-700 transition-colors">Politique de confidentialité</a>.
                  </label>
                </motion.div>

                {/* Bouton de Soumission */}
                <motion.button
                  variants={itemVariants}
                  type="submit"
                  disabled={loadingProvider === "email"}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring" as const, stiffness: 400, damping: 20 }}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-colors"
                >
                  {loadingProvider === "email" ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <span>Créer mon compte</span>
                      <CheckCircle2 size={18} className="opacity-90" />
                    </>
                  )}
                </motion.button>

                {/* Séparateur pour les réseaux sociaux */}
                <motion.div variants={itemVariants} className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
                  <span className="flex-shrink mx-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">ou s'inscrire avec</span>
                  <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
                </motion.div>

                {/* Boutons Sociaux enrichis en bas (Grille de 3 pour s'adapter à la largeur réduite) */}
                <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
                  <SocialButton 
                    provider="google" 
                    isLoading={loadingProvider === "google"} 
                    onClick={() => handleOAuth("google")}
                    icon={<GoogleIcon />}
                    label="Google"
                  />
                  <SocialButton 
                    provider="github" 
                    isLoading={loadingProvider === "github"} 
                    onClick={() => handleOAuth("github")}
                    icon={<GithubIcon />}
                    label="GitHub"
                  />
                  <SocialButton 
                    provider="apple" 
                    isLoading={loadingProvider === "apple"} 
                    onClick={() => handleOAuth("apple")}
                    icon={<AppleIcon />}
                    label="Apple"
                  />
                </motion.div>

                {/* Lien de redirection connexion */}
                <motion.p variants={itemVariants} className="text-center text-sm text-zinc-500 dark:text-zinc-400 pt-1">
                  Déjà un compte ?{" "}
                  <motion.button
                    type="button"
                    onClick={() => { onClose(); onLogin(); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline underline-offset-4 inline-block"
                  >
                    Se connecter
                  </motion.button>
                </motion.p>
              </motion.form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Composants utilitaires ---

function InputGroup({ icon, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
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

function SocialButton({ provider, isLoading, onClick, icon, label }: { 
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
      transition={{ type: "spring" as const, stiffness: 400, damping: 20 }}
      className="h-11 flex flex-col items-center justify-center gap-0.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-blue-50/50 dark:hover:bg-zinc-800/80 hover:border-blue-300 dark:hover:border-blue-800 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm group"
      aria-label={`S'inscrire avec ${label}`}
    >
      {isLoading ? <Loader2 size={16} className="animate-spin text-blue-600" /> : (
        <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.3 }}>
          {icon}
        </motion.div>
      )}
      <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{label}</span>
    </motion.button>
  );
}

// --- Icônes de marques en SVG inline avec leurs couleurs d'origine ---
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





