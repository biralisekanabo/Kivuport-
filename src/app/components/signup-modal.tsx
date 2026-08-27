"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  X,
  CheckCircle2,
  ShieldCheck,
  Shield,
  Fingerprint,
  Ship,
  UserPlus,
  ArrowRight,
  Sparkles,
  Phone,
  AlertCircle,
  Check,
  KeyRound,
} from "lucide-react";
import { isAdminEmail } from "@/lib/admin";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";

type AuthModalProps = {
  onClose: () => void;
  onLogin: () => void;
};

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
export function SignupModal({ onClose, onLogin }: AuthModalProps) {
  const router = useRouter();

  // ===== ÉTATS =====
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showVerifyMessage, setShowVerifyMessage] = useState(false);

  // ===== DÉTECTION MOBILE =====
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ===== ANIMATION =====
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // ===== TOASTS =====
  useEffect(() => {
    if (error) toast.error(error);
    if (successMessage) toast.success(successMessage);
  }, [error, successMessage]);

  // ===== DOMAINES TEMPORAIRES =====
  const TEMP_EMAIL_DOMAINS = [
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "trashmail.com",
    "throwaway.com",
    "temp-mail.org",
    "yopmail.com",
    "getnada.com",
  ];

  // ===== FONCTIONS =====
  const isTempEmail = (email: string): boolean => {
    const domain = email.split("@")[1];
    return TEMP_EMAIL_DOMAINS.some((temp) => domain?.includes(temp));
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-zinc-200 dark:bg-zinc-800" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score, label: "Faible", color: "bg-red-500" };
    if (score <= 3) return { score, label: "Moyen", color: "bg-amber-500" };
    if (score <= 4) return { score, label: "Bon", color: "bg-blue-500" };
    return { score, label: "Fort", color: "bg-emerald-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  // ===== VALIDATION =====
  const validateForm = (): boolean => {
    clearMessages();

    // 1. Nom
    if (name.trim().length < 2) {
      setError("Le nom doit contenir au moins 2 caractères.");
      return false;
    }

    // 2. Email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Veuillez entrer une adresse email valide.");
      return false;
    }

    // 3. Email réservé (admin)
    if (isAdminEmail(email)) {
      setError("Cette adresse email est réservée.");
      return false;
    }

    // 4. Email temporaire
    if (isTempEmail(email)) {
      setError("Les emails temporaires ne sont pas autorisés.");
      return false;
    }

    // 5. Téléphone
    if (!phone.trim()) {
      setError("Le numéro de téléphone est requis.");
      return false;
    }

    // 6. Mot de passe
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return false;
    }

    // 7. Confirmation mot de passe
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return false;
    }

    // 8. Conditions
    if (!acceptTerms) {
      setError("Veuillez accepter les conditions d'utilisation.");
      return false;
    }

    return true;
  };

  // ===== INSCRIPTION =====
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoadingProvider("email");

    try {
      // Vérifier si l'email existe déjà
      const { data: existingUser } = await supabase
        .from("client")
        .select("id")
        .eq("email", email.trim())
        .maybeSingle();

      if (existingUser) {
        setError("📧 Cet email est déjà utilisé. Veuillez vous connecter.");
        setLoadingProvider(null);
        return;
      }

      // Créer le compte
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("Cet email est déjà inscrit. Connectez-vous plutôt.");
        } else {
          setError(signUpError.message || "Une erreur est survenue lors de l'inscription.");
        }
        setLoadingProvider(null);
        return;
      }

      // Créer le client dans la table client
      if (data.user) {
        const parts = name.trim().split(/\s+/);
        const { error: clientError } = await supabase.from("client").insert({
          nom: parts.slice(1).join(" ") || parts[0],
          prenom: parts[0],
          email: email.trim(),
          telephone: phone.trim(),
          statut: "actif",
          date_inscription: new Date().toISOString(),
        });

        if (clientError) {
          console.error("Erreur création client:", clientError);
        }
      }

      if (!data.session) {
        setShowVerifyMessage(true);
        setSuccessMessage("📧 Compte créé ! Un email de confirmation vous a été envoyé.");
        setTimeout(() => {
          onClose();
          router.push("/verify-email");
        }, 3000);
      } else {
        setSuccessMessage("✅ Bienvenue sur KivuPort !");
        setTimeout(() => {
          onClose();
          router.push("/dashboard");
        }, 1000);
      }
    } catch (error: any) {
      setError(error.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoadingProvider(null);
    }
  };

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

  const backgroundImage =
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=800&fit=crop";

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
          onMouseDown={(event) => event.target === event.currentTarget && onClose()}
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
                ? "w-[95%] max-h-[90vh] rounded-2xl"
                : "max-w-md md:max-w-2xl max-h-[98vh] md:max-h-[95vh] rounded-2xl md:rounded-3xl"
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-modal-title"
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

            {/* ===== BADGE SÉCURITÉ ===== */}
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
                {isMobile ? "Sécurisé" : "Inscription sécurisée"}
              </span>
            </motion.div>

            <div className="flex flex-col md:flex-row h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {/* ===== PANEL GAUCHE - BIENVENUE ===== */}
              <motion.div
                className={`bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex flex-col justify-between items-center text-center md:items-start md:text-left shrink-0 relative overflow-hidden ${
                  isMobile ? "p-3 w-full" : "p-6 md:p-8 md:w-5/12"
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
                    <span
                      className={`${
                        isMobile ? "p-1.5" : "p-2"
                      } bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/30`}
                    >
                      <Ship size={isMobile ? 14 : 20} />
                    </span>
                    <span className="text-white">KivuPort</span>
                    <span
                      className={`font-normal text-blue-300 bg-white/10 px-1.5 py-0.5 rounded-full ${
                        isMobile ? "text-[8px]" : "text-xs"
                      }`}
                    >
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
                    >
                      Créer un compte ⚓
                    </motion.h3>
                    <p className={`text-blue-200 leading-relaxed ${
                      isMobile ? "text-[10px]" : "text-sm sm:text-base"
                    }`}>
                      Commencez l'aventure en quelques secondes.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <motion.button
                        type="button"
                        onClick={() => {
                          onClose();
                          onLogin();
                        }}
                        className={`inline-flex items-center gap-1.5 font-semibold text-white rounded-xl transition-all border border-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl group ${
                          isMobile
                            ? "mt-2 px-2.5 py-1 text-[10px]"
                            : "mt-5 px-5 py-2.5 text-sm sm:text-base"
                        } bg-white/10 hover:bg-white/20`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <UserPlus size={isMobile ? 12 : 16} className="group-hover:rotate-12 transition-transform" />
                        Se connecter
                        <ArrowRight size={isMobile ? 10 : 14} className="group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Badges de sécurité */}
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
                <motion.div className={isMobile ? "mb-2" : "mb-4"}>
                  <div>
                    <p
                      className={`font-semibold tracking-wider text-blue-600 uppercase flex items-center gap-1 ${
                        isMobile ? "text-[8px]" : "text-[10px]"
                      }`}
                    >
                      <Sparkles size={isMobile ? 8 : 12} />
                      Nouveau compte
                    </p>
                    <h2
                      id="signup-modal-title"
                      className={`font-bold text-gray-900 ${
                        isMobile ? "text-base" : "text-lg sm:text-2xl"
                      }`}
                    >
                      Créer un compte
                    </h2>
                  </div>
                  <p className={`text-gray-500 ${isMobile ? "text-[10px]" : "text-xs"}`}>
                    Remplissez les champs ci-dessous pour commencer.
                  </p>
                </motion.div>

                {/* ===== MESSAGES ===== */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      className={`flex items-center gap-1.5 ${
                        isMobile ? "p-2" : "p-2.5"
                      } text-red-700 bg-red-50 border border-red-200 rounded-xl ${
                        isMobile ? "text-[10px]" : "text-xs"
                      } mb-3`}
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
                      } mb-3`}
                      role="status"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <CheckCircle2 size={isMobile ? 12 : 16} className="shrink-0" />
                      <span>{successMessage}</span>
                    </motion.div>
                  )}

                  {showVerifyMessage && (
                    <motion.div
                      className={`flex items-center gap-1.5 ${
                        isMobile ? "p-2" : "p-2.5"
                      } text-amber-700 bg-amber-50 border border-amber-200 rounded-xl ${
                        isMobile ? "text-[10px]" : "text-xs"
                      } mb-3`}
                      role="status"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Mail size={isMobile ? 12 : 16} className="shrink-0" />
                      <span>Un email de confirmation vous a été envoyé.</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className={isMobile ? "space-y-2" : "space-y-3"}>
                  {/* ===== NOM COMPLET ===== */}
                  <InputGroup
                    icon={<User size={18} />}
                    type="text"
                    placeholder="Nom complet *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />

                  {/* ===== EMAIL ===== */}
                  <InputGroup
                    icon={<Mail size={18} />}
                    type="email"
                    placeholder="nom@exemple.com *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />

                  {/* ===== TÉLÉPHONE ===== */}
                  <InputGroup
                    icon={<Phone size={18} />}
                    type="tel"
                    placeholder="+243 99 123 4567 *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    required
                  />

                  {/* ===== MOT DE PASSE ===== */}
                  <div className="space-y-1.5">
                    <div className="relative">
                      <InputGroup
                        icon={<Lock size={18} />}
                        type={showPassword ? "text" : "password"}
                        placeholder="Mot de passe *"
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
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </motion.button>
                    </div>

                    {/* Jauge de force */}
                    {password.length > 0 && (
                      <div className="px-1 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Sécurité :</span>
                          <span
                            className={`font-semibold ${
                              passwordStrength.score <= 2
                                ? "text-red-500"
                                : passwordStrength.score <= 3
                                ? "text-amber-500"
                                : passwordStrength.score <= 4
                                ? "text-blue-500"
                                : "text-emerald-500"
                            }`}
                          >
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1 h-1.5 w-full">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-full rounded-full transition-all duration-300 ${
                                passwordStrength.score >= level
                                  ? passwordStrength.color
                                  : "bg-zinc-200 dark:bg-zinc-800"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          8 caractères min • majuscule • minuscule • chiffre • spécial
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ===== CONFIRMER MOT DE PASSE ===== */}
                  <div className="relative">
                    <InputGroup
                      icon={<KeyRound size={18} />}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmer le mot de passe *"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </motion.button>
                  </div>

                  {/* ===== CONDITIONS ===== */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <motion.input
                      type="checkbox"
                      id="terms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer transition-transform"
                    />
                    <label
                      htmlFor="terms"
                      className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed cursor-pointer"
                    >
                      J'accepte les{" "}
                      <a
                        href="/terms"
                        target="_blank"
                        className="text-blue-600 dark:text-blue-400 underline underline-offset-2 font-medium hover:text-blue-700 transition-colors"
                      >
                        Conditions d'utilisation
                      </a>{" "}
                      et la{" "}
                      <a
                        href="/privacy"
                        target="_blank"
                        className="text-blue-600 dark:text-blue-400 underline underline-offset-2 font-medium hover:text-blue-700 transition-colors"
                      >
                        Politique de confidentialité
                      </a>
                      .
                    </label>
                  </div>

                  {/* ===== BOUTON ===== */}
                  <motion.button
                    type="submit"
                    disabled={loadingProvider === "email"}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-2xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-colors"
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
                </form>

                {/* ===== RACCOURCI CLAVIER ===== */}
                <div
                  className={`flex items-center justify-center gap-3 mt-3 text-[10px] text-gray-400 ${
                    isMobile ? "text-[8px]" : "text-[10px]"
                  }`}
                >
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

                {/* ===== LIEN CONNEXION ===== */}
                <p className={`text-center text-sm text-zinc-500 dark:text-zinc-400 pt-2 ${
                  isMobile ? "text-[10px]" : "text-sm"
                }`}>
                  Déjà un compte ?{" "}
                  <motion.button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogin();
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline underline-offset-4 inline-block"
                  >
                    Se connecter
                  </motion.button>
                </p>
              </motion.div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}