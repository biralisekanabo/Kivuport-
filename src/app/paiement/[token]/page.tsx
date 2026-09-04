"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CircleDollarSign,
  Download,
  Ship,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Shield,
  Lock,
  Clock,
  Receipt,
  User,
  Calendar,
  Check,
  X,
  Info,
  Sparkles,
  ShieldCheck,
  Fingerprint,
  Phone,
  Mail,
  MapPin,
  Wallet,
  TrendingUp,
  Zap,
  Award,
  Building2,
  LoaderCircle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type PaymentMethod = "maisha_pay";

// ===== DÉTECTION OPÉRATEUR =====
function detectOperator(phoneNumber: string): { operator: string; color: string; bg: string; border: string; icon: string; prefix: string } | null {
  const cleaned = phoneNumber.replace(/\s/g, "");
  
  const operators = [
    { 
      name: "Orange Money", 
      color: "text-orange-500", 
      bg: "bg-orange-50", 
      border: "border-orange-200",
      icon: "📱",
      patterns: [/^\+2438[1-9]/, /^\+2439[1-9]/, /^2438[1-9]/, /^2439[1-9]/]
    },
    { 
      name: "Vodacom M-Pesa", 
      color: "text-red-500", 
      bg: "bg-red-50", 
      border: "border-red-200",
      icon: "📲",
      patterns: [/^\+2439[7-9]/, /^2439[7-9]/]
    },
    { 
      name: "Maisha Pay", 
      color: "text-emerald-500", 
      bg: "bg-emerald-50", 
      border: "border-emerald-200",
      icon: "💳",
      patterns: [/^\+2435[0-9]/, /^2435[0-9]/]
    },
    { 
      name: "Airtel Money", 
      color: "text-amber-500", 
      bg: "bg-amber-50", 
      border: "border-amber-200",
      icon: "📶",
      patterns: [/^\+2439[0-6]/, /^2439[0-6]/]
    },
  ];

  for (const operator of operators) {
    for (const pattern of operator.patterns) {
      if (pattern.test(cleaned)) {
        return {
          operator: operator.name,
          color: operator.color,
          bg: operator.bg,
          border: operator.border,
          icon: operator.icon,
          prefix: cleaned.slice(0, 4)
        };
      }
    }
  }
  return null;
}

// ===== COMPOSANTS =====

function OperatorBadge({ phone }: { phone: string }) {
  const detection = detectOperator(phone);
  
  if (!detection || phone.length < 8) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${detection.bg} ${detection.border} ${detection.color}`}
    >
      <span className="text-sm">{detection.icon}</span>
      <span className="text-xs font-medium">{detection.operator}</span>
    </motion.div>
  );
}

function MethodCard({ 
  method, 
  selected, 
  icon, 
  label, 
  color,
  onClick 
}: { 
  method: PaymentMethod;
  selected: boolean;
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  const colors = {
    blue: { bg: "bg-blue-50", border: "border-blue-500", text: "text-blue-700" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-500", text: "text-emerald-700" },
    orange: { bg: "bg-orange-50", border: "border-orange-500", text: "text-orange-700" },
    red: { bg: "bg-red-50", border: "border-red-500", text: "text-red-700" },
    amber: { bg: "bg-amber-50", border: "border-amber-500", text: "text-amber-700" },
    purple: { bg: "bg-purple-50", border: "border-purple-500", text: "text-purple-700" },
  };

  const c = colors[color as keyof typeof colors] || colors.blue;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`relative p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 flex-1 min-w-[80px] ${
        selected
          ? `${c.bg} ${c.border} shadow-md`
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`${selected ? c.text : "text-gray-400"}`}>
        {icon}
      </div>
      <span className={`text-xs font-medium ${selected ? c.text : "text-gray-600"}`}>
        {label}
      </span>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
        >
          <Check size={12} className="text-white" />
        </motion.div>
      )}
    </motion.button>
  );
}

