"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
  Ship,
  UserPlus,
  UserRound,
  X,
  ShieldCheck,
  Fingerprint,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { isAdminEmail } from "@/lib/admin";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";

type SignupModalProps = {
  onClose: () => void;
  onLogin: () => void;
};

export function SignupModal({ onClose, onLogin }: SignupModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    if (error) toast.error(error);
    if (notice) toast.info(notice);
  }, [error, notice]);
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isEmailValid = emailTouched && email && isValidEmail(email);
  const isEmailInvalid = emailTouched && email && !isValidEmail(email);
  const isNameValid = nameTouched && name.trim().length >= 2;
  const isNameInvalid = nameTouched && name.trim().length > 0 && name.trim().length < 2;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);

    if (name.trim().length < 2) {
      setError("Veuillez saisir votre nom complet.");
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError("Veuillez entrer une adresse email valide.");
      return;
    }
    if (isAdminEmail(email)) {
      setError("Cette adresse est réservée à l'administration.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setIsSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    });
    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (!data.session) {
      setNotice("Vérifiez votre adresse email pour activer votre compte.");
      return;
    }

    onClose();
    router.push("/dashboard");
  }

  async function handleGoogleSignup() {
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

  // Image de fond pour mobile
  const backgroundImage = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=800&fit=crop";

  // Variantes d'animation
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
          {/* Fond avec image sur mobile */}
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
            {/* Bouton de fermeture */}
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

            {/* Badge de sécurité */}
            <motion.div
              className={`absolute z-30 flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 bg-emerald-50 border border-emerald-200 rounded-full ${
                isMobile ? "top-2 left-2" : "top-2 left-2 md:top-3 md:left-3"
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ShieldCheck size={isMobile ? 10 : 12} className="text-emerald-600" />
              <span className="text-[8px] md:text-[10px] font-medium text-emerald-700 whitespace-nowrap">
                {isMobile ? "Sécurisé" : "Inscription sécurisée"}
              </span>
            </motion.div>

            {/* Conteneur principal */}
            <div className="flex flex-col md:flex-row h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              
              {/* Panneau de bienvenue */}
              <motion.div
                className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col justify-between items-center text-center md:items-start md:text-left shrink-0 relative overflow-hidden ${
                  isMobile 
                    ? "p-3 w-full" 
                    : "p-6 md:p-8 md:w-5/12"
                }`}
                initial={{ opacity: 0, x: isMobile ? 0 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* Effet de fond animé */}
                <motion.div
                  className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                />

                <div className="relative z-10 w-full">
                  {/* Logo */}
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
                    <span className={`font-normal text-slate-400 bg-white/10 px-1.5 py-0.5 rounded-full ${
                      isMobile ? "text-[8px]" : "text-xs"
                    }`}>
                      Goma
                    </span>
                  </motion.div>

                  {/* Contenu bienvenue */}
                  <motion.div
                    className={isMobile ? "my-1.5" : "my-6 md:my-8"}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.h3
                      className={`font-bold mb-1 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent ${
                        isMobile ? "text-sm" : "text-xl sm:text-3xl"
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      Rejoignez-nous ! 🚀
                    </motion.h3>
                    <p className={`text-slate-300 leading-relaxed ${
                      isMobile ? "text-[10px]" : "text-sm sm:text-base"
                    }`}>
                      Créez votre compte en quelques secondes et gérez vos opérations portuaires.
                    </p>
                    <motion.button
                      type="button"
                      onClick={onLogin}
                      className={`inline-flex items-center gap-1.5 font-semibold text-white rounded-xl transition-all border border-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl group ${
                        isMobile 
                          ? "mt-2 px-2.5 py-1 text-[10px]" 
                          : "mt-5 px-5 py-2.5 text-sm sm:text-base"
                      } bg-white/10 hover:bg-white/20`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <UserRound size={isMobile ? 12 : 16} className="group-hover:rotate-12 transition-transform" />
                      Se connecter
                      <ArrowRight size={isMobile ? 10 : 14} className="group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </motion.div>

                  {/* Badge sécurité */}
                  <motion.div
                    className={`flex items-center justify-center md:justify-start gap-1.5 text-slate-500 bg-white/5 px-2 py-1 rounded-full backdrop-blur-sm ${
                      isMobile ? "text-[8px]" : "text-xs"
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Fingerprint size={isMobile ? 8 : 12} />
                    Sécurité renforcée
                  </motion.div>
                </div>

                {/* Footer copyright */}
                <div className={`text-slate-500 ${isMobile ? "text-[8px] mt-1.5" : "text-xs mt-4"}`}>
                  © {new Date().getFullYear()} KivuPort.
                </div>
              </motion.div>

              {/* Panneau du Formulaire */}
              <motion.div
                className={`flex-1 bg-white ${
                  isMobile ? "p-3" : "p-4 sm:p-5 md:p-8"
                }`}
                initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: isMobile ? 0.1 : 0.2 }}
              >
                {/* Titre ESPACE CLIENT */}
                <motion.div
                  className={isMobile ? "mb-2" : "mb-0"}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div>
                    <p className={`font-semibold tracking-wider text-blue-600 uppercase flex items-center gap-1 ${
                      isMobile ? "text-[8px]" : "text-[10px]"
                    }`}>
                      <Sparkles size={isMobile ? 8 : 12} />
                      Espace client
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
                    Quelques secondes suffisent pour commencer.
                  </p>
                </motion.div>

                <form
                  onSubmit={handleSubmit}
                  className={isMobile ? "space-y-2" : "space-y-3"}
                >
                  {/* Champ Nom complet */}
                  <motion.label
                    className="block"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span className={`flex items-center gap-1 font-medium text-gray-700 mb-0.5 ${
                      isMobile ? "text-[10px]" : "text-xs"
                    }`}>
                      <UserRound size={isMobile ? 12 : 14} className="text-blue-500" />
                      Nom complet
                    </span>
                    <div className="relative">
                      <input
                        ref={nameInputRef}
                        value={name}
                        onChange={(event) => {
                          setName(event.target.value);
                          setNameTouched(true);
                        }}
                        onBlur={() => setNameTouched(true)}
                        placeholder="Jean Mukendi"
                        autoComplete="name"
                        required
                        className={`w-full ${
                          isMobile ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
                        } bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all ${
                          isNameInvalid
                            ? "border-red-300 focus:ring-red-500/20"
                            : isNameValid
                            ? "border-emerald-300 focus:ring-emerald-500/20"
                            : "border-gray-200"
                        }`}
                      />
                      {isNameValid && (
                        <CheckCircle2
                          size={isMobile ? 12 : 16}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500"
                        />
                      )}
                      {isNameInvalid && (
                        <AlertCircle
                          size={isMobile ? 12 : 16}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500"
                        />
                      )}
                    </div>
                    {isNameInvalid && (
                      <motion.p
                        className={`text-red-500 mt-0.5 ${isMobile ? "text-[10px]" : "text-xs"}`}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        Minimum 2 caractères
                      </motion.p>
                    )}
                  </motion.label>

                  {/* Champ Email */}
                  <motion.label
                    className="block"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <span className={`flex items-center gap-1 font-medium text-gray-700 mb-0.5 ${
                      isMobile ? "text-[10px]" : "text-xs"
                    }`}>
                      <Mail size={isMobile ? 12 : 14} className="text-blue-500" />
                      Email
                    </span>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setEmailTouched(true);
                        }}
                        onBlur={() => setEmailTouched(true)}
                        placeholder="vous@exemple.com"
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
                      <motion.p
                        className={`text-red-500 mt-0.5 ${isMobile ? "text-[10px]" : "text-xs"}`}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        Format d&apos;email invalide
                      </motion.p>
                    )}
                  </motion.label>

                  {/* Champ Mot de passe */}
                  <motion.label
                    className="block"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className={`flex items-center gap-1 font-medium text-gray-700 mb-0.5 ${
                      isMobile ? "text-[10px]" : "text-xs"
                    }`}>
                      <KeyRound size={isMobile ? 12 : 14} className="text-blue-500" />
                      Mot de passe
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
                        placeholder="6 caractères minimum"
                        autoComplete="new-password"
                        required
                        className={`w-full ${
                          isMobile ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
                        } bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all ${
                          isMobile ? "pr-9" : "pr-10"
                        } ${
                          passwordTouched && password.length > 0 && password.length < 6
                            ? "border-red-300 focus:ring-red-500/20"
                            : passwordTouched && password.length >= 6
                            ? "border-emerald-300 focus:ring-emerald-500/20"
                            : ""
                        }`}
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword
                            ? "Masquer le mot de passe"
                            : "Afficher le mot de passe"
                        }
                        className={`absolute ${
                          isMobile ? "right-2.5" : "right-3"
                        } text-gray-400 hover:text-gray-600 transition-colors`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showPassword ? (
                          <EyeOff size={isMobile ? 12 : 16} />
                        ) : (
                          <Eye size={isMobile ? 12 : 16} />
                        )}
                      </motion.button>
                    </div>
                    {passwordTouched && password.length > 0 && password.length < 6 && (
                      <motion.p
                        className={`text-red-500 mt-0.5 ${isMobile ? "text-[10px]" : "text-xs"}`}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        Minimum 6 caractères
                      </motion.p>
                    )}
                  </motion.label>

                  {/* Messages d'erreur/succès */}
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        className={`flex items-center gap-1.5 ${
                          isMobile ? "p-2" : "p-2.5"
                        } text-red-700 bg-red-50 border border-red-200 rounded-xl ${
                          isMobile ? "text-[10px]" : "text-xs"
                        }`}
                        role="alert"
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <AlertCircle size={isMobile ? 12 : 16} className="shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}

                    {notice && (
                      <motion.div
                        className={`flex items-center gap-1.5 ${
                          isMobile ? "p-2" : "p-2.5"
                        } text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl ${
                          isMobile ? "text-[10px]" : "text-xs"
                        }`}
                        role="status"
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CheckCircle2 size={isMobile ? 12 : 16} className="shrink-0" />
                        <span>{notice}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Bouton principal */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex items-center justify-center gap-1.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl disabled:opacity-50 mt-0.5 ${
                      isMobile ? "py-1.5 text-xs" : "py-2.5 text-sm"
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? (
                      <LoaderCircle size={isMobile ? 14 : 18} className="animate-spin" />
                    ) : (
                      <>
                        <UserPlus size={isMobile ? 12 : 16} />
                        <span>Créer mon compte</span>
                        <ArrowRight size={isMobile ? 12 : 16} />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Section "OU CONTINUER AVEC" */}
                <>
                  <motion.div
                    className={`relative flex ${
                      isMobile ? "py-2" : "py-3"
                    } items-center`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className={`flex-shrink mx-2 text-gray-400 uppercase font-medium ${
                      isMobile ? "text-[8px]" : "text-[10px]"
                    }`}>
                      ou continuer avec
                    </span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </motion.div>

                  {/* Bouton Google */}
                  <motion.button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={isSubmitting || isGoogleSubmitting}
                    className={`w-full flex items-center justify-center gap-2 px-4 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-gray-700 font-medium rounded-xl transition-all shadow-sm disabled:opacity-50 group ${
                      isMobile ? "py-1.5 text-xs" : "py-2.5 text-sm"
                    }`}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <svg
                      className={isMobile ? "w-3.5 h-3.5" : "w-5 h-5"}
                      viewBox="0 0 48 48"
                    >
                      <path
                        fill="#FFC107"
                        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                      />
                      <path
                        fill="#FF3D00"
                        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                      />
                      <path
                        fill="#4CAF50"
                        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                      />
                      <path
                        fill="#1976D2"
                        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                      />
                    </svg>
                    {isGoogleSubmitting ? (
                      <LoaderCircle size={isMobile ? 12 : 16} className="animate-spin" />
                    ) : (
                      "Continuer avec Google"
                    )}
                  </motion.button>

                  {/* Lien "Déjà un compte ?" */}
                  <motion.p
                    className={`text-center text-gray-500 ${
                      isMobile ? "mt-2 text-[10px]" : "mt-4 text-xs"
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                  >
                    Vous avez déjà un compte ?{" "}
                    <button
                      type="button"
                      onClick={onLogin}
                      className="text-blue-600 font-medium hover:underline hover:text-blue-700 transition-colors"
                    >
                      Se connecter
                    </button>
                  </motion.p>
                </>
              </motion.div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
