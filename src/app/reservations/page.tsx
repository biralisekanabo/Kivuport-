"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CircleDollarSign,
  LoaderCircle,
  LogOut,
  Ship,
  Ticket,
  X,
  Anchor,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Package,
  Users,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  CreditCard,
  Receipt,
  Info,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Shield,
  Wallet,
  Plane,
  Truck,
  UserCheck,
  CalendarDays,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Download,
  Printer,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

type Voyage = {
  id: number;
  idbateau: number;
  code_voyage: string;
  date_depart: string;
  statut: string;
  bateau?: {
    id: number;
    nom: string;
    capacite_passager: number;
    capacite_cargaison: number;
  } | null;
};

type Pavillon = {
  id: number;
  nom: string;
  capacite_max: number;
  prix_unitaire: number;
  prix_tonne?: number | null;
  devise: string;
  idbateau: number;
};

type Reservation = {
  id: number;
  date_embarquement: string;
  statut: string;
  type_reservation: string;
  prix_total: number;
  voyage?: { code_voyage?: string } | null;
  pavillon?: { nom?: string } | null;
};

// ===== COMPOSANTS =====

function ReservationCard({ 
  reservation, 
  isPaid, 
  onPay, 
  onCancel,
  index 
}: { 
  reservation: Reservation; 
  isPaid: boolean; 
  onPay: (reservation: Reservation) => void;
  onCancel: (reservation: Reservation) => void;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusColors = {
    en_attente: "bg-amber-50 text-amber-700 border-amber-200",
    confirme: "bg-emerald-50 text-emerald-700 border-emerald-200",
    annule: "bg-red-50 text-red-700 border-red-200",
    paye: "bg-blue-50 text-blue-700 border-blue-200",
  };

  const statusLabels = {
    en_attente: "En attente",
    confirme: "Confirmée",
    annule: "Annulée",
    paye: "Payée",
  };

  const statusIcons = {
    en_attente: <ClockIcon size={14} className="text-amber-500" />,
    confirme: <CheckCircle size={14} className="text-emerald-500" />,
    annule: <X size={14} className="text-red-500" />,
    paye: <CreditCard size={14} className="text-blue-500" />,
  };

  const isPaidStatus = isPaid;

  return (
    <motion.article
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -2 }}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Info principale */}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900">
                #{reservation.id} · {reservation.voyage?.code_voyage || "Voyage"}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[reservation.statut as keyof typeof statusColors] || "bg-gray-50 text-gray-700"}`}>
                {statusIcons[reservation.statut as keyof typeof statusIcons]}
                {isPaidStatus ? "Payée" : statusLabels[reservation.statut as keyof typeof statusLabels] || reservation.statut}
              </span>
              {isPaidStatus && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-medium">
                  <CheckCircle size={10} />
                  Payé
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {format(parseISO(reservation.date_embarquement), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
              </span>
              <span className="flex items-center gap-1">
                <Package size={12} />
                {reservation.pavillon?.nom || "Pavillon"}
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon size={12} />
                {formatDistanceToNow(parseISO(reservation.date_embarquement), { addSuffix: true, locale: fr })}
              </span>
            </div>
          </div>

          {/* Prix et actions */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">
                {reservation.prix_total.toLocaleString("fr-FR")} FC
              </p>
              <p className="text-[10px] text-gray-400">{reservation.type_reservation}</p>
            </div>
            <button
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <ChevronRight size={16} />
              </motion.div>
            </button>
          </div>
        </div>

        {/* Détails étendus */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Calendar size={14} className="text-blue-400" />
                  <span>Embarquement: {format(parseISO(reservation.date_embarquement), "dd/MM/yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Package size={14} className="text-blue-400" />
                  <span>Type: {reservation.type_reservation}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Ticket size={14} className="text-blue-400" />
                  <span>Pavillon: {reservation.pavillon?.nom || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CreditCard size={14} className="text-blue-400" />
                  <span>Total: {reservation.prix_total.toLocaleString("fr-FR")} FC</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

// ===== PAGE PRINCIPALE =====
export default function ReservationsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [pavillons, setPavillons] = useState<Pavillon[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [paidReservationIds, setPaidReservationIds] = useState<number[]>([]);
  const [selectedVoyage, setSelectedVoyage] = useState("");
  const [selectedPavillon, setSelectedPavillon] = useState("");
  const [reservationType, setReservationType] = useState("passage");
  const [cargoWeight, setCargoWeight] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error" | "warning">("info");
  const [dataError, setDataError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const currentVoyage = voyages.find((voyage) => voyage.id === Number(selectedVoyage));
  const availablePavillons = useMemo(() => pavillons.filter((pavillon) => Number(pavillon.idbateau) === Number(currentVoyage?.idbateau)), [currentVoyage, pavillons]);
  const currentPavillon = availablePavillons.find((pavillon) => pavillon.id === Number(selectedPavillon));
  const estimatedPrice = (Number(currentPavillon?.prix_unitaire || 0) + (reservationType !== "passage" ? Number(cargoWeight || 0) * Number(currentPavillon?.prix_tonne || 0) : 0));

  // ===== TOASTS =====
  useEffect(() => {
    if (dataError) toast.error(dataError);
  }, [dataError]);

  useEffect(() => {
    if (!message) return;
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("impossible") || lowerMessage.includes("refusé") || lowerMessage.includes("expiré")) {
      toast.error(message);
    } else if (lowerMessage.includes("après") || lowerMessage.includes("complétez") || lowerMessage.includes("déjà")) {
      toast.warning(message);
    } else {
      toast.success(message);
    }
  }, [message]);

  // ===== CHARGEMENT =====
  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return router.replace("/");
      setEmail(userData.user.email || "");
      setName(userData.user.user_metadata?.name || "");

      const voyagesPromise = supabase
        .from("voyages")
        .select("id, code_voyage, date_depart, statut, idbateau")
        .eq("statut", "prevu")
        .order("date_depart");

      const reservationsPromise = loadReservations(userData.user.email || "");

      const voyagesResult = await voyagesPromise;
      const voyageRows = (voyagesResult.data || []) as {
        id: number;
        code_voyage: string;
        date_depart: string;
        statut: string;
        idbateau: number;
      }[];

      const boatIds = [...new Set(voyageRows.map((voyage) => voyage.idbateau))];

      const [boatsResult, pavillonsResult] = await Promise.all([
        boatIds.length
          ? supabase
              .from("bateaux")
              .select("id, nom, capacite_passager, capacite_cargaison")
              .in("id", boatIds)
          : Promise.resolve({ data: [], error: null }),
        boatIds.length
          ? supabase
              .from("pavillons")
              .select("id, nom, capacite_max, prix_unitaire, prix_tonne, devise, idbateau")
              .in("idbateau", boatIds)
              .order("prix_unitaire")
          : Promise.resolve({ data: [], error: null }),
      ]);

      const loadingError = [voyagesResult.error, boatsResult.error, pavillonsResult.error].find(Boolean);
      if (loadingError) setDataError(`Impossible de charger les voyages ou pavillons : ${loadingError.message}`);

      const boatsById = new Map((boatsResult.data || []).map((boat) => [boat.id, boat]));

      setVoyages(
        voyageRows.map((voyage) => ({
          ...voyage,
          bateau: boatsById.get(voyage.idbateau) || null,
        })) as Voyage[]
      );

      setPavillons(
        (pavillonsResult.data || []).map((pavilion) => ({
          ...pavilion,
          id: Number(pavilion.id),
          idbateau: Number(pavilion.idbateau),
          capacite_max: Number(pavilion.capacite_max || 0),
          prix_unitaire: Number(pavilion.prix_unitaire || 0),
          prix_tonne: Number(pavilion.prix_tonne || 0),
        })) as Pavillon[]
      );

      await reservationsPromise;
      setIsLoading(false);
    }
    load();
  }, [router]);

  async function loadReservations(userEmail: string) {
    const { data: client } = await supabase
      .from("client")
      .select("id")
      .ilike("email", userEmail)
      .maybeSingle();

    if (!client) {
      setReservations([]);
      return;
    }

    const { data, error } = await supabase
      .from("reservations")
      .select(
        "id, date_embarquement, statut, type_reservation, prix_total, voyage:voyages(code_voyage), pavillon:pavillons!reservations_idpavillon_fkey(nom)"
      )
      .eq("idclient", client.id)
      .order("date_embarquement", { ascending: false });

    if (error) setDataError(`Impossible de charger vos réservations : ${error.message}`);
    setReservations((data || []) as Reservation[]);

    const reservationIds = (data || []).map((reservation) => reservation.id);
    if (reservationIds.length > 0) {
      const { data: payments } = await supabase
        .from("paiements")
        .select("idreservation")
        .in("idreservation", reservationIds)
        .eq("statut", "paye");
      setPaidReservationIds((payments || []).map((payment) => payment.idreservation));
    } else {
      setPaidReservationIds([]);
    }
  }

  // ===== CRÉATION RÉSERVATION =====
  async function createReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentVoyage || !currentPavillon || !name.trim() || !phone.trim()) {
      setMessage("Choisissez un voyage, un pavillon et complétez votre téléphone.");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    const parts = name.trim().split(/\s+/);

    const result = await supabase.rpc("create_kivuport_reservation", {
      p_date_reservation: new Date().toISOString(),
      p_date_embarquement: currentVoyage.date_depart,
      p_type_reservation: reservationType,
      p_poids_cargaison: reservationType === "passage" ? null : Number(cargoWeight || 0),
      p_idvoyage: currentVoyage.id,
      p_idpavillon: currentPavillon.id,
      p_prix_total: estimatedPrice,
      p_client_nom: parts.slice(1).join(" ") || parts[0],
      p_client_prenom: parts[0],
      p_client_telephone: phone.trim(),
    });

    setIsSubmitting(false);

    if (result.error) {
      setMessage(`Réservation impossible : ${result.error.message}`);
      setMessageType("error");
      return;
    }

    setMessage("✅ Réservation créée avec succès ! Elle est maintenant en attente de confirmation.");
    setMessageType("success");

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      await fetch("/api/reservations/notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ reservationId: result.data[0].id, kind: "created" }),
      });
    }

    setSelectedVoyage("");
    setSelectedPavillon("");
    setCargoWeight("");
    await loadReservations(email);
  }

  // ===== PAIEMENT =====
  async function simulatePayment(reservation: Reservation) {
    setMessage("");
    if (reservation.statut !== "confirme") {
      setMessage("Le paiement sera disponible après confirmation de votre réservation.");
      setMessageType("warning");
      return;
    }
    if (paidReservationIds.includes(reservation.id)) {
      setMessage("Cette réservation est déjà payée.");
      setMessageType("info");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMessage("Votre session a expiré. Reconnectez-vous.");
      setMessageType("error");
      return;
    }

    const response = await fetch("/api/payments/simulate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify({ reservationId: reservation.id }),
    });

    const result = await response.json().catch(() => null) as { error?: string } | null;

    if (!response.ok) {
      setMessage(`Paiement impossible : ${result?.error || "Le serveur a refusé la demande."}`);
      setMessageType("error");
      return;
    }

    setMessage(`✅ Paiement simulé avec succès pour la réservation #${reservation.id}.`);
    setMessageType("success");
    setPaidReservationIds((current) => [...current, reservation.id]);
    await loadReservations(email);
  }

  // ===== ANNULATION =====
  async function cancelReservation(reservation: Reservation) {
    const result = await supabase.rpc("transition_kivuport_reservation", {
      p_reservation_id: reservation.id,
      p_to_status: "annule",
      p_reason: "client_request",
    });

    if (result.error) {
      setMessage(`Annulation impossible : ${result.error.message}`);
      setMessageType("error");
      return;
    }

    setMessage(`✅ La réservation #${reservation.id} a été annulée.`);
    setMessageType("success");
    await loadReservations(email);
  }

  // ===== LOGOUT =====
  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  // ===== FILTRES =====
  const filteredReservations = useMemo(() => {
    let filtered = reservations;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          String(r.id).includes(query) ||
          r.voyage?.code_voyage?.toLowerCase().includes(query) ||
          r.pavillon?.nom?.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== "all") {
      if (filterStatus === "paye") {
        filtered = filtered.filter((r) => paidReservationIds.includes(r.id));
      } else {
        filtered = filtered.filter((r) => r.statut === filterStatus);
      }
    }

    return filtered;
  }, [reservations, searchQuery, filterStatus, paidReservationIds]);

  // ===== STATS =====
  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.statut === "en_attente").length,
    confirmed: reservations.filter((r) => r.statut === "confirme").length,
    paid: paidReservationIds.length,
  };

  // ===== ANIMATIONS =====
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
  };

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
          Chargement des voyages...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* ===== HEADER ===== */}
      <motion.header
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
                  <Ship size={20} className="relative z-10" />
                </div>
              </div>
              <span className="font-bold text-lg text-gray-900">KivuPort</span>
            </Link>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                type="button"
                onClick={logout}
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Déconnexion</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ===== CONTENU ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* En-tête */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2">
                <ArrowLeft size={14} />
                Mon espace
              </Link>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                <span className="w-8 h-px bg-blue-300" />
                Réservations
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                Préparer votre traversée.
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Choisissez un voyage disponible et suivez vos demandes depuis un seul endroit.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-xs font-medium text-gray-600">
                <RefreshCw size={14} />
                Actualiser
              </button>
            </div>
          </motion.div>

          {/* Erreur */}
          {dataError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
            >
              <AlertCircle size={18} className="shrink-0" />
              <span>{dataError}</span>
            </motion.div>
          )}

          {/* Statistiques */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-2xl border border-amber-100 p-4 shadow-sm">
              <p className="text-xs text-amber-500">En attente</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm">
              <p className="text-xs text-emerald-500">Confirmées</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.confirmed}</p>
            </div>
            <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm">
              <p className="text-xs text-blue-500">Payées</p>
              <p className="text-2xl font-bold text-blue-600">{stats.paid}</p>
            </div>
          </motion.div>

          {/* Layout principal */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Formulaire - 3/5 */}
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-blue-50 rounded-xl">
                    <Ticket size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Nouvelle réservation</h2>
                    <p className="text-sm text-gray-500">Disponibilités contrôlées automatiquement</p>
                  </div>
                </div>

                <form onSubmit={createReservation} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <Ship size={14} className="inline mr-1.5 text-blue-500" />
                        Voyage
                      </label>
                      <select
                        value={selectedVoyage}
                        onChange={(event) => {
                          setSelectedVoyage(event.target.value);
                          setSelectedPavillon("");
                        }}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all text-sm"
                        required
                      >
                        <option value="">Choisir un voyage</option>
                        {voyages.map((voyage) => (
                          <option value={voyage.id} key={voyage.id}>
                            {voyage.code_voyage} · {format(parseISO(voyage.date_depart), "dd/MM/yyyy HH:mm", { locale: fr })} · {voyage.bateau?.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <Ticket size={14} className="inline mr-1.5 text-blue-500" />
                        Pavillon
                      </label>
                      <select
                        value={selectedPavillon}
                        onChange={(event) => setSelectedPavillon(event.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all text-sm"
                        required
                        disabled={!currentVoyage || availablePavillons.length === 0}
                      >
                        <option value="">
                          {!currentVoyage
                            ? "Choisir d'abord un voyage"
                            : availablePavillons.length === 0
                            ? "Aucun pavillon disponible"
                            : "Choisir un pavillon"}
                        </option>
                        {availablePavillons.map((pavillon) => (
                          <option value={pavillon.id} key={pavillon.id}>
                            {pavillon.nom} · {pavillon.prix_unitaire} {pavillon.devise}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                      <select
                        value={reservationType}
                        onChange={(event) => setReservationType(event.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all text-sm"
                      >
                        <option value="passage">Passage</option>
                        <option value="mixte">Passage + cargaison</option>
                        <option value="cargaison">Cargaison</option>
                      </select>
                    </div>

                    {reservationType !== "passage" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          <Package size={14} className="inline mr-1.5 text-blue-500" />
                          Poids (tonnes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={cargoWeight}
                          onChange={(event) => setCargoWeight(event.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all text-sm"
                          required
                        />
                      </div>
                    )}

                    {currentPavillon && (
                      <div className="flex items-center justify-center p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Total estimé</p>
                          <p className="text-lg font-bold text-emerald-600">
                            {estimatedPrice.toLocaleString("fr-FR")} {currentPavillon.devise}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <User size={14} className="inline mr-1.5 text-blue-500" />
                        Nom complet
                      </label>
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <Phone size={14} className="inline mr-1.5 text-blue-500" />
                        Téléphone
                      </label>
                      <input
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+243..."
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all text-sm"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Ticket size={18} />
                        Envoyer la réservation
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Liste des réservations - 2/5 */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-purple-50 rounded-xl">
                    <Anchor size={18} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">Mes réservations</h2>
                    <p className="text-sm text-gray-500">Statut et paiement</p>
                  </div>
                  <span className="text-xs text-gray-400">{reservations.length} total</span>
                </div>

                {/* Recherche et filtre */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="flex-1 min-w-[120px]">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher..."
                        className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all text-xs"
                      />
                    </div>
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all text-xs"
                  >
                    <option value="all">Tous</option>
                    <option value="en_attente">En attente</option>
                    <option value="confirme">Confirmé</option>
                    <option value="paye">Payé</option>
                    <option value="annule">Annulé</option>
                  </select>
                </div>

                {/* Liste */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredReservations.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Ticket size={20} className="text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">Aucune réservation</p>
                      <p className="text-xs text-gray-400 mt-1">Créez votre première réservation</p>
                    </div>
                  ) : (
                    filteredReservations.map((reservation, index) => (
                      <ReservationCard
                        key={reservation.id}
                        reservation={reservation}
                        isPaid={paidReservationIds.includes(reservation.id)}
                        onPay={simulatePayment}
                        onCancel={cancelReservation}
                        index={index}
                      />
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer sécurité */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400 pt-4 border-t border-gray-100">
            <span className="flex items-center gap-1.5">
              <Shield size={12} className="text-emerald-500" />
              Paiement sécurisé
            </span>
            <span className="flex items-center gap-1.5">
              <UserCheck size={12} className="text-blue-500" />
              Réservation nominative
            </span>
            <span className="flex items-center gap-1.5">
              <Receipt size={12} className="text-amber-500" />
              Reçu disponible
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-purple-500" />
              Service client 24/7
            </span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}