"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ship,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Shield,
  Lock,
  Clock,
  User,
  Mail,
  Phone,
  Info,
  LoaderCircle,
  X,
  Download,
} from "lucide-react";
import Link from "next/link";

function detectOperator(phone: string) {
  const cleaned = phone.replace(/\s/g, "");
  const operators = [
    { name: "Orange Money", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200", icon: "📱", patterns: [/^\+2438[1-9]/, /^\+2439[1-9]/, /^2438[1-9]/, /^2439[1-9]/] },
    { name: "Vodacom M-Pesa", color: "text-red-500", bg: "bg-red-50", border: "border-red-200", icon: "📲", patterns: [/^\+2439[7-9]/, /^2439[7-9]/] },
    { name: "Maisha Pay", color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", icon: "💳", patterns: [/^\+2435[0-9]/, /^2435[0-9]/] },
    { name: "Airtel Money", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200", icon: "📶", patterns: [/^\+2439[0-6]/, /^2439[0-6]/] },
  ];
  for (const op of operators) {
    for (const p of op.patterns) {
      if (p.test(cleaned)) {
        return { operator: op.name, color: op.color, bg: op.bg, border: op.border, icon: op.icon };
      }
    }
  }
  return null;
}

function OperatorBadge({ phone }: { phone: string }) {
  const d = detectOperator(phone);
  if (!d || phone.length < 8) return null;
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${d.bg} ${d.border} ${d.color}`}
    >
      <span>{d.icon}</span> {d.operator}
    </motion.span>
  );
}

export default function PublicPaymentPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error">("info");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
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

  function validatePhone(p: string): boolean {
    const c = p.replace(/\s/g, "");
    if (c.startsWith("243") && c.length === 12) return true;
    if (c.startsWith("0") && c.length === 10) return true;
    return false;
  }

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

  useEffect(() => {
    async function loadPaymentDetails() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/payments/details?token=${encodeURIComponent(String(token))}`);
        const data = await response.json();
        if (!response.ok) {
          if (response.status === 404) {
            setMessage("Lien de paiement invalide ou réservation introuvable.");
            setTokenValid(false);
          } else if (data.expired) {
            setMessage("Ce lien de paiement a expiré (24h). Contactez le support.");
            setTokenExpired(true);
            setTokenValid(false);
          } else if (data.alreadyPaid) {
            setMessage("Cette réservation est déjà payée.");
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
        setAmount(data.amount || 0);
        setReference(data.reference || `KP-${String(data.id || 0).padStart(4, "0")}`);
        setDestination(data.destination || "Goma - Bukavu");
        setClientName(data.client_name || "Client");
        setClientEmail(data.client_email || "client@email.com");
        setAttempts(data.attempts || 0);
        setTokenValid(true);
      } catch {
        setMessage("Une erreur est survenue lors du chargement.");
        setMessageType("error");
        setTokenValid(false);
      } finally {
        setIsLoading(false);
      }
    }
    if (token) loadPaymentDetails();
  }, [token]);

  useEffect(() => {
    if (paymentCompleted && countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
    if (paymentCompleted && countdown === 0 && !alreadyPaid) {
      const t = setTimeout(() => router.push("/dashboard"), 500);
      return () => clearTimeout(t);
    }
  }, [paymentCompleted, countdown, router, alreadyPaid]);

  async function pay(e: FormEvent) {
    e.preventDefault();
    if (!tokenValid) {
      setMessage("Ce lien de paiement n'est plus valide.");
      setMessageType("error");
      return;
    }
    if (!phone.trim()) {
      setMessage("Saisissez votre numéro de téléphone.");
      setMessageType("error");
      return;
    }
    if (!validatePhone(phone)) {
      setMessage("Numéro invalide. Format: +243 99 123 4567");
      setMessageType("error");
      return;
    }

    setIsPaying(true);
    setMessage("Traitement du paiement en cours...");
    setMessageType("info");

    try {
      const res = await fetch("/api/payments/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, method: "maisha_pay", phone }),
      });
      const result = await res.json();
      if (!res.ok) {
        setPaymentCompleted(false);
        setMessage(result?.error || "Le paiement a échoué.");
        setMessageType("error");
        setIsPaying(false);
        if (result?.attempts) setAttempts(result.attempts);
        return;
      }
      if (result?.alreadyPaid) {
        setPaymentCompleted(true);
        setCountdown(5);
        setAlreadyPaid(true);
        setMessage("Cette réservation est déjà payée. Vous pouvez télécharger le reçu.");
      } else {
        setMessage(`Demande envoyée. Confirmez le paiement sur votre téléphone. Réf: ${result.reference || reference}`);
      }
      setMessageType(result?.alreadyPaid ? "success" : "info");
    } catch {
      setMessage("Une erreur est survenue lors du paiement.");
      setMessageType("error");
    } finally {
      setIsPaying(false);
    }
  }

  const operatorDetection = detectOperator(phone);

  const overlay = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modal = {
    hidden: { opacity: 0, scale: 0.92, y: 30 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 350, damping: 30 } },
    exit: { opacity: 0, scale: 0.95, y: 20 },
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 w-[90vw] max-w-sm"
        >
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Ship size={16} className="text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Chargement du paiement...</p>
        </motion.div>
      </div>
    );
  }

  if (!tokenValid && !paymentCompleted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50 px-4">
        <motion.div variants={overlay} initial="hidden" animate="visible" className="w-[90vw] max-w-sm">
          <motion.div variants={modal} className="bg-white rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {tokenExpired ? "Lien expiré" : "Lien invalide"}
            </h2>
            <p className="text-sm text-gray-500 mb-5">{message}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
            >
              <ArrowLeft size={14} /> Retour
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50 px-3 py-4 overflow-y-auto">
      <motion.div variants={overlay} initial="hidden" animate="visible" className="w-[90vw] max-w-md">
        <motion.div variants={modal} className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="px-5 pt-5 pb-4 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
            <Link href="/" className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors">
              <X size={14} />
            </Link>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-1.5 bg-white/15 rounded-lg">
                <Ship size={16} className="text-white" />
              </div>
              <span className="text-sm font-bold text-white">KivuPort</span>
              <div className="ml-auto flex items-center gap-1 text-[10px] text-white/50">
                <Lock size={10} /> SSL
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/50">Réservation</p>
                <p className="text-base font-bold text-white">{reference}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">{amount.toLocaleString("fr-FR")} <span className="text-sm font-medium">FC</span></p>
                <p className="text-[10px] text-white/50">{destination}</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            {paymentCompleted ? (
              /* ===== SUCCESS ===== */
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-2">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Paiement confirmé</h3>
                {!alreadyPaid && (
                  <p className="text-xs text-gray-400 mb-3">Redirection dans <strong>{countdown}</strong>s...</p>
                )}
                {receiptUrl && (
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-emerald-500/25 mt-2"
                  >
                    <Download size={14} /> Télécharger le reçu
                  </a>
                )}
                {alreadyPaid && (
                  <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors mt-3">
                    <ArrowLeft size={14} /> Retour au tableau de bord
                  </Link>
                )}
              </motion.div>
            ) : (
              /* ===== FORMULAIRE PAIEMENT ===== */
              <>
                {/* Client info */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 px-3 py-2 bg-gray-50 rounded-lg">
                  <User size={12} className="text-gray-400" />
                  <span className="font-medium text-gray-700">{clientName}</span>
                  <span className="text-gray-300">|</span>
                  <Mail size={12} className="text-gray-400" />
                  <span>{clientEmail}</span>
                  {attempts > 0 && (
                    <span className="ml-auto text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                      {attempts}/3
                    </span>
                  )}
                </div>

                {/* Message */}
                <AnimatePresence mode="wait">
                  {message && (
                    <motion.div
                      key={message}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`mb-3 p-2.5 rounded-lg flex items-start gap-2 text-xs ${
                        messageType === "success"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : messageType === "error"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {messageType === "success" ? (
                        <CheckCircle size={14} className="shrink-0 mt-0.5" />
                      ) : messageType === "error" ? (
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      ) : (
                        <Info size={14} className="shrink-0 mt-0.5" />
                      )}
                      <span>{message}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Formulaire */}
                <form onSubmit={pay} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      <Phone size={12} className="inline mr-1 text-blue-500" />
                      Numéro de téléphone
                    </label>
                    <div className="relative">
                      <input
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        placeholder="+243 99 123 4567"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all text-sm"
                      />
                      {phone.length > 8 && (
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                          <OperatorBadge phone={phone} />
                        </div>
                      )}
                    </div>
                    {operatorDetection && (
                      <motion.p
                        initial={{ opacity: 0, y: -3 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-[11px] mt-1 flex items-center gap-1 ${operatorDetection.color}`}
                      >
                        <span>{operatorDetection.icon}</span>
                        Opérateur : <strong>{operatorDetection.operator}</strong>
                      </motion.p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      Vous recevrez une demande sur votre portefeuille mobile. Confirmez avec votre code PIN.
                    </p>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isPaying}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isPaying ? (
                      <div className="flex items-center gap-2">
                        <LoaderCircle size={16} className="animate-spin" />
                        Traitement...
                      </div>
                    ) : (
                      <>
                        <Smartphone size={16} />
                        Payer avec MaishaPay · {amount.toLocaleString("fr-FR")} FC
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><Shield size={10} className="text-emerald-500" /> Sécurisé</span>
                  <span className="flex items-center gap-1"><Lock size={10} className="text-emerald-500" /> SSL</span>
                  <span className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-500" /> Vérifié</span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
