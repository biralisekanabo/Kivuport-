"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Anchor,
  BarChart3,
  Building2,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Download,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Plus,
  Search,
  RefreshCw,
  Settings,
  Ship,
  SlidersHorizontal,
  UserRound,
  Users,
  X,
  Ticket,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Shield,
  Zap,
  Database,
  Eye,
  Edit,
  Trash2,
  Filter,
  MoreHorizontal,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  Calendar,
  User,
  Mail,
  Phone,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Section = "overview" | "reservations" | "payments" | "fleet" | "pavilions" | "infrastructure" | "people" | "settings";
type ReservationStatus = "En attente" | "Confirmée" | "Payée" | "Annulée";
type AdminReservation = { 
  id: number; 
  reference: string; 
  client: string; 
  client_email?: string;
  client_phone?: string;
  route: string; 
  date: string; 
  amount: string; 
  status: ReservationStatus; 
  type: string;
  created_at?: string;
  details?: string;
};

const navigation: { id: Section; label: string; icon: typeof LayoutDashboard; color: string }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard, color: "blue" },
  { id: "reservations", label: "Réservations", icon: Anchor, color: "emerald" },
  { id: "payments", label: "Paiements", icon: CircleDollarSign, color: "amber" },
  { id: "fleet", label: "Flotte & voyages", icon: Ship, color: "purple" },
  { id: "pavilions", label: "Pavillons & tarifs", icon: Ticket, color: "pink" },
  { id: "infrastructure", label: "Ports & quais", icon: Gauge, color: "indigo" },
  { id: "people", label: "Clients & équipe", icon: Users, color: "teal" },
  { id: "settings", label: "Paramètres", icon: Settings, color: "gray" },
];

type AdminRows = { payments: string[][]; fleet: string[][]; infrastructure: string[][]; people: string[][]; pavilions: string[][] };
type AdminMetrics = { todayReservations: number; revenue: string; activeClients: number; plannedVoyages: number; pendingPayments: number };

// ===== COMPOSANTS =====

