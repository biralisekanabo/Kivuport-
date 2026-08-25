"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Anchor,
  CalendarDays,
  Ship,
  Ticket,
  MapPin,
  Clock,
  Users,
  Package,
  DollarSign,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  User,
  CreditCard,
  ShieldCheck,
  Info,
  Sparkles,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

type Detail = {
  id: number;
  code_voyage: string;
  description?: string | null;
  date_depart: string;
  bateau?: {
    id?: number;
    nom?: string;
    capacite_passager?: number;
    capacite_cargaison?: number;
  } | null;
  trajets?: {
    nom: string;
    date: string;
    distance: number;
    conceder?: { port?: { nom?: string; ville?: string } | null; ordre_etape?: number }[];
  }[];
};

type Pavilion = {
  id: number;
  nom: string;
  classe?: string | null;
  capacite_max: number;
  unite: string;
  prix_unitaire: number;
  prix_tonne?: number | null;
  devise: string;
  idbateau: number;
};

// ===== COMPOSANTS =====

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4" />
      <div className="h-10 bg-gray-200 rounded w-1/2" />
      <div className="h-5 bg-gray-200 rounded w-1/3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-24 bg-gray-200 rounded-xl" />
        <div className="h-24 bg-gray-200 rounded-xl" />
      </div>
      <div className="h-48 bg-gray-200 rounded-xl" />
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, color = "blue" }: { icon: any; label: string; value: string; color?: "blue" | "emerald" | "amber" | "purple" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  };

  return (
    <motion.div
      className={`p-4 bg-white rounded-xl border ${colors[color]} shadow-sm hover:shadow-md transition-shadow`}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${colors[color]}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-sm font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function PavilionCard({ pavilion, index }: { pavilion: Pavilion; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-300"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/25 shrink-0">
            <Ticket size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{pavilion.nom}</h3>
            <p className="text-sm text-gray-500">
              {pavilion.classe || "Catégorie standard"}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Users size={12} />
                {pavilion.capacite_max} {pavilion.unite}
              </span>
              {pavilion.prix_tonne && pavilion.prix_tonne > 0 && (
                <span className="flex items-center gap-1">
                  <Package size={12} />
                  {pavilion.prix_tonne.toLocaleString("fr-FR")} {pavilion.devise}/t
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">
              {pavilion.prix_unitaire.toLocaleString("fr-FR")} {pavilion.devise}
            </p>
            <p className="text-[10px] text-gray-400">par {pavilion.unite}</p>
          </div>
          <motion.button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Réserver
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ===== PAGE PRINCIPALE =====
export default function VoyageDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [voyage, setVoyage] = useState<Detail | null>(null);
  const [pavilions, setPavilions] = useState<Pavilion[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "pavilions">("details");

  // ===== CHARGEMENT =====
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const voyageResult = await supabase
        .from("voyages")
        .select("id, code_voyage, description, date_depart, idbateau")
        .eq("id", Number(params.id))
        .single();

      if (voyageResult.error || !voyageResult.data) {
        setError(voyageResult.error?.message || "Voyage introuvable.");
        setIsLoading(false);
        return;
      }

      const [boatResult, routesResult, pavilionResult] = await Promise.all([
        supabase
          .from("bateaux")
          .select("id, nom, capacite_passager, capacite_cargaison")
          .eq("id", voyageResult.data.idbateau)
          .single(),
        supabase
          .from("trajets")
          .select("id, nom, date, distance")
          .eq("idvoyage", Number(params.id))
          .order("date"),
        supabase
          .from("pavillons")
          .select("id, nom, classe, capacite_max, unite, prix_unitaire, prix_tonne, devise, idbateau")
          .eq("idbateau", voyageResult.data.idbateau)
          .order("prix_unitaire"),
      ]);

      if (boatResult.error) {
        setError(`Impossible de charger le bateau : ${boatResult.error.message}`);
        setIsLoading(false);
        return;
      }

      if (pavilionResult.error) {
        setError(`Impossible de charger les pavillons : ${pavilionResult.error.message}`);
        setIsLoading(false);
        return;
      }

      setVoyage({
        ...voyageResult.data,
        bateau: boatResult.data,
        trajets: routesResult.data || [],
      } as Detail);
      setPavilions((pavilionResult.data || []) as Pavilion[]);
    } catch (err) {
      setError("Une erreur est survenue lors du chargement.");
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ===== REFRESH =====
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // ===== ANIMATIONS =====
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
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

  // ===== STATES =====
  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-100 p-8 max-w-md w-full text-center shadow-lg">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/voyages"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
            Retour aux voyages
          </Link>
        </div>
      </main>
    );
  }

  if (isLoading || !voyage) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <SkeletonDetail />
        </div>
      </main>
    );
  }

  const departureDate = parseISO(voyage.date_depart);
  const isSoon = new Date(voyage.date_depart).getTime() - new Date().getTime() < 86400000 * 3;

  return (
    <motion.main
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* ===== HEADER ===== */}
      <motion.header
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/voyages" className="flex items-center gap-2.5 group">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/25">
                <Ship size={18} className="relative z-10" />
              </div>
              <span className="font-bold text-lg text-gray-900">KivuPort</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                aria-label="Actualiser"
              >
                <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
              </button>
              <Link
                href="/voyages"
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={14} />
                Retour
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ===== CONTENU ===== */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* En-tête du voyage */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-mono text-gray-400">{voyage.code_voyage}</span>
                  {isSoon && (
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Départ bientôt
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {voyage.bateau?.nom || "Voyage KivuPort"}
                </h1>
                <p className="text-gray-500 mt-1">
                  {voyage.description || "Une traversée organisée depuis le port de Goma."}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-sm text-gray-400">Prix à partir de</p>
                  <p className="text-xl font-bold text-blue-600">
                    {pavilions.length > 0 
                      ? `${Math.min(...pavilions.map(p => p.prix_unitaire)).toLocaleString("fr-FR")} FC`
                      : "À confirmer"}
                  </p>
                </div>
                <Link
                  href={`/reservations?voyage=${voyage.id}`}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center gap-2"
                >
                  <Ticket size={16} />
                  Réserver
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Informations clés */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <InfoCard
              icon={CalendarDays}
              label="Départ"
              value={format(departureDate, "EEEE dd MMMM yyyy 'à' HH:mm", { locale: fr })}
              color="blue"
            />
            <InfoCard
              icon={Clock}
              label="Temps restant"
              value={formatDistanceToNow(departureDate, { addSuffix: true, locale: fr })}
              color="emerald"
            />
            <InfoCard
              icon={Users}
              label="Passagers"
              value={`${voyage.bateau?.capacite_passager || 0} places`}
              color="amber"
            />
            <InfoCard
              icon={Package}
              label="Cargaison"
              value={`${voyage.bateau?.capacite_cargaison || 0} tonnes`}
              color="purple"
            />
          </motion.div>

          {/* Tabs */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab("details")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === "details"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Anchor size={16} />
                  Trajet
                </span>
              </button>
              <button
                onClick={() => setActiveTab("pavilions")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === "pavilions"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Ticket size={16} />
                  Pavillons ({pavilions.length})
                </span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "details" ? (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-5"
                >
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Itinéraire</h3>
                  {voyage.trajets && voyage.trajets.length > 0 ? (
                    <div className="space-y-3">
                      {voyage.trajets.map((route, index) => (
                        <motion.div
                          key={`${route.nom}-${route.date}`}
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex items-center gap-2 min-w-[40px]">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{route.nom}</p>
                            <p className="text-xs text-gray-400">
                              {format(parseISO(route.date), "dd MMM yyyy", { locale: fr })}
                              {route.distance > 0 && ` • ${route.distance} km`}
                            </p>
                          </div>
                          {index < (voyage.trajets || []).length - 1 && (
                            <ChevronRight size={16} className="text-gray-300" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-6">Aucun trajet enregistré</p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="pavilions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-5 space-y-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Catégories disponibles</h3>
                    <span className="text-xs text-gray-400">{pavilions.length} options</span>
                  </div>
                  {pavilions.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                      Aucun pavillon disponible pour ce bateau.
                    </p>
                  ) : (
                    pavilions.map((pavilion, index) => (
                      <PavilionCard key={pavilion.id} pavilion={pavilion} index={index} />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Sécurité et informations */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span>Paiements sécurisés</span>
              </div>
              <div className="flex items-center gap-2">
                <Info size={16} className="text-blue-500" />
                <span>Informations certifiées</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <span>Service client 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} className="text-purple-500" />
                <span>Réservation nominative</span>
              </div>
            </div>
          </motion.div>

          {/* Bouton d'action flottant (mobile) */}
          <motion.div
            variants={itemVariants}
            className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-lg md:hidden"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-400">Prix à partir de</p>
                <p className="text-lg font-bold text-blue-600">
                  {pavilions.length > 0 
                    ? `${Math.min(...pavilions.map(p => p.prix_unitaire)).toLocaleString("fr-FR")} FC`
                    : "À confirmer"}
                </p>
              </div>
              <Link
                href={`/reservations?voyage=${voyage.id}`}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                <Ticket size={16} />
                Réserver
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.main>
  );
}