// ===== PAGE PRINCIPALE =====
export default function PublicPaymentPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  
  // États
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error">("info");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("maisha_pay");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState(0);
  const [reference, setReference] = useState("");
  const [destination, setDestination] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [tokenValid, setTokenValid] = useState(true);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [alreadyPaid, setAlreadyPaid] = useState(false);

  const receiptUrl = useMemo(() => {
    if (!token) return "";
    return `/api/payments/receipt?token=${encodeURIComponent(String(token))}`;
  }, [token]);

  // ===== VALIDATION TÉLÉPHONE =====
  function validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.startsWith("243") && cleaned.length === 12) return true;
    if (cleaned.startsWith("0") && cleaned.length === 10) return true;
    return false;
  }

  // ===== CHARGEMENT =====
  useEffect(() => {
    async function loadPaymentDetails() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/payments/details?token=${encodeURIComponent(String(token))}`);
        const data = await response.json();

        if (!response.ok) {
          // Gestion des erreurs
          if (response.status === 404) {
            setMessage("❌ Lien de paiement invalide ou réservation introuvable.");
            setTokenValid(false);
          } else if (data.expired) {
            setMessage("⏰ Ce lien de paiement a expiré (24h). Contactez le support.");
            setTokenExpired(true);
            setTokenValid(false);
          } else if (data.alreadyPaid) {
            setMessage("✅ Cette réservation est déjà payée.");
            setPaymentCompleted(true);
            setAlreadyPaid(true);
            setMessageType("success");
            setTokenValid(true);
          } else {
            setMessage(data.error || "Une erreur est survenue.");
            setTokenValid(false);
          }
          setMessageType("error");
          setIsLoading(false);
          return;
        }

        // Succès - mettre à jour les données
        setAmount(data.amount || 0);
        setReference(data.reference || `KP-${String(data.id || 0).padStart(4, "0")}`);
        setDestination(data.destination || "Goma - Bukavu");
        setClientName(data.client_name || "Client");
        setClientEmail(data.client_email || "client@email.com");
        setAttempts(data.attempts || 0);
        setTokenValid(true);
        
        if (data.statut !== 'arrive') {
          setMessage(`Bonjour ${data.client_name || ""}, veuillez régler votre réservation.`);
          setMessageType("info");
        }

      } catch (error) {
        console.error("Erreur chargement:", error);
        setMessage("Une erreur est survenue lors du chargement.");
        setMessageType("error");
        setTokenValid(false);
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      loadPaymentDetails();
    }
  }, [token]);

  // ===== COUNTDOWN =====
  useEffect(() => {
    if (paymentCompleted && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (paymentCompleted && countdown === 0 && !alreadyPaid) {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [paymentCompleted, countdown, router, alreadyPaid]);

  // ===== PAIEMENT =====
  async function pay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tokenValid) {
      setMessage("❌ Ce lien de paiement n'est plus valide.");
      setMessageType("error");
      return;
    }

    const isMobileMoney = method === "maisha_pay";
    
    // Validation téléphone
    if (isMobileMoney) {
      if (!phone.trim()) {
        setMessage("📱 Saisissez votre numéro de téléphone.");
        setMessageType("error");
        return;
      }
      if (!validatePhone(phone)) {
        setMessage("📱 Numéro invalide. Format: +243 99 123 4567");
        setMessageType("error");
        return;
      }
    }

    setIsPaying(true);
    setMessage("Traitement du paiement en cours...");
    setMessageType("info");

    try {
      const response = await fetch("/api/payments/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token, 
          method, 
          phone, 
        }),
      });
      
      const result = await response.json();

      if (!response.ok) {
        setPaymentCompleted(false);
        setMessage(result?.error || "Le paiement a échoué.");
        setMessageType("error");
        setIsPaying(false);
        
        // Mettre à jour les tentatives si fournies
        if (result?.attempts) {
          setAttempts(result.attempts);
        }
        return;
      }

      if (result?.alreadyPaid) {
        setPaymentCompleted(true);
        setCountdown(5);
        setAlreadyPaid(true);
        setMessage("✅ Cette réservation est déjà payée. Vous pouvez télécharger le reçu.");
      } else {
        setMessage(`📱 Demande envoyée. Confirmez le paiement sur votre téléphone. Référence: ${result.reference || reference}`);
      }
      setMessageType(result?.alreadyPaid ? "success" : "info");

    } catch (error) {
      console.error("Erreur paiement:", error);
      setMessage("Une erreur est survenue lors du paiement.");
      setMessageType("error");
    } finally {
      setIsPaying(false);
    }
  }

  // ===== FORMATAGE =====
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.startsWith("243") && cleaned.length > 3) {
      const rest = cleaned.slice(3);
      if (rest.length <= 3) return `+243 ${rest}`;
      if (rest.length <= 6) return `+243 ${rest.slice(0, 3)} ${rest.slice(3)}`;
      return `+243 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 9)}`;
    }
    return value;
  };

  // ===== ANIMATIONS =====
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 25 },
    },
  };

  const methodConfigs = {
    maisha_pay: { icon: <Smartphone size={22} />, label: "Maisha Pay", color: "emerald" },
  };

  const isMobileMoney = method === "maisha_pay";
  const operatorDetection = detectOperator(phone);

  // ===== LOADING =====
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="relative"
        >
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Ship size={20} className="text-blue-600" />
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-gray-500 font-medium"
        >
          Chargement de votre paiement...
        </motion.p>
      </div>
    );
  }

  // ===== TOKEN INVALIDE =====
  if (!tokenValid && !paymentCompleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {tokenExpired ? "Lien expiré" : "Lien invalide"}
          </h2>
          <p className="text-gray-500 text-sm mb-6">{message}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            <ArrowLeft size={16} />
            Retour à l'accueil
          </Link>
        </motion.div>
      </div>
    );
  }

  // ===== RENDU PRINCIPAL =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-4 sm:py-6 md:py-10 px-3 sm:px-4 md:px-6">
      {/* ===== HEADER ===== */}
      <motion.header
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="max-w-2xl mx-auto mb-4 sm:mb-6"
      >
        <Link href="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors text-xs sm:text-sm mb-3 sm:mb-4">
          <ArrowLeft size={14} className="sm:w-[16px] sm:h-[16px]" />
          Retour à l&apos;accueil
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
            <Ship size={18} className="sm:w-[20px] sm:h-[20px]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">KivuPort</h1>
            <p className="text-xs sm:text-sm text-gray-500">Paiement sécurisé</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-[10px] sm:text-xs text-gray-400">
            <Lock size={12} className="sm:w-[14px] sm:h-[14px] text-emerald-500" />
            <span className="hidden xs:inline">SSL Sécurisé</span>
          </div>
        </div>
      </motion.header>

      {/* ===== CARD PRINCIPALE ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* ===== EN-TÊTE ===== */}
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4 bg-gradient-to-r from-blue-600 to-indigo-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider">Réservation</p>
                <p className="text-base sm:text-lg font-bold text-white">{reference || "KP-0000"}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-white/20 rounded-full">
                  <span className="text-[10px] sm:text-xs font-medium text-white">{destination || "Goma - Bukavu"}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  {amount.toLocaleString("fr-FR")} FC
                </p>
                <p className="text-[10px] sm:text-xs text-white/60">Montant à payer</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-white/60 bg-white/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full self-start sm:self-auto">
                <Clock size={11} className="sm:w-[12px] sm:h-[12px]" />
                <span>Paiement sécurisé</span>
              </div>
            </div>
          </div>

          {/* ===== CORPS ===== */}
          <div className="p-4 sm:p-6">
            {/* Client info */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4"
            >
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{clientName || "Client"}</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-200" />
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                <span className="text-sm text-gray-600">{clientEmail || "client@email.com"}</span>
              </div>
              {attempts > 0 && (
                <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  Tentative {attempts}/3
                </div>
              )}
            </motion.div>

            {/* Message */}
            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  key={message}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-3 rounded-xl mb-4 flex items-start gap-2 text-xs sm:text-sm ${
                    messageType === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : messageType === "error"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {messageType === "success" ? (
                    <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] shrink-0 mt-0.5" />
                  ) : messageType === "error" ? (
                    <AlertCircle size={16} className="sm:w-[18px] sm:h-[18px] shrink-0 mt-0.5" />
                  ) : (
                    <Info size={16} className="sm:w-[18px] sm:h-[18px] shrink-0 mt-0.5" />
                  )}
                  <span>{message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            {paymentCompleted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={32} className="sm:w-[40px] sm:h-[40px] text-emerald-600" />
                </div>
                {!alreadyPaid && (
                  <p className="text-sm text-gray-500">
                    Redirection dans <strong>{countdown}</strong> secondes...
                  </p>
                )}
                {receiptUrl && (
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-500/25 text-sm"
                  >
                    <Download size={14} className="sm:w-[16px] sm:h-[16px]" />
                    Télécharger le reçu PDF
                  </a>
                )}
                {alreadyPaid && (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 mt-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/25 text-sm"
                  >
                    <ArrowLeft size={14} />
                    Retour au tableau de bord
                  </Link>
                )}
              </motion.div>
            )}

            {/* Formulaire */}
            {!paymentCompleted && (
              <motion.form
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                onSubmit={pay}
                className="space-y-4"
              >
                {/* MaishaPay */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-700 mb-2.5">
                    Mode de paiement
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(methodConfigs).map(([key, config]) => (
                      <MethodCard
                        key={key}
                        method={key as PaymentMethod}
                        selected={method === key}
                        icon={config.icon}
                        label={config.label}
                        color={config.color}
                        onClick={() => setMethod(key as PaymentMethod)}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Vous recevrez une demande sur votre portefeuille mobile. Saisissez ensuite votre code PIN sur votre téléphone pour confirmer.
                  </p>
                </motion.div>

                {/* Champs */}
                <AnimatePresence mode="wait">
                  {isMobileMoney && (
                    <motion.div
                      key="mobile-money"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          <Phone size={14} className="inline mr-1.5 text-blue-500" />
                          Numéro de téléphone *
                        </label>
                        <div className="relative">
                          <input
                            value={phone}
                            onChange={(e) => setPhone(formatPhone(e.target.value))}
                            placeholder="+243 99 123 4567"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all text-sm"
                          />
                          {phone.length > 8 && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <OperatorBadge phone={phone} />
                            </div>
                          )}
                        </div>
                        {operatorDetection && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-xs mt-1.5 flex items-center gap-1.5 ${operatorDetection.color}`}
                          >
                            <span>{operatorDetection.icon}</span>
                            <span>Opérateur détecté : <strong>{operatorDetection.operator}</strong></span>
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>

                {/* Bouton de paiement */}
                <motion.button
                  variants={itemVariants}
                  type="submit"
                  disabled={isPaying}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isPaying ? (
                    <div className="flex items-center gap-2">
                      <LoaderCircle size={18} className="animate-spin" />
                      Traitement en cours...
                    </div>
                  ) : (
                    <>
                      <CircleDollarSign size={16} className="sm:w-[18px] sm:h-[18px]" />
                      Continuer avec MaishaPay · {amount.toLocaleString("fr-FR")} FC
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </div>

          {/* ===== FOOTER SÉCURITÉ ===== */}
          <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <Shield size={11} className="sm:w-[12px] sm:h-[12px] text-emerald-500" />
                <span>Paiement sécurisé</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock size={11} className="sm:w-[12px] sm:h-[12px] text-emerald-500" />
                <span>Chiffré SSL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={11} className="sm:w-[12px] sm:h-[12px] text-emerald-500" />
                <span>Protection des données</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Fingerprint size={11} className="sm:w-[12px] sm:h-[12px] text-emerald-500" />
                <span>Vérifié</span>
              </div>
            </div>
          </div>
        </div>

        {/* Badges de confiance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-gray-400"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Certifié
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            Support 24/7
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            Reçu PDF inclus
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
            Sécurisé
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}