function StatCard({ label, value, icon: Icon, color, loading, trend }: {
  label: string;
  value: string | number;
  icon: any;
  color?: "blue" | "emerald" | "amber" | "purple" | "pink" | "indigo" | "teal";
  loading?: boolean;
  trend?: { value: number; positive: boolean };
}) {
  const colors = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", light: "text-blue-400" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", light: "text-emerald-400" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", light: "text-amber-400" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100", light: "text-purple-400" },
    pink: { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-100", light: "text-pink-400" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", light: "text-indigo-400" },
    teal: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-100", light: "text-teal-400" },
  };

  const c = colors[color || "blue"];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-pulse">
        <div className="h-20" />
      </div>
    );
  }

  return (
    <motion.div
      className={`bg-white rounded-2xl border ${c.border} p-5 shadow-sm hover:shadow-lg transition-all duration-300`}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 ${c.bg} rounded-xl`}>
          <Icon size={18} className={c.text} />
        </div>
        {trend && (
          <span className={`text-xs font-medium flex items-center gap-1 ${trend.positive ? "text-emerald-600" : "text-red-600"}`}>
            {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </motion.div>
  );
}

// ===== MODAL DE VISUALISATION =====
function ViewModal({ 
  isOpen, 
  onClose, 
  data, 
  title 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  data: any; 
  title: string;
}) {
  if (!isOpen || !data) return null;

  const statusColors = {
    "En attente": "bg-amber-50 text-amber-700 border-amber-200",
    "Confirmée": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Payée": "bg-blue-50 text-blue-700 border-blue-200",
    "Annulée": "bg-red-50 text-red-700 border-red-200",
  };

  const statusIcons = {
    "En attente": <Clock size={16} className="text-amber-500" />,
    "Confirmée": <CheckCircle size={16} className="text-emerald-500" />,
    "Payée": <DollarSign size={16} className="text-blue-500" />,
    "Annulée": <AlertTriangle size={16} className="text-red-500" />,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-blue-600 to-indigo-700">
              <button
                className="absolute top-4 right-4 p-1.5 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                onClick={onClose}
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <Eye size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Détails</p>
                  <h2 className="text-xl font-bold text-white">{title}</h2>
                </div>
              </div>
            </div>

            {/* Corps */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* En-tête avec statut */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6">
                <div>
                  <p className="text-xs text-gray-400">Référence</p>
                  <p className="text-lg font-bold text-gray-900">{data.reference || data.id}</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusColors[data.status as keyof typeof statusColors] || "bg-gray-50 text-gray-700"}`}>
                  {statusIcons[data.status as keyof typeof statusIcons] || <Info size={16} />}
                  <span className="text-sm font-medium">{data.status || "Inconnu"}</span>
                </div>
              </div>

              {/* Informations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <User size={16} className="text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Client</p>
                    <p className="font-medium text-gray-900">{data.client || "Non renseigné"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Mail size={16} className="text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="font-medium text-gray-900">{data.client_email || "Non renseigné"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone size={16} className="text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Téléphone</p>
                    <p className="font-medium text-gray-900">{data.client_phone || "Non renseigné"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <MapPin size={16} className="text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Trajet</p>
                    <p className="font-medium text-gray-900">{data.route || "Non renseigné"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar size={16} className="text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Date</p>
                    <p className="font-medium text-gray-900">{data.date || "Non renseigné"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <DollarSign size={16} className="text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Montant</p>
                    <p className="font-medium text-gray-900">{data.amount || "Non renseigné"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl md:col-span-2">
                  <Info size={16} className="text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Détails</p>
                    <p className="font-medium text-gray-900">{data.details || "Aucun détail supplémentaire"}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                <button
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/25"
                  onClick={onClose}
                >
                  <Check size={16} />
                  Fermer
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors"
                  onClick={() => { onClose(); toast.info("Modification en cours..."); }}
                >
                  <Edit size={16} />
                  Modifier
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ===== MODAL DE CONFIRMATION SUPPRESSION =====
function DeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  itemName: string;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Confirmer la suppression</h2>
              <p className="text-gray-500">
                Êtes-vous sûr de vouloir supprimer <strong className="text-gray-700">{itemName}</strong> ?
                Cette action est irréversible.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                  onClick={onClose}
                >
                  Annuler
                </button>
                <button
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-500/25"
                  onClick={onConfirm}
                >
                  <Trash2 size={16} className="inline mr-2" />
                  Supprimer
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ===== MODAL DE MODIFICATION =====
function EditModal({ 
  isOpen, 
  onClose, 
  onSave, 
  data,
  title 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: any) => void; 
  data: any;
  title: string;
}) {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (data) {
      setFormData({ ...data });
    }
  }, [data]);

  if (!isOpen || !data) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-amber-600 to-orange-700">
              <button
                className="absolute top-4 right-4 p-1.5 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                onClick={onClose}
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <Edit size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Modification</p>
                  <h2 className="text-xl font-bold text-white">{title}</h2>
                </div>
              </div>
            </div>

            {/* Corps */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Client</label>
                  <input
                    type="text"
                    value={formData.client || ""}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.client_email || ""}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Trajet</label>
                  <input
                    type="text"
                    value={formData.route || ""}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
                  <select
                    value={formData.status || "En attente"}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all"
                  >
                    <option value="En attente">En attente</option>
                    <option value="Confirmée">Confirmée</option>
                    <option value="Payée">Payée</option>
                    <option value="Annulée">Annulée</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant</label>
                  <input
                    type="text"
                    value={formData.amount || ""}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                    onClick={onClose}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-amber-500/25"
                  >
                    <Check size={16} className="inline mr-2" />
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ===== DATA TABLE AVEC ACTIONS =====
function DataTableWithActions({ 
  headers, 
  rows, 
  title,
  onView,
  onEdit,
  onDelete,
  onConfirm,
  onCancel,
}: { 
  headers: string[];
  rows: any[];
  title?: string;
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onConfirm?: (row: any) => void;
  onCancel?: (row: any) => void;
}) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Database size={24} className="text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">Aucune donnée</p>
        <p className="text-sm text-gray-400 mt-1">Aucun enregistrement trouvé</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {title && (
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          <span className="text-xs text-gray-400">{rows.length} éléments</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/80 border-b border-gray-100">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                className="hover:bg-blue-50/30 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rowIndex * 0.03 }}
              >
                {row.map((cell: any, cellIndex: number) => (
                  <td key={cellIndex} className="px-4 py-3 text-sm">
                    {cellIndex === 0 ? (
                      <span className="font-medium text-gray-900">{cell}</span>
                    ) : typeof cell === "string" && (cell === "En attente" || cell === "actif" || cell === "prevu") ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        {cell}
                      </span>
                    ) : typeof cell === "string" && (cell === "Confirmée" || cell === "paye") ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        {cell}
                      </span>
                    ) : typeof cell === "string" && cell === "Annulée" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        {cell}
                      </span>
                    ) : typeof cell === "string" && cell === "Payée" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        {cell}
                      </span>
                    ) : (
                      <span className="text-gray-600">{cell}</span>
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {onConfirm && String(row[row.length - 1]).toLowerCase().includes("attente") && (
                      <button
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        onClick={() => onConfirm(row)}
                        title="Confirmer la réservation"
                        type="button"
                      >
                        <Check size={14} />
                        Confirmer
                      </button>
                    )}
                    {onCancel && ["attente", "confirm"].some((status) => String(row[row.length - 1]).toLowerCase().includes(status)) && (
                      <button
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                        onClick={() => onCancel(row)}
                        title="Annuler la réservation"
                        type="button"
                      >
                        <X size={14} />
                        Annuler
                      </button>
                    )}
                    {onView && (
                      <button
                        className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => onView(row)}
                        title="Voir"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                        onClick={() => onEdit(row)}
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => onDelete(row)}
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminHeading({ eyebrow, title, description, action }: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-2">
          <span className="w-8 h-px bg-blue-300" />
          {eyebrow}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      {action}
    </motion.div>
  );
}

