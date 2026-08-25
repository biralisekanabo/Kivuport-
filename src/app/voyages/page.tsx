"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Search,
  Ship,
  MapPin,
  Clock,
  DollarSign,
  Filter,
  SortAsc,
  X,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Grid3x3,
  List,
  Users,
  Package,
  Star,
  TrendingUp,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

type Voyage = {
  id: number;
  idbateau: number;
  code_voyage: string;
  description?: string | null;
  statut: string;
  date_depart: string;
  prix_minimum: number;
  bateau?: {
    nom?: string;
    capacite_passager?: number;
    capacite_cargaison?: number;
  } | null;
  trajets?: { nom: string; date: string; distance: number }[];
};

// ===== COMPOSANTS =====

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-5 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="h-10 w-24 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

function TravelCard({ voyage, index }: { voyage: Voyage; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors = {
    prevu: "bg-emerald-100 text-emerald-700 border-emerald-200",
    en_cours: "bg-blue-100 text-blue-700 border-blue-200",
    termine: "bg-gray-100 text-gray-700 border-gray-200",
    annule: "bg-red-100 text-red-700 border-red-200",
  };

  const statusLabels = {
    prevu: "Prévu",
    en_cours: "En cours",
    termine: "Terminé",
    annule: "Annulé",
  };

  const departureDate = parseISO(voyage.date_depart);
  const isSoon = new Date(voyage.date_depart).getTime() - new Date().getTime() < 86400000 * 3;

  return (
    <motion.article
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, type: "spring", stiffness: 300 }}
      whileHover={{ y: -2 }}
      layoutId={`voyage-${voyage.id}`}
    >
      <div 
        className="p-5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Icône / Statut */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
                <Ship size={18} className="relative z-10" />
              </div>
              {isSoon && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            <div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusColors[voyage.statut as keyof typeof statusColors] || "bg-gray-100 text-gray-700"}`}>
                {statusLabels[voyage.statut as keyof typeof statusLabels] || voyage.statut}
              </span>
            </div>
          </div>

          {/* Infos principales */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-mono">{voyage.code_voyage}</span>
              {isSoon && (
                <span className="text-[8px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                  Départ bientôt
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {voyage.bateau?.nom || "Bateau KivuPort"}
            </h2>
            <p className="text-sm text-gray-500 truncate">
              {voyage.description || (voyage.trajets || []).map((route) => route.nom).join(" · ") || "Trajet à consulter"}
            </p>
          </div>

          {/* Prix et date */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">
                {voyage.prix_minimum > 0 
                  ? `${voyage.prix_minimum.toLocaleString("fr-FR")} FC` 
                  : "Tarif à confirmer"}
              </p>
              <time className="text-xs text-gray-400">
                {format(departureDate, "dd MMM yyyy", { locale: fr })}
              </time>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href={`/voyages/${voyage.id}`}
                className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ArrowRight size={16} />
              </Link>
              <button
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={16} />
                </motion.div>
              </button>
            </div>
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
              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {voyage.bateau?.capacite_passager && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users size={16} className="text-blue-400" />
                      <span>{voyage.bateau.capacite_passager} passagers</span>
                    </div>
                  )}
                  {voyage.bateau?.capacite_cargaison && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package size={16} className="text-amber-400" />
                      <span>{voyage.bateau.capacite_cargaison} tonnes</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} className="text-purple-400" />
                    <span>{format(departureDate, "HH:mm", { locale: fr })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} className="text-emerald-400" />
                    <span>
                      {formatDistanceToNow(departureDate, { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                </div>

                {/* Trajets */}
                {(voyage.trajets || []).length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-500 mb-2">Itinéraire</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(voyage.trajets || []).map((route, i) => (
                        <span key={i} className="flex items-center gap-1 text-sm text-gray-700">
                          <MapPin size={12} className="text-blue-400" />
                          {route.nom}
                          {i < (voyage.trajets || []).length - 1 && (
                            <ArrowRight size={12} className="text-gray-300" />
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

// ===== PAGE PRINCIPALE =====
export default function VoyagesPage() {
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [query, setQuery] = useState("");
  const [port, setPort] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState("date-asc");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [animateItems, setAnimateItems] = useState(true);

  const pageSize = 10;

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // ===== CHARGEMENT =====
  const loadVoyages = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const voyagesResult = await supabase
        .from("voyages")
        .select("id, idbateau, code_voyage, description, statut, date_depart")
        .eq("statut", "prevu")
        .order("date_depart");

      if (voyagesResult.error) {
        setError(`Impossible de charger les voyages : ${voyagesResult.error.message}`);
        setIsLoading(false);
        return;
      }

      const baseVoyages = (voyagesResult.data || []) as {
        id: number;
        idbateau: number;
        code_voyage: string;
        description?: string | null;
        statut: string;
        date_depart: string;
      }[];

      const boatIds = [...new Set(baseVoyages.map((voyage) => voyage.idbateau))];
      const voyageIds = baseVoyages.map((voyage) => voyage.id);

      const [boatsResult, pavilionsResult, routesResult] = await Promise.all([
        boatIds.length
          ? supabase
              .from("bateaux")
              .select("id, nom, capacite_passager, capacite_cargaison")
              .in("id", boatIds)
          : Promise.resolve({ data: [], error: null }),
        boatIds.length
          ? supabase
              .from("pavillons")
              .select("idbateau, prix_unitaire")
              .in("idbateau", boatIds)
          : Promise.resolve({ data: [], error: null }),
        voyageIds.length
          ? supabase
              .from("trajets")
              .select("idvoyage, nom, date, distance")
              .in("idvoyage", voyageIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const errors = [boatsResult.error, pavilionsResult.error, routesResult.error].filter(Boolean);
      if (errors.length) {
        setError(`Certaines informations de voyage sont indisponibles : ${errors[0]?.message}`);
      }

      const boatsById = new Map((boatsResult.data || []).map((boat) => [boat.id, boat]));
      const routesByVoyage = new Map<number, { nom: string; date: string; distance: number }[]>();
      (routesResult.data || []).forEach((route) => {
        routesByVoyage.set(route.idvoyage, [
          ...(routesByVoyage.get(route.idvoyage) || []),
          route,
        ]);
      });

      const pricesByBoat = new Map<number, number>();
      (pavilionsResult.data || []).forEach((pavilion) => {
        const price = Number(pavilion.prix_unitaire || 0);
        pricesByBoat.set(
          pavilion.idbateau,
          Math.min(pricesByBoat.get(pavilion.idbateau) ?? Number.POSITIVE_INFINITY, price)
        );
      });

      setVoyages(
        baseVoyages.map((voyage) => ({
          ...voyage,
          bateau: boatsById.get(voyage.idbateau) || null,
          trajets: routesByVoyage.get(voyage.id) || [],
          prix_minimum: pricesByBoat.get(voyage.idbateau) ?? 0,
        }))
      );
    } catch (err) {
      setError("Une erreur est survenue lors du chargement des voyages.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVoyages();
  }, [loadVoyages]);

  // ===== RECHERCHE ET FILTRES =====
  const filtered = useMemo(() => {
    return voyages
      .filter((voyage) => {
        const haystack = `${voyage.code_voyage} ${voyage.description || ""} ${voyage.bateau?.nom || ""} ${(voyage.trajets || []).map((route) => route.nom).join(" ")}`.toLowerCase();
        const date = voyage.date_depart.slice(0, 10);
        const matchesSearch = haystack.includes(query.toLowerCase());
        const matchesPort = !port || haystack.includes(port.toLowerCase());
        const matchesFromDate = !fromDate || date >= fromDate;
        const matchesToDate = !toDate || date <= toDate;
        const matchesFilter = selectedFilter === "all" || voyage.statut === selectedFilter;
        return matchesSearch && matchesPort && matchesFromDate && matchesToDate && matchesFilter;
      })
      .sort((left, right) => {
        switch (sort) {
          case "date-desc":
            return right.date_depart.localeCompare(left.date_depart);
          case "price-asc":
            return left.prix_minimum - right.prix_minimum;
          case "price-desc":
            return right.prix_minimum - left.prix_minimum;
          default:
            return left.date_depart.localeCompare(right.date_depart);
        }
      });
  }, [voyages, query, port, fromDate, toDate, sort, selectedFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetPage = () => setPage(1);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadVoyages();
    setIsRefreshing(false);
  };

  // ===== ANIMATION VARIANTS =====
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
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
  };

  return (
    <motion.main
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/80 shadow-sm"
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
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100"
              >
                <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
              </motion.button>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Mon espace
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Contenu */}
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
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
              >
                <ArrowLeft size={14} />
                Mon espace
              </Link>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                <span className="w-8 h-px bg-blue-300" />
                Horaires du port
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-1">
                Voyages disponibles.
              </h1>
              <p className="text-gray-500 mt-1">
                {filtered.length} voyage{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
                {voyages.length > 0 && ` • ${voyages.length} au total`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-xl transition-colors ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-xl transition-colors ${viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                onClick={() => setViewMode("list")}
              >
                <List size={18} />
              </motion.button>
            </div>
          </motion.div>

          {/* Message d'erreur */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
            >
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Filtres */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-3">
              {/* Recherche */}
              <div className="flex-1 min-w-[180px]">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={query}
                    onChange={(event) => { setQuery(event.target.value); resetPage(); }}
                    placeholder="Rechercher un voyage..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Port */}
              <div className="w-full sm:w-auto">
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={port}
                    onChange={(event) => { setPort(event.target.value); resetPage(); }}
                    placeholder="Port"
                    className="w-full sm:w-32 pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(event) => { setFromDate(event.target.value); resetPage(); }}
                    className="w-full sm:w-36 pl-9 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all text-sm"
                  />
                </div>
                <span className="text-gray-400 text-xs">→</span>
                <div className="relative">
                  <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(event) => { setToDate(event.target.value); resetPage(); }}
                    className="w-full sm:w-36 pl-9 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Tri */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(event) => { setSort(event.target.value); resetPage(); }}
                  className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all text-sm appearance-none"
                >
                  <option value="date-asc">Départ bientôt</option>
                  <option value="date-desc">Départ tard</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Filtre statut */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors text-sm text-gray-600"
              >
                <Filter size={14} />
                Filtres
                {selectedFilter !== "all" && (
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                )}
              </button>

              {(query || port || fromDate || toDate || selectedFilter !== "all") && (
                <button
                  onClick={() => {
                    setQuery("");
                    setPort("");
                    setFromDate("");
                    setToDate("");
                    setSelectedFilter("all");
                    resetPage();
                  }}
                  className="flex items-center gap-1 px-2.5 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={14} />
                  Effacer
                </button>
              )}
            </div>

            {/* Filtres étendus */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 mt-3 border-t border-gray-100 flex flex-wrap gap-2">
                    {["all", "prevu", "en_cours", "termine", "annule"].map((status) => (
                      <button
                        key={status}
                        onClick={() => { setSelectedFilter(status); resetPage(); }}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          selectedFilter === status
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {status === "all" ? "Tous" :
                         status === "prevu" ? "Prévus" :
                         status === "en_cours" ? "En cours" :
                         status === "termine" ? "Terminés" : "Annulés"}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Liste des voyages */}
          <motion.div
            variants={itemVariants}
            className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
          >
            {isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : visible.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Ship size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">Aucun voyage disponible</p>
                <p className="text-sm text-gray-400 mt-1">
                  Aucun voyage publié par l&apos;administration avec le statut « prévu ».
                </p>
              </div>
            ) : (
              <LayoutGroup>
                {visible.map((voyage, index) => (
                  <TravelCard key={voyage.id} voyage={voyage} index={index} />
                ))}
              </LayoutGroup>
            )}
          </motion.div>

          {/* Pagination */}
          {filtered.length > pageSize && (
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100"
            >
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft size={16} />
                Précédent
              </button>
              <span className="text-sm text-gray-500">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.main>
  );
}