function SettingsCard({ icon: Icon, title, text }: { icon: typeof Settings; title: string; text: string }) {
  return (
    <motion.button
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-lg transition-all duration-300 text-left w-full flex items-center gap-4"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      type="button"
    >
      <div className="p-2.5 bg-gray-50 rounded-xl">
        <Icon size={18} className="text-gray-600" />
      </div>
      <div className="flex-1">
        <strong className="text-gray-900">{title}</strong>
        <p className="text-sm text-gray-500">{text}</p>
      </div>
      <ChevronRight size={16} className="text-gray-300" />
    </motion.button>
  );
}

// ===== PAGE PRINCIPALE =====
export default function AdminPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [isReady, setIsReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [adminRows, setAdminRows] = useState<AdminRows>({
    payments: [],
    fleet: [],
    infrastructure: [],
    people: [],
    pavilions: [],
  });
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    todayReservations: 0,
    revenue: "0 FC",
    activeClients: 0,
    plannedVoyages: 0,
    pendingPayments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // ===== MODALS STATE =====
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedRow, setSelectedRow] = useState<any>(null);

  // ===== VERIFICATION ADMIN =====
  useEffect(() => {
    async function verifyAdmin() {
      setIsLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          router.replace("/");
          return;
        }

        const response = await fetch("/api/admin/status", {
          headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        });

        if (!response.ok || !(await response.json()).isAdmin) {
          router.replace("/dashboard");
          return;
        }

        // Charger les réservations
        const { data, error } = await supabase
          .from("reservations")
          .select("id, date_reservation, type_reservation, statut, prix_total, voyage:voyages(code_voyage), client:client(nom, prenom, email, telephone)")
          .order("date_reservation", { ascending: false });

        if (error) {
          setNotice(`Impossible de charger les réservations : ${error.message}`);
        } else if (data) {
          setReservations(data.map((row: any) => ({
            id: row.id,
            reference: `KP-${String(row.id).padStart(4, "0")}`,
            client: [row.client?.prenom, row.client?.nom].filter(Boolean).join(" ") || "Client non renseigné",
            client_email: row.client?.email || "Non renseigné",
            client_phone: row.client?.telephone || "Non renseigné",
            route: row.voyage?.code_voyage || "Voyage non renseigné",
            date: new Date(row.date_reservation).toLocaleDateString("fr-FR"),
            amount: `${Number(row.prix_total || 0).toLocaleString("fr-FR")} FC`,
            status: row.statut === "confirme" ? "Confirmée" : row.statut === "arrive" ? "Payée" : row.statut === "annule" ? "Annulée" : "En attente",
            type: row.type_reservation,
            created_at: row.date_reservation,
            details: `Réservation ${row.type_reservation} pour le voyage ${row.voyage?.code_voyage || ""}`,
          })));
        }

        // Charger les autres données
        const [paymentsResult, boatsResult, portsResult, docksResult, clientsResult, voyagesResult, pavilionsResult] = await Promise.all([
          supabase.from("paiements").select("id, montant, devise, mode_paiement, date_paiement, statut"),
          supabase.from("bateaux").select("id, nom, immatriculation, type, capacite_totale, statut"),
          supabase.from("ports").select("id, nom, localisation, ville, statut"),
          supabase.from("quais").select("id, nom, numero, type_quai, statut, capacite"),
          supabase.from("client").select("id, nom, prenom, email, telephone, statut, date_inscription"),
          supabase.from("voyages").select("id, code_voyage, description, idbateau, statut, date_depart"),
          supabase.from("pavillons").select("id, nom, classe, capacite_max, unite, prix_unitaire, prix_tonne, devise, bateau:bateaux(nom)"),
        ]);

        // Métriques
        const paymentRecords = (paymentsResult.data || []) as any[];
        const clientRecords = (clientsResult.data || []) as any[];
        const voyageRecords = (voyagesResult.data || []) as any[];
        const paidAmount = paymentRecords.filter((row) => row.statut === "paye").reduce((total, row) => total + Number(row.montant || 0), 0);
        const today = new Date().toDateString();

        setMetrics({
          todayReservations: (data || []).filter((row: any) => new Date(row.date_reservation).toDateString() === today).length,
          revenue: `${paidAmount.toLocaleString("fr-FR")} FC`,
          activeClients: clientRecords.filter((row) => row.statut === "actif").length,
          plannedVoyages: voyageRecords.filter((row) => row.statut === "prevu").length,
          pendingPayments: paymentRecords.filter((row) => row.statut === "en_attente").length,
        });

        setAdminRows({
          payments: (paymentsResult.data || []).map((row: any) => [
            `PAY-${row.id}`,
            String(row.mode_paiement || "-"),
            row.date_paiement ? new Date(row.date_paiement).toLocaleDateString("fr-FR") : "-",
            `${Number(row.montant || 0).toLocaleString("fr-FR")} ${row.devise || ""}`,
            String(row.statut || "-"),
          ]),
          fleet: (boatsResult.data || []).map((row: any) => [
            String(row.nom || "-"),
            String(row.immatriculation || "-"),
            String(row.type || "-"),
            String(row.capacite_totale || "-"),
            String(row.statut || "-"),
          ]),
          infrastructure: [
            ...(portsResult.data || []).map((row: any) => [
              "Port",
              String(row.nom || "-"),
              `${row.ville || row.localisation || "-"}`,
              String(row.statut || "-"),
            ]),
            ...(docksResult.data || []).map((row: any) => [
              "Quai",
              String(row.nom || `N°${row.numero || "-"}`),
              `Capacité ${row.capacite || "-"}`,
              String(row.statut || "-"),
            ]),
          ],
          people: (clientsResult.data || []).map((row: any) => [
            `${row.prenom || ""} ${row.nom || ""}`.trim() || "-",
            String(row.email || "-"),
            String(row.telephone || "-"),
            row.date_inscription ? new Date(row.date_inscription).toLocaleDateString("fr-FR") : "-",
            String(row.statut || "-"),
          ]),
          pavilions: (pavilionsResult.data || []).map((row: any) => [
            String(row.nom || "-"),
            String(row.bateau?.nom || "-"),
            String(row.classe || "-"),
            `${row.capacite_max || 0} ${row.unite || ""}`,
            `${row.prix_unitaire || 0} ${row.devise || "FC"}`,
          ]),
        });

        setIsReady(true);
      } catch (error) {
        console.error("Erreur:", error);
        setNotice("Une erreur est survenue lors du chargement.");
      } finally {
        setIsLoading(false);
      }
    }

    verifyAdmin();
  }, [router, reloadKey]);

  // ===== NOTIFICATIONS =====
  useEffect(() => {
    if (!notice) return;
    const lowerNotice = notice.toLowerCase();
    if (lowerNotice.includes("échoué") || lowerNotice.includes("impossible") || lowerNotice.includes("erreur")) {
      toast.error(notice);
    } else {
      toast.success(notice);
    }
  }, [notice]);

  // ===== FILTRES =====
  const filteredReservations = useMemo(() => {
    return reservations.filter((row) =>
      `${row.id} ${row.client} ${row.route}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, reservations]);

  const pendingReservations = reservations.filter((row) => row.status === "En attente").length;

  // ===== ACTIONS =====
  async function confirmReservation(id: number) {
    const { error } = await supabase.rpc("transition_kivuport_reservation", {
      p_reservation_id: id,
      p_to_status: "confirme",
      p_reason: "admin_confirmation",
    });
    if (error) return setNotice(`La confirmation a échoué : ${error.message}`);
    setReservations((current) =>
      current.map((row) => (row.id === id ? { ...row, status: "Confirmée" } : row))
    );
    setNotice(`Réservation KP-${String(id).padStart(4, "0")} confirmée.`);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) return;

    try {
      const response = await fetch(`/api/admin/reservations/${id}/confirmation`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        setNotice(`Réservation confirmée, mais l'email n'a pas pu partir : ${result?.error || "erreur inconnue"}`);
        return;
      }
      setNotice(`Réservation KP-${String(id).padStart(4, "0")} confirmée et email envoyé.`);
    } catch {
      setNotice(`Réservation confirmée, mais l'email n'a pas pu partir.`);
    }
  }

  async function cancelReservation(id: number) {
    if (!window.confirm(`Annuler la réservation KP-${String(id).padStart(4, "0")} ?`)) return;
    const { error } = await supabase.rpc("transition_kivuport_reservation", {
      p_reservation_id: id,
      p_to_status: "annule",
      p_reason: "admin_cancellation",
    });
    if (error) return setNotice(`L'annulation a échoué : ${error.message}`);
    setReservations((current) =>
      current.map((row) => (row.id === id ? { ...row, status: "Annulée" } : row))
    );
    setNotice(`La réservation KP-${String(id).padStart(4, "0")} a été annulée.`);
  }

  function confirmReservationRow(row: string[]) {
    const reservation = reservations.find((item) => item.reference === String(row[0]));
    if (reservation) void confirmReservation(reservation.id);
  }

  function cancelReservationRow(row: string[]) {
    const reservation = reservations.find((item) => item.reference === String(row[0]));
    if (reservation) void cancelReservation(reservation.id);
  }

  function formatExport(rows: AdminReservation[]) {
    const csv = [
      "Référence,Client,Trajet,Date,Montant,Statut,Type",
      ...rows.map((row) =>
        [row.id, row.client, row.route, row.date, row.amount, row.status, row.type]
          .map((value) => `"${value}"`)
          .join(",")
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "kivuport-reservations.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  // ===== GESTION DES MODALS =====
  const handleView = (row: any) => {
    // Trouver la réservation complète
    const fullData = reservations.find(r => r.reference === row[0] || String(r.id) === row[0]);
    if (fullData) {
      setSelectedItem(fullData);
      setViewModalOpen(true);
    } else {
      // Créer un objet à partir de la ligne
      setSelectedItem({
        reference: row[0],
        client: row[1],
        route: row[2],
        date: row[3],
        amount: row[4],
        status: row[5],
        details: "Détails disponibles sur la réservation complète.",
      });
      setViewModalOpen(true);
    }
  };

  const handleDelete = (row: any) => {
    const fullData = reservations.find(r => r.reference === row[0] || String(r.id) === row[0]);
    setSelectedItem(fullData || { reference: row[0], client: row[1] });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedItem) {
      try {
        const { error } = await supabase
          .from("reservations")
          .delete()
          .eq("id", selectedItem.id);
        
        if (error) {
          toast.error(`Erreur lors de la suppression : ${error.message}`);
        } else {
          setReservations(prev => prev.filter(r => r.id !== selectedItem.id));
          toast.success(`Réservation ${selectedItem.reference} supprimée.`);
          setDeleteModalOpen(false);
          setSelectedItem(null);
          setReloadKey(prev => prev + 1);
        }
      } catch (err) {
        toast.error("Une erreur est survenue lors de la suppression.");
      }
    }
  };

  const handleEditSave = async (formData: any) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({
          statut: formData.status === "En attente" ? "en_attente" :
                  formData.status === "Confirmée" ? "confirme" :
                  formData.status === "Payée" ? "arrive" : "annule",
        })
        .eq("id", selectedItem.id);
      
      if (error) {
        toast.error(`Erreur lors de la modification : ${error.message}`);
      } else {
        setReservations(prev => prev.map(r => 
          r.id === selectedItem.id ? { ...r, ...formData } : r
        ));
        toast.success(`Réservation ${selectedItem.reference} modifiée.`);
        setEditModalOpen(false);
        setSelectedItem(null);
        setReloadKey(prev => prev + 1);
      }
    } catch (err) {
      toast.error("Une erreur est survenue lors de la modification.");
    }
  };

  // ===== RENDU =====
  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="relative"
        >
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield size={20} className="text-blue-600" />
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-gray-500 font-medium"
        >
          Chargement de l&apos;espace administrateur...
        </motion.p>
      </div>
    );
  }

  const activeNavigation = navigation.find((item) => item.id === section);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== SIDEBAR ===== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 shadow-xl transform transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-gray-100">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/25">
                <Ship size={18} />
              </div>
              <span className="font-bold text-lg text-gray-900">KivuPort</span>
              <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                ADMIN
              </span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
              Navigation
            </p>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = section === item.id;
                return (
                  <button
                    key={item.id}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    type="button"
                    onClick={() => {
                      setSection(item.id);
                      setIsSidebarOpen(false);
                    }}
                  >
                    <Icon size={17} className={isActive ? "text-blue-600" : "text-gray-400"} />
                    {item.label}
                    {item.id === "reservations" && pendingReservations > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {pendingReservations}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-gray-100">
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              type="button"
              onClick={logout}
            >
              <LogOut size={17} />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                type="button"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={20} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Administration</span>
                <ChevronRight size={14} className="text-gray-300" />
                <strong className="text-gray-900">{activeNavigation?.label}</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
              >
                <RefreshCw size={17} />
              </button>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 relative"
                type="button"
              >
                <Bell size={18} />
                {pendingReservations > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                    {pendingReservations > 9 ? "9+" : pendingReservations}
                  </span>
                ) : (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {section === "overview" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <AdminHeading
                eyebrow={new Date().toLocaleDateString("fr-FR", { dateStyle: "long" })}
                title="Bonjour, administrateur."
                description="Voici les données actuelles de votre base Supabase."
                action={
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/25"
                    type="button"
                    onClick={() => setSection("reservations")}
                  >
                    <Anchor size={16} />
                    Voir les opérations
                  </button>
                }
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard label="Réservations du jour" value={metrics.todayReservations} icon={Anchor} color="blue" />
                <StatCard label="Chiffre d'affaires" value={metrics.revenue} icon={CircleDollarSign} color="emerald" />
                <StatCard label="Clients actifs" value={metrics.activeClients} icon={Users} color="amber" />
                <StatCard label="Voyages planifiés" value={metrics.plannedVoyages} icon={Ship} color="purple" />
                <StatCard label="Paiements en attente" value={metrics.pendingPayments} icon={Activity} color="pink" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Activité enregistrée</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold text-blue-600">
                      {metrics.todayReservations + pendingReservations}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {metrics.todayReservations} aujourd&apos;hui
                      </p>
                      <p className="text-sm text-gray-500">
                        {pendingReservations} en attente
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Actions rapides</h3>
                  <div className="space-y-2">
                    <button
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left text-sm"
                      type="button"
                      onClick={() => setSection("reservations")}
                    >
                      <div className="p-1.5 bg-amber-100 rounded-lg">
                        <Anchor size={14} className="text-amber-600" />
                      </div>
                      <span className="font-medium text-gray-700">{pendingReservations} réservation(s) en attente</span>
                      <ChevronRight size={14} className="ml-auto text-gray-400" />
                    </button>
                    <button
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left text-sm"
                      type="button"
                      onClick={() => setSection("payments")}
                    >
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <CircleDollarSign size={14} className="text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-700">{metrics.pendingPayments} paiement(s) en attente</span>
                      <ChevronRight size={14} className="ml-auto text-gray-400" />
                    </button>
                    <button
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left text-sm"
                      type="button"
                      onClick={() => setSection("fleet")}
                    >
                      <div className="p-1.5 bg-purple-100 rounded-lg">
                        <Ship size={14} className="text-purple-600" />
                      </div>
                      <span className="font-medium text-gray-700">{metrics.plannedVoyages} voyage(s) planifié(s)</span>
                      <ChevronRight size={14} className="ml-auto text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {section === "reservations" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <AdminHeading
                eyebrow="Opérations · Supabase"
                title="Réservations"
                description="Données chargées directement depuis la table reservations."
                action={
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
                    type="button"
                    onClick={() => formatExport(filteredReservations)}
                  >
                    <Download size={16} />
                    Exporter CSV
                  </button>
                }
              />

              <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                <div className="flex-1 min-w-[180px]">
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Rechercher une réservation..."
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-sm text-gray-600">
                  <Filter size={14} />
                  Filtres
                </button>
                <span className="text-xs text-gray-400">{filteredReservations.length} résultats</span>
              </div>

              <DataTableWithActions
                headers={["Référence", "Client", "Trajet", "Date", "Montant", "Statut"]}
                rows={filteredReservations.map((row) => [
                  row.reference,
                  row.client,
                  row.route,
                  row.date,
                  row.amount,
                  row.status,
                ])}
                onView={handleView}
                onDelete={handleDelete}
                onConfirm={confirmReservationRow}
                onCancel={cancelReservationRow}
              />
            </motion.div>
          )}

          {section === "payments" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <AdminHeading
                eyebrow="Finance · Supabase"
                title="Paiements"
                description="Paiements chargés directement depuis la table paiements."
                action={
                  <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors">
                    <Download size={16} />
                    Rapport financier
                  </button>
                }
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard label="Paiements reçus" value={adminRows.payments.length - metrics.pendingPayments} icon={Check} color="emerald" />
                <StatCard label="En attente" value={metrics.pendingPayments} icon={Activity} color="amber" />
                <StatCard label="Montant encaissé" value={metrics.revenue} icon={CircleDollarSign} color="blue" />
              </div>
              <DataTableWithActions
                headers={["Référence", "Mode", "Date", "Montant", "Statut"]}
                rows={adminRows.payments}
              />
            </motion.div>
          )}

          {section === "fleet" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <AdminHeading
                eyebrow="Opérations · Supabase"
                title="Flotte & voyages"
                description="Bateaux et départs publiés depuis Supabase."
                action={
                  <div className="flex flex-wrap gap-2">
                    <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors" type="button">
                      <Plus size={16} />
                      Publier un voyage
                    </button>
                    <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors" type="button">
                      <Plus size={16} />
                      Ajouter un bateau
                    </button>
                  </div>
                }
              />
              <DataTableWithActions
                headers={["Bateau", "Immatriculation", "Type", "Capacité", "Statut"]}
                rows={adminRows.fleet}
              />
            </motion.div>
          )}

          {section === "pavilions" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <AdminHeading
                eyebrow="Tarifs · Supabase"
                title="Pavillons"
                description="Capacités et tarifs rattachés aux bateaux."
                action={
                  <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-xl transition-colors" type="button">
                    <Plus size={16} />
                    Ajouter un pavillon
                  </button>
                }
              />
              <DataTableWithActions
                headers={["Nom", "Bateau", "Classe", "Capacité", "Prix"]}
                rows={adminRows.pavilions}
              />
            </motion.div>
          )}

          {section === "infrastructure" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <AdminHeading
                eyebrow="Référentiel · Supabase"
                title="Ports & quais"
                description="Ports et quais chargés directement depuis Supabase."
                action={
                  <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors" type="button">
                    <Plus size={16} />
                    Ajouter un port
                  </button>
                }
              />
              <DataTableWithActions
                headers={["Type", "Nom", "Détail", "Statut"]}
                rows={adminRows.infrastructure}
              />
            </motion.div>
          )}

          {section === "people" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <AdminHeading
                eyebrow="Utilisateurs · Supabase"
                title="Clients & équipe"
                description="Clients chargés directement depuis la table client."
                action={
                  <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors" type="button">
                    <Plus size={16} />
                    Ajouter un client
                  </button>
                }
              />
              <DataTableWithActions
                headers={["Nom", "Email", "Téléphone", "Inscription", "Statut"]}
                rows={adminRows.people}
              />
            </motion.div>
          )}

          {section === "settings" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <AdminHeading
                eyebrow="Configuration"
                title="Paramètres"
                description="Configurez les règles opérationnelles de KivuPort."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsCard icon={Settings} title="Général" text="Nom du service, coordonnées et devise par défaut." />
                <SettingsCard icon={Bell} title="Notifications" text="Emails de réservation, paiement et alertes opérationnelles." />
                <SettingsCard icon={SlidersHorizontal} title="Sécurité" text="Sessions, vérification email et permissions d'équipe." />
                <SettingsCard icon={BarChart3} title="Apparence" text="Thème, marque et préférences de l'interface." />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ===== MODALS ===== */}
      <ViewModal
        isOpen={viewModalOpen}
        onClose={() => { setViewModalOpen(false); setSelectedItem(null); }}
        data={selectedItem}
        title="Détails de la réservation"
      />

      <EditModal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedItem(null); }}
        onSave={handleEditSave}
        data={selectedItem}
        title="Modifier la réservation"
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setSelectedItem(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={selectedItem?.reference || selectedItem?.client || "cet élément"}
      />
    </div>
  );
}
