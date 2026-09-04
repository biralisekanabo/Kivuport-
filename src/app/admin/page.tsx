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
  Loader2,
  Briefcase,
  Anchor as AnchorIcon,
  Warehouse,
  UserPlus,
  Sailboat,
  CreditCard,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Gem,
  Waves,
  Compass,
  Sun,
  Moon,
  FileText,
  UserCog,
  History,
  Moon as DarkModeIcon,
  CheckCheck,
  XCircle,
  KeyRound,
  ChartPie,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Pie, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

type Section = "overview" | "reservations" | "payments" | "fleet" | "pavilions" | "infrastructure" | "people" | "settings" | "logs";
type ReservationStatus = "En attente" | "Confirmée" | "Payée" | "Annulée";
type FilterStatus = "tous" | "en_attente" | "confirmee" | "payee" | "annulee";
type FilterPeriod = "tous" | "aujourdhui" | "semaine" | "mois";

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
  { id: "logs", label: "Historique", icon: History, color: "cyan" },
];

type AdminRows = { 
  payments: any[][]; 
  fleet: any[][]; 
  infrastructure: any[][]; 
  people: any[][]; 
  pavilions: any[][];
  voyages: any[][];
  docks: any[][];
  ports: any[][];
  clients: any[][];
  boats: any[][];
};
type AdminMetrics = { 
  todayReservations: number; 
  revenue: string; 
  activeClients: number; 
  plannedVoyages: number; 
  pendingPayments: number;
  totalReservations: number;
  totalRevenue: number;
};

// ===== COMPOSANTS =====

function StatCard({ label, value, icon: Icon, color, loading, trend, delay = 0 }: {
  label: string;
  value: string | number;
  icon: any;
  color?: "blue" | "emerald" | "amber" | "purple" | "pink" | "indigo" | "teal";
  loading?: boolean;
  trend?: { value: number; positive: boolean };
  delay?: number;
}) {
  const colors = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", light: "text-blue-400", hover: "hover:border-blue-200" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", light: "text-emerald-400", hover: "hover:border-emerald-200" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", light: "text-amber-400", hover: "hover:border-amber-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100", light: "text-purple-400", hover: "hover:border-purple-200" },
    pink: { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-100", light: "text-pink-400", hover: "hover:border-pink-200" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", light: "text-indigo-400", hover: "hover:border-indigo-200" },
    teal: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-100", light: "text-teal-400", hover: "hover:border-teal-200" },
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
      className={`bg-white dark:bg-gray-900 rounded-2xl border ${c.border} dark:border-gray-800 p-5 shadow-sm hover:shadow-xl ${c.hover} transition-all duration-300 cursor-default`}
      whileHover={{ y: -4, scale: 1.01 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <div className="flex items-center justify-between mb-3">
        <motion.div 
          className={`p-2.5 ${c.bg} rounded-xl`}
          whileHover={{ rotate: 10, scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Icon size={18} className={c.text} />
        </motion.div>
        {trend && (
          <motion.span 
            className={`text-xs font-medium flex items-center gap-1 ${trend.positive ? "text-emerald-600" : "text-red-600"}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend.value)}%
          </motion.span>
        )}
      </div>
      <motion.p 
        className="text-2xl font-bold text-gray-900 dark:text-white"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {value}
      </motion.p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </motion.div>
  );
}

// ===== COMPOSANT DE PAGINATION =====
function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  totalItems,
  itemsPerPage
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Affichage de <span className="font-medium">{startItem}</span> à{' '}
        <span className="font-medium">{endItem}</span> sur{' '}
        <span className="font-medium">{totalItems}</span> éléments
      </div>
      <div className="flex items-center gap-1">
        <motion.button
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft size={16} />
        </motion.button>
        <motion.button
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} />
        </motion.button>
        
        <div className="flex items-center gap-1 px-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <motion.button
                key={pageNum}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </motion.button>
            );
          })}
        </div>

        <motion.button
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={16} />
        </motion.button>
        <motion.button
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight size={16} />
        </motion.button>
      </div>
    </div>
  );
}

// ===== MODAL D'AJOUT =====
function AddModal({ 
  isOpen, 
  onClose, 
  onSave, 
  title,
  fields,
  icon: Icon,
  isSaving = false,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: any) => void; 
  title: string;
  fields: { id: string; label: string; type: string; placeholder?: string; options?: string[]; required?: boolean; min?: number; max?: number }[];
  icon: any;
  isSaving?: boolean;
}) {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const initialData: any = {};
      fields.forEach(field => {
        initialData[field.id] = field.type === 'select' && field.options ? field.options[0] : '';
      });
      setFormData(initialData);
      setErrors({});
    }
  }, [isOpen, fields]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      const value = formData[field.id] || '';
      
      if (field.required && !value) {
        newErrors[field.id] = 'Ce champ est requis';
      }
      
      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[field.id] = 'Email invalide';
      }
      
      if (field.type === 'number' && value && isNaN(parseFloat(value))) {
        newErrors[field.id] = 'Doit être un nombre valide';
      }
      
      if (field.type === 'number' && value && field.min !== undefined && parseFloat(value) < field.min) {
        newErrors[field.id] = `Doit être supérieur à ${field.min}`;
      }
      
      if (field.type === 'number' && value && field.max !== undefined && parseFloat(value) > field.max) {
        newErrors[field.id] = `Doit être inférieur à ${field.max}`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
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
            className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-emerald-600 to-teal-700">
              <button
                className="absolute top-4 right-4 p-1.5 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                onClick={onClose}
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <Icon size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Nouveau</p>
                  <h2 className="text-xl font-bold text-white">{title}</h2>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleSubmit} className="space-y-4">
                {fields.map((field, index) => (
                  <motion.div 
                    key={field.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'select' && field.options ? (
                      <select
                        value={formData[field.id] || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, [field.id]: e.target.value });
                          if (errors[field.id]) setErrors({ ...errors, [field.id]: '' });
                        }}
                        className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-400 outline-none transition-all ${
                          errors[field.id] ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'datetime-local' ? (
                      <input
                        type="datetime-local"
                        value={formData[field.id] || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, [field.id]: e.target.value });
                          if (errors[field.id]) setErrors({ ...errors, [field.id]: '' });
                        }}
                        className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-400 outline-none transition-all ${
                          errors[field.id] ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      />
                    ) : (
                      <input
                        type={field.type}
                        placeholder={field.placeholder || ''}
                        value={formData[field.id] || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, [field.id]: e.target.value });
                          if (errors[field.id]) setErrors({ ...errors, [field.id]: '' });
                        }}
                        className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-400 outline-none transition-all ${
                          errors[field.id] ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      />
                    )}
                    {errors[field.id] && (
                      <p className="mt-1 text-xs text-red-500">{errors[field.id]}</p>
                    )}
                  </motion.div>
                ))}
                
                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="button"
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    disabled={isSaving}
                  >
                    Annuler
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Plus size={16} />
                    )}
                    {isSaving ? "Ajout..." : "Ajouter"}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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

  const statusIcons: Record<string, any> = {
    "En attente": <Clock size={16} className="text-amber-500" />,
    "Confirmée": <CheckCircle size={16} className="text-emerald-500" />,
    "Payée": <DollarSign size={16} className="text-blue-500" />,
    "Annulée": <AlertTriangle size={16} className="text-red-500" />,
  };

  const isBoat = data.immatriculation !== undefined;
  const isVoyage = data.code_voyage !== undefined;
  const isPavilion = data.classe !== undefined;
  const isPort = data.localisation !== undefined && data.ville !== undefined;
  const isDock = data.type_quai !== undefined;
  const isClient = data.nom !== undefined && data.email !== undefined && data.client_type === undefined && data.immatriculation === undefined && data.code_voyage === undefined;
  const isReservation = data.reference !== undefined || data.client !== undefined;

  const relationRow = (icon: any, label: string, value: any, span = false) => (
    <div className={`flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl ${span ? "md:col-span-2" : ""}`}>
      <span className="text-blue-500 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
        <p className="font-medium text-gray-900 dark:text-gray-100">{value || "Non renseigné"}</p>
      </div>
    </div>
  );

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
            className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
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

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-6">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Référence</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{data.reference || data.code_voyage || data.nom || data.id}</p>
                </div>
                {data.status || data.statut ? (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusColors[(data.status || data.statut) as keyof typeof statusColors] || "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>
                    {statusIcons[data.status || data.statut] || <Info size={16} />}
                    <span className="text-sm font-medium capitalize">{data.status || data.statut || "Inconnu"}</span>
                  </div>
                ) : null}
              </div>

              {isBoat && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relationRow(<Ship size={16} />, "Nom du bateau", data.nom, true)}
                  {relationRow(<KeyRound size={16} />, "Immatriculation", data.immatriculation)}
                  {relationRow(<Zap size={16} />, "Type", data.type)}
                  {relationRow(<Users size={16} />, "Capacité totale", data.capacite_totale)}
                  {relationRow(<User size={16} />, "Capacité passagers", data.capacite_passager)}
                  {relationRow(<Warehouse size={16} />, "Capacité cargaison", data.capacite_cargaison)}
                  {relationRow(<Activity size={16} />, "Statut", data.statut)}
                </div>
              )}

              {isVoyage && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relationRow(<Ticket size={16} />, "Code voyage", data.code_voyage, true)}
                  {relationRow(<Ship size={16} />, "Bateau associé", data.bateau?.nom || "Non renseigné")}
                  {relationRow(<Info size={16} />, "Description", data.description)}
                  {relationRow(<Calendar size={16} />, "Date de départ", data.date_depart ? new Date(data.date_depart).toLocaleString("fr-FR") : "Non renseigné")}
                  {relationRow(<Activity size={16} />, "Statut", data.statut)}
                </div>
              )}

              {isPavilion && !isVoyage && !isBoat && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relationRow(<Ticket size={16} />, "Nom", data.nom, true)}
                  {relationRow(<Ship size={16} />, "Bateau", data.bateau?.nom || "Non renseigné")}
                  {relationRow(<Gem size={16} />, "Classe", data.classe)}
                  {relationRow(<Users size={16} />, "Capacité max", `${data.capacite_max} ${data.unite || ""}`)}
                  {relationRow(<DollarSign size={16} />, "Prix unitaire", `${data.prix_unitaire} ${data.devise || "FC"}`)}
                  {relationRow(<DollarSign size={16} />, "Prix à la tonne", data.prix_tonne ? `${data.prix_tonne} ${data.devise || "FC"}` : "N/A")}
                </div>
              )}

              {(isPort || (data.localisation !== undefined && !isBoat && !isVoyage && !isPavilion)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relationRow(<Warehouse size={16} />, "Nom du port", data.nom, true)}
                  {relationRow(<MapPin size={16} />, "Ville", data.ville)}
                  {relationRow(<Compass size={16} />, "Localisation", data.localisation)}
                  {relationRow(<Activity size={16} />, "Statut", data.statut)}
                </div>
              )}

              {isDock && !isPort && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relationRow(<AnchorIcon size={16} />, "Nom du quai", data.nom, true)}
                  {relationRow(<Warehouse size={16} />, "Port", data.port?.nom || "Non renseigné")}
                  {relationRow(<KeyRound size={16} />, "Numéro", data.numero)}
                  {relationRow(<Users size={16} />, "Capacité", data.capacite)}
                  {relationRow(<Zap size={16} />, "Type", data.type_quai)}
                  {relationRow(<Activity size={16} />, "Statut", data.statut)}
                </div>
              )}

              {isClient && !isBoat && !isVoyage && !isPavilion && !isDock && !isPort && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relationRow(<UserRound size={16} />, "Nom complet", `${data.prenom || ""} ${data.nom || ""}`.trim(), true)}
                  {relationRow(<Mail size={16} />, "Email", data.email)}
                  {relationRow(<Phone size={16} />, "Téléphone", data.telephone)}
                  {relationRow(<MapPin size={16} />, "Adresse", data.adresse)}
                  {relationRow(<Gauge size={16} />, "Nationalité", data.nationalite)}
                  {relationRow(<CalendarDays size={16} />, "Inscription", data.date_inscription ? new Date(data.date_inscription).toLocaleDateString("fr-FR") : "Non renseigné")}
                  {relationRow(<Activity size={16} />, "Statut", data.statut)}
                </div>
              )}

              {isReservation && !isBoat && !isVoyage && !isPavilion && !isDock && !isPort && !isClient && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {relationRow(<User size={16} />, "Client", data.client || "Non renseigné")}
                    {relationRow(<Mail size={16} />, "Email", data.client_email || "Non renseigné")}
                    {relationRow(<Phone size={16} />, "Téléphone", data.client_phone || "Non renseigné")}
                    {relationRow(<Ship size={16} />, "Voyage (bateau)", data.route || data.pavilion?.bateau?.nom || "Non renseigné")}
                    {relationRow(<MapPin size={16} />, "Trajet", data.route || "Non renseigné")}
                    {relationRow(<Calendar size={16} />, "Date", data.date || "Non renseigné")}
                    {relationRow(<DollarSign size={16} />, "Montant", data.amount || "Non renseigné")}
                  </div>
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    {relationRow(<Info size={16} />, "Détails", data.details || "Aucun détail supplémentaire", true)}
                  </div>
                </>
              )}

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-3">
                <motion.button
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/25"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                >
                  <Check size={16} />
                  Fermer
                </motion.button>
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
  itemName,
  isDeleting = false,
  warning,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  itemName: string;
  isDeleting?: boolean;
  warning?: string;
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
            className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="p-6 text-center">
              <motion.div 
                className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <AlertTriangle size={28} className="text-red-600" />
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirmer la suppression</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Êtes-vous sûr de vouloir supprimer <strong className="text-gray-700 dark:text-gray-200">{itemName}</strong> ?
                Cette action est irréversible.
              </p>
              {warning && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                  {warning}
                </p>
              )}
              <div className="mt-6 flex gap-3">
                <motion.button
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  disabled={isDeleting}
                >
                  Annuler
                </motion.button>
                <motion.button
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </motion.button>
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
  title,
  fields,
  isSaving = false,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: any) => void; 
  data: any;
  title: string;
  fields: { id: string; label: string; type: string; placeholder?: string; options?: string[]; required?: boolean }[];
  isSaving?: boolean;
}) {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      setFormData({ ...data });
    }
  }, [data]);

  if (!isOpen || !data) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      const value = formData[field.id];
      if (field.required && (value === undefined || value === null || value === '')) {
        newErrors[field.id] = 'Ce champ est requis';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
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
            className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
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

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleSubmit} className="space-y-4">
                {fields.map((field, index) => (
                  <motion.div 
                    key={field.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'select' && field.options ? (
                      <select
                        value={formData[field.id] || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, [field.id]: e.target.value });
                          if (errors[field.id]) setErrors({ ...errors, [field.id]: '' });
                        }}
                        className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:bg-white focus:border-amber-400 outline-none transition-all ${
                          errors[field.id] ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'datetime-local' ? (
                      <input
                        type="datetime-local"
                        value={formData[field.id] || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, [field.id]: e.target.value });
                          if (errors[field.id]) setErrors({ ...errors, [field.id]: '' });
                        }}
                        className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:bg-white focus:border-amber-400 outline-none transition-all ${
                          errors[field.id] ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      />
                    ) : (
                      <input
                        type={field.type}
                        placeholder={field.placeholder || ''}
                        value={formData[field.id] ?? ''}
                        onChange={(e) => {
                          setFormData({ ...formData, [field.id]: e.target.value });
                          if (errors[field.id]) setErrors({ ...errors, [field.id]: '' });
                        }}
                        className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:bg-white focus:border-amber-400 outline-none transition-all ${
                          errors[field.id] ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      />
                    )}
                    {errors[field.id] && (
                      <p className="mt-1 text-xs text-red-500">{errors[field.id]}</p>
                    )}
                  </motion.div>
                ))}
                
                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="button"
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    disabled={isSaving}
                  >
                    Annuler
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    {isSaving ? "Enregistrement..." : "Enregistrer"}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ===== MODAL D'ÉDITION CLIENT =====
function EditClientModal({ 
  isOpen, 
  onClose, 
  onSave, 
  data,
  isSaving = false,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: any) => void; 
  data: any;
  isSaving?: boolean;
}) {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data && isOpen) {
      setFormData({
        nom: data.nom || "",
        prenom: data.prenom || "",
        email: data.email || "",
        telephone: data.telephone || "",
        adresse: data.adresse || "",
        nationalite: data.nationalite || "",
        genre: data.genre || null,
        statut: data.statut || "actif",
      });
      setErrors({});
    }
  }, [data, isOpen]);

  if (!isOpen || !data) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nom) newErrors.nom = "Le nom est requis";
    if (!formData.prenom) newErrors.prenom = "Le prénom est requis";
    if (!formData.email) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    if (!formData.telephone) newErrors.telephone = "Le téléphone est requis";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
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
            className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-teal-600 to-cyan-700">
              <button
                className="absolute top-4 right-4 p-1.5 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                onClick={onClose}
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <UserPlus size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Modification</p>
                  <h2 className="text-xl font-bold text-white">Modifier le client</h2>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom *</label>
                    <input
                      type="text"
                      value={formData.nom || ""}
                      onChange={(e) => {
                        setFormData({ ...formData, nom: e.target.value });
                        if (errors.nom) setErrors({ ...errors, nom: "" });
                      }}
                      className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:bg-white focus:border-teal-400 outline-none transition-all ${
                        errors.nom ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    />
                    {errors.nom && <p className="mt-1 text-xs text-red-500">{errors.nom}</p>}
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prénom *</label>
                    <input
                      type="text"
                      value={formData.prenom || ""}
                      onChange={(e) => {
                        setFormData({ ...formData, prenom: e.target.value });
                        if (errors.prenom) setErrors({ ...errors, prenom: "" });
                      }}
                      className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:bg-white focus:border-teal-400 outline-none transition-all ${
                        errors.prenom ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    />
                    {errors.prenom && <p className="mt-1 text-xs text-red-500">{errors.prenom}</p>}
                  </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                    className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:bg-white focus:border-teal-400 outline-none transition-all ${
                      errors.email ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Téléphone *</label>
                  <input
                    type="text"
                    value={formData.telephone || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, telephone: e.target.value });
                      if (errors.telephone) setErrors({ ...errors, telephone: "" });
                    }}
                    className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:bg-white focus:border-teal-400 outline-none transition-all ${
                      errors.telephone ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  />
                  {errors.telephone && <p className="mt-1 text-xs text-red-500">{errors.telephone}</p>}
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Adresse</label>
                  <input
                    type="text"
                    value={formData.adresse || ""}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:bg-white focus:border-teal-400 outline-none transition-all"
                  />
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nationalité</label>
                  <input
                    type="text"
                    value={formData.nationalite || ""}
                    onChange={(e) => setFormData({ ...formData, nationalite: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:bg-white focus:border-teal-400 outline-none transition-all"
                  />
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Genre</label>
                  <select
                    value={formData.genre || ""}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value || null })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:bg-white focus:border-teal-400 outline-none transition-all"
                  >
                    <option value="">Non spécifié</option>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                    <option value="Autre">Autre</option>
                  </select>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Statut</label>
                  <select
                    value={formData.statut || "actif"}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:bg-white focus:border-teal-400 outline-none transition-all"
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </motion.div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="button"
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    disabled={isSaving}
                  >
                    Annuler
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    {isSaving ? "Enregistrement..." : "Enregistrer"}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ===== MODAL DE SUPPRESSION CLIENT =====
function DeleteClientModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  clientName,
  isDeleting = false,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  clientName: string;
  isDeleting?: boolean;
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
            className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="p-6 text-center">
              <motion.div 
                className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <AlertTriangle size={28} className="text-red-600" />
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirmer la suppression</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Êtes-vous sûr de vouloir supprimer le client <strong className="text-gray-700 dark:text-gray-200">{clientName}</strong> ?
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                ⚠️ Cette action est irréversible. Le client ne doit avoir aucune réservation.
              </p>
              <div className="mt-6 flex gap-3">
                <motion.button
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  disabled={isDeleting}
                >
                  Annuler
                </motion.button>
                <motion.button
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </motion.button>
              </div>
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
  actions = true,
  loading = false,
  hideActions = false,
  selectable = false,
  selectedIds,
  onToggleSelect,
  idOf,
}: { 
  headers: string[];
  rows: any[];
  title?: string;
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onConfirm?: (row: any) => void;
  onCancel?: (row: any) => void;
  actions?: boolean;
  loading?: boolean;
  hideActions?: boolean;
  selectable?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  idOf?: (row: any) => number;
}) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center shadow-sm animate-pulse">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 size={24} className="text-gray-400 animate-spin" />
        </div>
        <p className="text-gray-500 font-medium">Chargement...</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <motion.div 
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center shadow-sm"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Database size={24} className="text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">Aucune donnée</p>
        <p className="text-sm text-gray-400 mt-1">Aucun enregistrement trouvé</p>
      </motion.div>
    );
  }

  const getStatusFromRow = (row: any[]) => {
    for (const cell of row) {
      if (typeof cell === 'string') {
        const lower = cell.toLowerCase();
        if (['en attente', 'attente', 'confirmée', 'confirmé', 'payée', 'payé', 'annulée', 'annulé', 'actif', 'inactif', 'prevu', 'arrive', 'en_service', 'en_maintenance', 'hors_service', 'libre', 'occupe', 'maintenance'].includes(lower)) {
          return cell;
        }
      }
    }
    const lastCell = row[row.length - 1];
    return typeof lastCell === 'string' ? lastCell : '';
  };

  const hasActions = !hideActions && actions && (onView || onEdit || onDelete || onConfirm || onCancel);

  return (
    <motion.div 
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {title && (
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
          <span className="text-xs text-gray-400">{rows.length} éléments</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
            <tr>
              {selectable && (
                <th className="px-4 py-3 w-10" />
              )}
              {headers.map((header, index) => (
                <th key={index} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {header}
                </th>
              ))}
              {hasActions && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {rows.map((row, rowIndex) => {
              const status = getStatusFromRow(row);
              const lowerStatus = status.toLowerCase();
              const rowId = idOf ? idOf(row) : undefined;
              const isSelected = rowId !== undefined && selectedIds?.has(rowId);
              
              return (
                <motion.tr
                  key={rowIndex}
                  className={`transition-colors group ${isSelected ? "bg-blue-50/70 dark:bg-blue-900/30" : "hover:bg-blue-50/30 dark:hover:bg-gray-800/40"}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rowIndex * 0.03 }}
                  whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.08)" }}
                >
                  {selectable && onToggleSelect && idOf && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => onToggleSelect(rowId!)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      />
                    </td>
                  )}
                  {row.map((cell: any, cellIndex: number) => (
                    <td key={cellIndex} className="px-4 py-3 text-sm">
                      {cellIndex === 0 ? (
                        <span className="font-medium text-gray-900 dark:text-gray-100">{cell}</span>
                      ) : (
                        <StatusBadge value={cell} />
                      )}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                        {onConfirm && (lowerStatus.includes("attente") || lowerStatus === "en_attente") && (
                          <motion.button
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onConfirm(row)}
                            title="Confirmer la réservation"
                            type="button"
                          >
                            <Check size={14} />
                            Confirmer
                          </motion.button>
                        )}
                        {onCancel && (lowerStatus.includes("attente") || lowerStatus.includes("confirm") || lowerStatus === "en_attente") && (
                          <motion.button
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onCancel(row)}
                            title="Annuler la réservation"
                            type="button"
                          >
                            <X size={14} />
                            Annuler
                          </motion.button>
                        )}
                        {onView && (
                          <motion.button
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onView(row)}
                            title="Voir"
                          >
                            <Eye size={16} />
                          </motion.button>
                        )}
                        {onEdit && (
                          <motion.button
                            className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onEdit(row)}
                            title="Modifier"
                          >
                            <Edit size={16} />
                          </motion.button>
                        )}
                        {onDelete && (
                          <motion.button
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onDelete(row)}
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        )}
                      </div>
                    </td>
                  )}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ===== COMPOSANT DE BADGE DE STATUT =====
function StatusBadge({ value }: { value: any }) {
  if (typeof value !== 'string') {
    return <span className="text-gray-600 dark:text-gray-300">{value}</span>;
  }
  
  const lower = value.toLowerCase();
  
  if (lower === "en attente" || lower === "attente" || lower === "en_attente") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
        <motion.span 
          className="w-1.5 h-1.5 bg-amber-500 rounded-full"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        {value}
      </span>
    );
  }
  
  if (lower === "confirmée" || lower === "confirmé" || lower === "confirme" || lower === "actif" || lower === "libre" || lower === "en_service") {
    const label = lower === "confirmée" || lower === "confirmé" || lower === "confirme" ? value : value;
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
        {label}
      </span>
    );
  }
  
  if (lower === "payée" || lower === "payé" || lower === "paye" || lower === "arrive") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
        {value}
      </span>
    );
  }
  
  if (lower === "annulée" || lower === "annulé" || lower === "annule" || lower === "inactif" || lower === "hors_service" || lower === "occupe") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
        {value}
      </span>
    );
  }
  
  if (lower === "prevu" || lower === "prévu" || lower === "planifie") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
        {value}
      </span>
    );
  }

  if (lower === "en_cours" || lower === "en_cours" || lower === "termine") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
        {value}
      </span>
    );
  }

  if (lower === "maintenance" || lower === "en_maintenance") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
        {value}
      </span>
    );
  }
  
  return <span className="text-gray-600 dark:text-gray-300">{value}</span>;
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
          <motion.span 
            className="w-8 h-px bg-blue-300"
            initial={{ width: 0 }}
            animate={{ width: 32 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          {eyebrow}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
      {action && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}

function SettingsCard({ icon: Icon, title, text, onClick }: { icon: typeof Settings; title: string; text: string; onClick?: () => void }) {
  return (
    <motion.button
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-lg transition-all duration-300 text-left w-full flex items-center gap-4"
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      type="button"
      onClick={onClick}
    >
      <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <Icon size={18} className="text-gray-600 dark:text-gray-400" />
      </div>
      <div className="flex-1">
        <strong className="text-gray-900 dark:text-white">{title}</strong>
        <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
      </div>
      <ChevronRight size={16} className="text-gray-300" />
    </motion.button>
  );
}

// ===== SIDEBAR =====
function Sidebar({
  section,
  setSection,
  isSidebarOpen,
  setIsSidebarOpen,
  pendingReservations,
  isDark,
  toggleDark,
  onLogout,
}: {
  section: Section;
  setSection: (s: Section) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (b: boolean) => void;
  pendingReservations: number;
  isDark: boolean;
  toggleDark: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <motion.aside
        className={`fixed top-0 left-0 bottom-0 w-64 z-50 flex flex-col bg-gray-900 border-r border-gray-800 lg:translate-x-0 transition-transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 py-6 flex items-center gap-3 border-b border-gray-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Anchor size={20} className="text-white" />
          </div>
          <div>
            <strong className="text-white text-lg block leading-tight">KivuPort</strong>
            <span className="text-xs text-gray-400">Console d'administration</span>
          </div>
          <button
            className="ml-auto lg:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
            type="button"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => { setSection(item.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon size={18} className={active ? "text-white" : "text-gray-500"} />
                <span>{item.label}</span>
                {item.id === "reservations" && pendingReservations > 0 && (
                  <span className="ml-auto text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                    {pendingReservations}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-800 space-y-1">
          <button
            type="button"
            onClick={toggleDark}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? "Mode clair" : "Mode sombre"}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}

// ============================================
// ===== PAGE PRINCIPALE =====
// ============================================
export default function AdminPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [isReady, setIsReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("tous");
  const [periodFilter, setPeriodFilter] = useState<FilterPeriod>("tous");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [adminRows, setAdminRows] = useState<AdminRows>({
    payments: [],
    fleet: [],
    infrastructure: [],
    people: [],
    pavilions: [],
    voyages: [],
    docks: [],
    ports: [],
    clients: [],
    boats: [],
  });
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    todayReservations: 0,
    revenue: "0 FC",
    activeClients: 0,
    plannedVoyages: 0,
    pendingPayments: 0,
    totalReservations: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addModalType, setAddModalType] = useState<"boat" | "voyage" | "pavilion" | "port" | "dock" | "client">("boat");

  // ===== RECORDS BRUTS (pour CRUD complet) =====
  const [rawBoats, setRawBoats] = useState<any[]>([]);
  const [rawVoyages, setRawVoyages] = useState<any[]>([]);
  const [rawPavilions, setRawPavilions] = useState<any[]>([]);
  const [rawPorts, setRawPorts] = useState<any[]>([]);
  const [rawDocks, setRawDocks] = useState<any[]>([]);
  const [rawClients, setRawClients] = useState<any[]>([]);
  const [rawPayments, setRawPayments] = useState<any[]>([]);

  // ===== PAGINATION PAR TABLE =====
  const [pageState, setPageState] = useState<Record<string, number>>({});
  const [itemsPerPageState] = useState(10);
  const getPage = (key: string) => pageState[key] || 1;
  const setPage = (key: string, page: number) => setPageState((prev) => ({ ...prev, [key]: page }));

  // ===== RECHERCHE AVANCÉE =====
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [typeFilter, setTypeFilter] = useState("tous");

  // ===== ACTIONS GROUPÉES =====
  const [selectedReservations, setSelectedReservations] = useState<Set<number>>(new Set());

  // ===== MODE SOMBRE =====
  const [isDark, setIsDark] = useState(false);

  // ===== LOGS / ACTIVITÉ =====
  const [adminLogs, setAdminLogs] = useState<any[]>([]);

  // ===== MODALS STATE =====
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [currentEditFields, setCurrentEditFields] = useState<any[]>([]);
  const [crudMode, setCrudMode] = useState<"reservation" | "boat" | "voyage" | "pavilion" | "port" | "dock">("reservation");

  // ===== MODALS CLIENTS =====
  const [editClientModalOpen, setEditClientModalOpen] = useState(false);
  const [deleteClientModalOpen, setDeleteClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);

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

        await loadData();

        setIsReady(true);
      } catch (error) {
        console.error("Erreur:", error);
        setNotice("Une erreur est survenue lors du chargement.");
        toast.error("Erreur de chargement des données");
      } finally {
        setIsLoading(false);
      }
    }

    verifyAdmin();
  }, [router, reloadKey]);

  async function loadData() {
    // Charger les autres données
    const [
      paymentsResult, 
      boatsResult, 
      portsResult, 
      docksResult, 
      clientsResult, 
      voyagesResult, 
      pavilionsResult
    ] = await Promise.all([
      supabase.from("paiements").select("id, montant, devise, mode_paiement, date_paiement, statut"),
      supabase.from("bateaux").select("id, nom, immatriculation, type, capacite_totale, capacite_passager, capacite_cargaison, statut"),
      supabase.from("ports").select("id, nom, localisation, ville, statut"),
      supabase.from("quais").select(`
        id, 
        nom, 
        numero, 
        type_quai, 
        statut, 
        capacite,
        port:ports(nom)
      `),
      supabase.from("client").select("id, nom, prenom, email, telephone, adresse, nationalite, genre, statut, date_inscription"),
      supabase.from("voyages").select(`
        id, 
        code_voyage, 
        description, 
        statut, 
        date_depart,
        bateau:bateaux(nom)
      `),
      supabase.from("pavillons").select(`
        id, 
        nom, 
        classe, 
        capacite_max, 
        unite, 
        prix_unitaire, 
        prix_tonne, 
        devise,
        bateau:bateaux(nom)
      `),
    ]);

    // Charger les réservations (embeds fiables uniquement)
    let data: any[] | null = null;
    let queryError: any = null;
    try {
      const result = await supabase
        .from("reservations")
        .select(`
          id, 
          date_reservation, 
          type_reservation, 
          statut, 
          prix_total, 
          created_at,
          date_embarquement,
          idclient,
          idpavillon,
          voyage:voyages(code_voyage, id, bateau:bateaux(nom))
        `)
        .order("date_reservation", { ascending: false });
      data = result.data;
      queryError = result.error;
    } catch (caught) {
      queryError = caught;
    }

    if (queryError) {
      const msg = typeof queryError?.message === "string" ? queryError.message : "Erreur de requête Supabase";
      console.error("Erreur chargement réservations:", queryError);
      setNotice(`Impossible de charger les réservations : ${msg}`);
      toast.error("Erreur de chargement des réservations");
      setReservations([]);
      data = [];
    }
    if (data) {
      const clientByPk = new Map((clientsResult.data || []).map((c: any) => [c.id, c]));
      const validData = data.filter((row: any) => row && row.id);
      
      setReservations(validData.map((row: any) => {
        const clientRec = row.idclient != null ? clientByPk.get(row.idclient) : null;
        const clientName = clientRec ? [clientRec.prenom, clientRec.nom].filter(Boolean).join(" ") || "Client non renseigné" : "Client non renseigné";
        const statusMap: Record<string, ReservationStatus> = {
          "confirme": "Confirmée",
          "arrive": "Payée",
          "annule": "Annulée",
        };
        
        return {
          id: row.id,
          reference: `KP-${String(row.id).padStart(4, "0")}`,
          client: clientName,
          client_email: clientRec?.email || "Non renseigné",
          client_phone: clientRec?.telephone || "Non renseigné",
          voyage: row.voyage,
          pavillon: row.pavillon,
          client_rec: clientRec || null,
          route: row.voyage?.code_voyage || "Voyage non renseigné",
          date: row.date_reservation ? new Date(row.date_reservation).toLocaleDateString("fr-FR") : "-",
          amount: `${Number(row.prix_total || 0).toLocaleString("fr-FR")} FC`,
          status: statusMap[row.statut] || "En attente",
          type: row.type_reservation || "Standard",
          created_at: row.created_at || row.date_reservation,
          details: `Réservation ${row.type_reservation || "Standard"} pour le voyage ${row.voyage?.code_voyage || ""}`,
        };
      }));
    }

    const paymentRecords = (paymentsResult.data || []) as any[];
    const clientRecords = (clientsResult.data || []) as any[];
    const voyageRecords = (voyagesResult.data || []) as any[];
    const boatRecords = (boatsResult.data || []) as any[];
    const portRecords = (portsResult.data || []) as any[];
    const dockRecords = (docksResult.data || []) as any[];
    const pavilionRecords = (pavilionsResult.data || []) as any[];

    setRawBoats(boatRecords);
    setRawVoyages(voyageRecords);
    setRawPavilions(pavilionRecords);
    setRawPorts(portRecords);
    setRawDocks(dockRecords);
    setRawClients(clientRecords);
    setRawPayments(paymentRecords);

    try {
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("id, action, entity_type, entity_id, actor_email, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (logs) setAdminLogs(logs);
    } catch { /* table maybe missing */ }
    
    const paidAmount = paymentRecords
      .filter((row) => row.statut === "paye")
      .reduce((total, row) => total + Number(row.montant || 0), 0);
    
    const today = new Date().toDateString();
    const todayReservations = (data || []).filter((row: any) => 
      row && row.date_reservation && new Date(row.date_reservation).toDateString() === today
    ).length;

    const totalRevenue = paymentRecords
      .filter((row) => row.statut === "paye" || row.statut === "confirme")
      .reduce((total, row) => total + Number(row.montant || 0), 0);

    setMetrics({
      todayReservations,
      revenue: `${paidAmount.toLocaleString("fr-FR")} FC`,
      activeClients: clientRecords.filter((row) => row.statut === "actif").length,
      plannedVoyages: voyageRecords.filter((row) => row.statut === "prevu" || row.statut === "planifie").length,
      pendingPayments: paymentRecords.filter((row) => row.statut === "en_attente").length,
      totalReservations: (data || []).filter((row: any) => row && row.id).length,
      totalRevenue,
    });

    const voyagesRows = (voyagesResult.data || []).map((row: any) => [
      row.code_voyage || `V-${row.id}`,
      row.bateau?.nom || "-",
      row.description || "-",
      row.date_depart ? new Date(row.date_depart).toLocaleDateString("fr-FR") : "-",
      row.statut || "-",
    ]);

    const boatsRows = (boatsResult.data || []).map((row: any) => [
      row.nom || "-",
      row.immatriculation || "-",
      row.type || "-",
      `${row.capacite_totale || 0} (P:${row.capacite_passager || 0}/C:${row.capacite_cargaison || 0})`,
      row.statut || "-",
    ]);

    const portsRows = (portsResult.data || []).map((row: any) => [
      "Port",
      row.nom || "-",
      `${row.ville || ""} - ${row.localisation || ""}`,
      row.statut || "-",
    ]);

    const docksRows = (docksResult.data || []).map((row: any) => [
      "Quai",
      row.nom || `N°${row.numero || "-"}`,
      `Port: ${row.port?.nom || "-"} - Capacité: ${row.capacite || "-"}`,
      row.statut || "-",
    ]);

    const clientsRows = (clientsResult.data || []).map((row: any) => [
      `${row.prenom || ""} ${row.nom || ""}`.trim() || "-",
      row.email || "-",
      row.telephone || "-",
      row.date_inscription ? new Date(row.date_inscription).toLocaleDateString("fr-FR") : "-",
      row.statut || "-",
    ]);

    const pavilionsRows = (pavilionsResult.data || []).map((row: any) => [
      row.nom || "-",
      row.bateau?.nom || "-",
      row.classe || "-",
      `${row.capacite_max || 0} ${row.unite || ""}`,
      `${row.prix_unitaire || 0} ${row.devise || "FC"}`,
    ]);

    const paymentsRows = (paymentsResult.data || []).map((row: any) => [
      `PAY-${row.id}`,
      String(row.mode_paiement || "-"),
      row.date_paiement ? new Date(row.date_paiement).toLocaleDateString("fr-FR") : "-",
      `${Number(row.montant || 0).toLocaleString("fr-FR")} ${row.devise || "FC"}`,
      String(row.statut || "-"),
    ]);

    setAdminRows({
      payments: paymentsRows,
      fleet: boatsRows,
      infrastructure: [...portsRows, ...docksRows],
      people: clientsRows,
      pavilions: pavilionsRows,
      voyages: voyagesRows,
      docks: docksRows,
      ports: portsRows,
      clients: clientsRows,
      boats: boatsRows,
    });
  }

  useEffect(() => {
    if (!isReady) return;
    const intervalId = window.setInterval(() => {
      void loadData();
    }, 10000);
    return () => window.clearInterval(intervalId);
  }, [isReady]);

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
    let filtered = reservations;

    if (query) {
      filtered = filtered.filter((row) =>
        `${row.id} ${row.client} ${row.route} ${row.reference} ${row.client_email} ${row.client_phone} ${(row as any).voyage?.bateau?.immatriculation || ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      );
    }

    if (statusFilter !== "tous") {
      const statusMap: Record<FilterStatus, string> = {
        tous: "",
        en_attente: "En attente",
        confirmee: "Confirmée",
        payee: "Payée",
        annulee: "Annulée",
      };
      filtered = filtered.filter((row) => row.status === statusMap[statusFilter]);
    }

    if (periodFilter !== "tous") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter((row) => {
        if (!row.created_at) return false;
        const date = new Date(row.created_at);
        
        switch (periodFilter) {
          case "aujourdhui":
            return date >= today;
          case "semaine": {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return date >= weekAgo;
          }
          case "mois": {
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return date >= monthAgo;
          }
          default:
            return true;
        }
      });
    }

    if (dateFrom || dateTo) {
      filtered = filtered.filter((row) => {
        if (!row.created_at) return true;
        const d = new Date(row.created_at);
        if (dateFrom && d < new Date(dateFrom)) return false;
        if (dateTo) {
          const end = new Date(dateTo);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
        return true;
      });
    }

    if (typeFilter !== "tous") {
      filtered = filtered.filter((row) => (row.type || "").toLowerCase() === typeFilter.toLowerCase());
    }

    if (amountMin || amountMax) {
      filtered = filtered.filter((row) => {
        const num = Number(String(row.amount).replace(/[^\d.-]/g, "")) || 0;
        if (amountMin && num < Number(amountMin)) return false;
        if (amountMax && num > Number(amountMax)) return false;
        return true;
      });
    }

    return filtered;
  }, [query, statusFilter, periodFilter, reservations, dateFrom, dateTo, typeFilter, amountMin, amountMax]);

  const paginatedReservations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReservations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReservations, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, periodFilter, dateFrom, dateTo, typeFilter, amountMin, amountMax]);

  const pendingReservations = reservations.filter((row) => row.status === "En attente").length;

  // ===== ACTIONS CRUD =====
  async function confirmReservation(id: number) {
    try {
      const { error } = await supabase.rpc("transition_kivuport_reservation", {
        p_reservation_id: id,
        p_to_status: "confirme",
        p_reason: "admin_confirmation",
      });
      
      if (error) {
        setNotice(`La confirmation a échoué : ${error.message}`);
        return;
      }
      
      setReservations((current) =>
        current.map((row) => (row.id === id ? { ...row, status: "Confirmée" } : row))
      );
      setNotice(`Réservation KP-${String(id).padStart(4, "0")} confirmée.`);
      setSelectedReservations((prev) => { const n = new Set(prev); n.delete(id); return n; });

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (accessToken) {
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
    } catch (error) {
      setNotice(`Erreur lors de la confirmation : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  }

  async function cancelReservation(id: number) {
    if (!window.confirm(`Annuler la réservation KP-${String(id).padStart(4, "0")} ?`)) return;
    
    try {
      const { error } = await supabase.rpc("transition_kivuport_reservation", {
        p_reservation_id: id,
        p_to_status: "annule",
        p_reason: "admin_cancellation",
      });
      
      if (error) {
        setNotice(`L'annulation a échoué : ${error.message}`);
        return;
      }
      
      setReservations((current) =>
        current.map((row) => (row.id === id ? { ...row, status: "Annulée" } : row))
      );
      setNotice(`La réservation KP-${String(id).padStart(4, "0")} a été annulée.`);
      setSelectedReservations((prev) => { const n = new Set(prev); n.delete(id); return n; });
    } catch (error) {
      setNotice(`Erreur lors de l'annulation : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
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
    if (rows.length === 0) {
      toast.warning("Aucune donnée à exporter");
      return;
    }
    
    const csv = [
      "Référence,Client,Email,Téléphone,Trajet,Date,Montant,Statut,Type",
      ...rows.map((row) =>
        [
          row.reference,
          row.client,
          row.client_email || "",
          row.client_phone || "",
          row.route,
          row.date,
          row.amount,
          row.status,
          row.type,
        ]
          .map((value) => `"${value}"`)
          .join(",")
      ),
    ].join("\n");
    
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `kivuport-reservations-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV réalisé avec succès");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  // ===== GESTION DES MODALS =====
  const handleView = (row: any) => {
    const fullData = reservations.find(r => r.reference === row[0] || String(r.id) === row[0]);
    if (fullData) {
      setSelectedItem(fullData);
      setViewModalOpen(true);
    } else {
      setSelectedItem({
        reference: row[0],
        client: row[1] || "Non renseigné",
        route: row[2] || "Non renseigné",
        date: row[3] || "Non renseigné",
        amount: row[4] || "Non renseigné",
        status: row[5] || "Inconnu",
        details: "Détails disponibles sur la réservation complète.",
      });
      setViewModalOpen(true);
    }
  };

  // ===== OUVERTURE MODALS ENTITÉS DE RÉFÉRENCE =====
  const openBoatEdit = (row: any) => {
    const rec = rawBoats.find((b) => b.id === Number(row[0]) || b.nom === row[0] || b.immatriculation === row[1] || `${b.nom}` === row[0]);
    if (!rec) return toast.error("Enregistrement introuvable");
    setSelectedItem(rec);
    setCurrentEditFields([
      { id: "nom", label: "Nom du bateau", type: "text", required: true },
      { id: "immatriculation", label: "Immatriculation", type: "text", required: true },
      { id: "type", label: "Type", type: "select", options: ["cargo", "mixte", "passager"] },
      { id: "capacite_totale", label: "Capacité totale", type: "number", required: true },
      { id: "capacite_passager", label: "Capacité passagers", type: "number" },
      { id: "capacite_cargaison", label: "Capacité cargaison", type: "number" },
      { id: "statut", label: "Statut", type: "select", options: ["en_service", "en_maintenance", "hors_service"] },
    ]);
    setCrudMode("boat");
    setEditModalOpen(true);
  };

  const openBoatDelete = (row: any) => {
    setCrudMode("boat");
    const rec = rawBoats.find((b) => b.id === Number(row[0]) || b.nom === row[0] || b.immatriculation === row[1] || `${b.nom}` === row[0]);
    setSelectedItem(rec || { id: Number(row[0]), nom: row[0] });
    setDeleteModalOpen(true);
  };

  const openVoyageEdit = (row: any) => {
    const rec = rawVoyages.find((v) => v.id === Number(row[0]) || v.code_voyage === row[0] || `${v.id}` === String(row[0]));
    if (!rec) return toast.error("Enregistrement introuvable");
    setSelectedItem(rec);
    setCurrentEditFields([
      { id: "code_voyage", label: "Code voyage", type: "text", required: true },
      { id: "description", label: "Description", type: "text" },
      { id: "date_depart", label: "Date de départ", type: "datetime-local" },
      { id: "statut", label: "Statut", type: "select", options: ["prevu", "en_cours", "termine", "annule"] },
    ]);
    setCrudMode("voyage");
    setEditModalOpen(true);
  };

  const openVoyageDelete = (row: any) => {
    setCrudMode("voyage");
    const rec = rawVoyages.find((v) => v.id === Number(row[0]) || v.code_voyage === row[0] || `${v.id}` === String(row[0]));
    setSelectedItem(rec || { id: Number(row[0]), code_voyage: row[0] });
    setDeleteModalOpen(true);
  };

  const openPavilionEdit = (row: any) => {
    const rec = rawPavilions.find((p) => p.id === Number(row[0]) || p.nom === row[0]);
    if (!rec) return toast.error("Enregistrement introuvable");
    setSelectedItem(rec);
    setCurrentEditFields([
      { id: "nom", label: "Nom du pavillon", type: "text", required: true },
      { id: "classe", label: "Classe", type: "text", required: true },
      { id: "capacite_max", label: "Capacité max", type: "number", required: true },
      { id: "unite", label: "Unité", type: "text", required: true },
      { id: "prix_unitaire", label: "Prix unitaire", type: "number", required: true },
      { id: "prix_tonne", label: "Prix à la tonne", type: "number" },
      { id: "devise", label: "Devise", type: "select", options: ["FC", "USD"] },
    ]);
    setCrudMode("pavilion");
    setEditModalOpen(true);
  };

  const openPavilionDelete = (row: any) => {
    setCrudMode("pavilion");
    const rec = rawPavilions.find((p) => p.id === Number(row[0]) || p.nom === row[0]);
    setSelectedItem(rec || { id: Number(row[0]), nom: row[0] });
    setDeleteModalOpen(true);
  };

  const openPortEdit = (row: any) => {
    const rec = rawPorts.find((p) => p.id === Number(row[0]) || p.nom === row[1]);
    if (!rec) return toast.error("Enregistrement introuvable");
    setSelectedItem(rec);
    setCurrentEditFields([
      { id: "nom", label: "Nom du port", type: "text", required: true },
      { id: "ville", label: "Ville", type: "text", required: true },
      { id: "localisation", label: "Localisation", type: "text", required: true },
      { id: "statut", label: "Statut", type: "select", options: ["actif", "hors_service"] },
    ]);
    setCrudMode("port");
    setEditModalOpen(true);
  };

  const openPortDelete = (row: any) => {
    setCrudMode("port");
    const rec = rawPorts.find((p) => p.id === Number(row[0]) || p.nom === row[1]);
    setSelectedItem(rec || { id: Number(row[0]), nom: row[1] });
    setDeleteModalOpen(true);
  };

  const openDockEdit = (row: any) => {
    const rec = rawDocks.find((d) => d.id === Number(row[0]) || d.nom === row[1]);
    if (!rec) return toast.error("Enregistrement introuvable");
    setSelectedItem(rec);
    setCurrentEditFields([
      { id: "nom", label: "Nom du quai", type: "text", required: true },
      { id: "numero", label: "Numéro", type: "number", required: true },
      { id: "capacite", label: "Capacité", type: "number", required: true },
      { id: "type_quai", label: "Type", type: "select", options: ["passager", "cargaison", "mixte"] },
      { id: "statut", label: "Statut", type: "select", options: ["libre", "occupe", "maintenance"] },
    ]);
    setCrudMode("dock");
    setEditModalOpen(true);
  };

  const openDockDelete = (row: any) => {
    setCrudMode("dock");
    const rec = rawDocks.find((d) => d.id === Number(row[0]) || d.nom === row[1]);
    setSelectedItem(rec || { id: Number(row[0]), nom: row[1] });
    setDeleteModalOpen(true);
  };

  // ===== FONCTIONS CRUD CLIENTS =====

  // Modifier un client
  const handleEditClient = async (formData: any) => {
    if (!selectedClient) return;
    
    setIsSavingClient(true);
    try {
      const { error } = await supabase
        .from("client")
        .update({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          telephone: formData.telephone,
          adresse: formData.adresse || "",
          nationalite: formData.nationalite || "",
          genre: formData.genre || null,
          statut: formData.statut || "actif",
        })
        .eq("id", selectedClient.id);

      if (error) {
        toast.error(`Erreur lors de la modification : ${error.message}`);
        return;
      }

      toast.success("Client modifié avec succès !");
      setEditClientModalOpen(false);
      setSelectedClient(null);
      setReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error("Une erreur est survenue lors de la modification.");
    } finally {
      setIsSavingClient(false);
    }
  };

  // Supprimer un client
  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    
    setIsDeletingClient(true);
    try {
      // Vérifier si le client a des réservations
      const { data: reservations, error: checkError } = await supabase
        .from("reservations")
        .select("id")
        .eq("idclient", selectedClient.id)
        .limit(1);

      if (checkError) {
        toast.error(`Erreur lors de la vérification : ${checkError.message}`);
        return;
      }

      if (reservations && reservations.length > 0) {
        toast.warning("Ce client a des réservations. Supprimez-les d'abord ou changez le statut du client.");
        setDeleteClientModalOpen(false);
        return;
      }

      const { error } = await supabase
        .from("client")
        .delete()
        .eq("id", selectedClient.id);

      if (error) {
        toast.error(`Erreur lors de la suppression : ${error.message}`);
        return;
      }

      toast.success("Client supprimé avec succès !");
      setDeleteClientModalOpen(false);
      setSelectedClient(null);
      setReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error("Une erreur est survenue lors de la suppression.");
    } finally {
      setIsDeletingClient(false);
    }
  };

  // ===== CRUD ENTITÉS DE RÉFÉRENCE =====

  // ---- BATEAUX ----
  const handleUpdateBoat = async (formData: any) => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("bateaux")
        .update({
          nom: formData.nom,
          immatriculation: formData.immatriculation,
          type: formData.type,
          capacite_totale: parseInt(formData.capacite_totale || "0"),
          capacite_passager: parseInt(formData.capacite_passager || "0"),
          capacite_cargaison: parseInt(formData.capacite_cargaison || "0"),
          statut: formData.statut || "en_service",
        })
        .eq("id", selectedItem.id);
      if (error) return toast.error(`Erreur modification bateau : ${error.message}`);
      toast.success("Bateau modifié avec succès !");
      setEditModalOpen(false);
      setSelectedItem(null);
      setReloadKey((k) => k + 1);
    } catch {
      toast.error("Une erreur est survenue lors de la modification.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBoat = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      const { data: linked } = await supabase.from("voyages").select("id").eq("idbateau", selectedItem.id).limit(1);
      if (linked && linked.length > 0) {
        toast.warning("Ce bateau a des voyages associés. Supprimez-les d'abord.");
        setDeleteModalOpen(false);
        return;
      }
      const { error } = await supabase.from("bateaux").delete().eq("id", selectedItem.id);
      if (error) return toast.error(`Erreur suppression bateau : ${error.message}`);
      toast.success("Bateau supprimé avec succès !");
      setDeleteModalOpen(false);
      setSelectedItem(null);
      setReloadKey((k) => k + 1);
    } catch {
      toast.error("Une erreur est survenue lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ---- VOYAGES ----
  const handleUpdateVoyage = async (formData: any) => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("voyages")
        .update({
          code_voyage: formData.code_voyage,
          description: formData.description || "",
          date_depart: formData.date_depart ? new Date(formData.date_depart).toISOString() : undefined,
          statut: formData.statut || "prevu",
        })
        .eq("id", selectedItem.id);
      if (error) return toast.error(`Erreur modification voyage : ${error.message}`);
      toast.success("Voyage modifié avec succès !");
      setEditModalOpen(false);
      setSelectedItem(null);
      setReloadKey((k) => k + 1);
    } catch {
      toast.error("Une erreur est survenue lors de la modification.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVoyage = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      const { data: linked } = await supabase.from("reservations").select("id").eq("idvoyage", selectedItem.id).limit(1);
      if (linked && linked.length > 0) {
        toast.warning("Ce voyage a des réservations associées. Supprimez-les d'abord.");
        setDeleteModalOpen(false);
        return;
      }
      const { error } = await supabase.from("voyages").delete().eq("id", selectedItem.id);
      if (error) return toast.error(`Erreur suppression voyage : ${error.message}`);
      toast.success("Voyage supprimé avec succès !");
      setDeleteModalOpen(false);
      setSelectedItem(null);
      setReloadKey((k) => k + 1);
    } catch {
      toast.error("Une erreur est survenue lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ---- PAVILLONS ----
  const handleUpdatePavilion = async (formData: any) => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("pavillons")
        .update({
          nom: formData.nom,
          classe: formData.classe,
          capacite_max: parseInt(formData.capacite_max || "0"),
          unite: formData.unite,
          prix_unitaire: parseFloat(formData.prix_unitaire || "0"),
          prix_tonne: formData.prix_tonne ? parseFloat(formData.prix_tonne) : null,
          devise: formData.devise || "FC",
        })
        .eq("id", selectedItem.id);
      if (error) return toast.error(`Erreur modification pavillon : ${error.message}`);
      toast.success("Pavillon modifié avec succès !");
      setEditModalOpen(false);
      setSelectedItem(null);
      setReloadKey((k) => k + 1);
    } catch {
      toast.error("Une erreur est survenue lors de la modification.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePavilion = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      const { data: linked } = await supabase.from("reservations").select("id").eq("idpavillon", selectedItem.id).limit(1);
      if (linked && linked.length > 0) {
        toast.warning("Ce pavillon a des réservations associées. Supprimez-les d'abord.");
        setDeleteModalOpen(false);
        return;
      }
      const { error } = await supabase.from("pavillons").delete().eq("id", selectedItem.id);
      if (error) return toast.error(`Erreur suppression pavillon : ${error.message}`);
      toast.success("Pavillon supprimé avec succès !");
      setDeleteModalOpen(false);
      setSelectedItem(null);
      setReloadKey((k) => k + 1);
    } catch {
      toast.error("Une erreur est survenue lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ---- PORTS ----
  const handleUpdatePort = async (formData: any) => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ports")
        .update({
          nom: formData.nom,
          ville: formData.ville,
          localisation: formData.localisation,
          statut: formData.statut || "actif",
        })
        .eq("id", selectedItem.id);
      if (error) return toast.error(`Erreur modification port : ${error.message}`);
      toast.success("Port modifié avec succès !");
      setEditModalOpen(false);
      setSelectedItem(null);
      setReloadKey((k) => k + 1);
    } catch {
      toast.error("Une erreur est survenue lors de la modification.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePort = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      const { data: linked } = await supabase.from("quais").select("id").eq("idport", selectedItem.id).limit(1);
      if (linked && linked.length > 0) {
        toast.warning("Ce port a des quais associés. Supprimez-les d'abord.");
        setDeleteModalOpen(false);
        return;
      }
      const { error } = await supabase.from("ports").delete().eq("id", selectedItem.id);
      if (error) return toast.error(`Erreur suppression port : ${error.message}`);
      toast.success("Port supprimé avec succès !");
      setDeleteModalOpen(false);
      setSelectedItem(null);
      setReloadKey((k) => k + 1);
    } catch {
      toast.error("Une erreur est survenue lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ---- QUAIS ----
  const handleUpdateDock = async (formData: any) => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("quais")
        .update({
          nom: formData.nom,
          numero: parseInt(formData.numero || "0"),
          capacite: parseInt(formData.capacite || "0"),
          type_quai: formData.type_quai || "mixte",
          statut: formData.statut || "libre",
        })
        .eq("id", selectedItem.id);
      if (error) return toast.error(`Erreur modification quai : ${error.message}`);
      toast.success("Quai modifié avec succès !");
      setEditModalOpen(false);
      setSelectedItem(null);
      setReloadKey((k) => k + 1);
    } catch {
      toast.error("Une erreur est survenue lors de la modification.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDock = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      const { data: linked } = await supabase.from("bateaux").select("id").eq("idquai", selectedItem.id).limit(1);
      if (linked && linked.length > 0) {
        toast.warning("Ce quai a des bateaux associés. Déplacez-les d'abord.");
        setDeleteModalOpen(false);
        return;
      }
      const { error } = await supabase.from("quais").delete().eq("id", selectedItem.id);
      if (error) return toast.error(`Erreur suppression quai : ${error.message}`);
      toast.success("Quai supprimé avec succès !");
      setDeleteModalOpen(false);
      setSelectedItem(null);
      setReloadKey((k) => k + 1);
    } catch {
      toast.error("Une erreur est survenue lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ===== ACTIONS GROUPÉES =====
  const toggleReservationSelection = (id: number) => {
    setSelectedReservations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedReservations((prev) => {
      if (prev.size === paginatedReservations.length && paginatedReservations.length > 0) return new Set();
      const next = new Set(prev);
      paginatedReservations.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const bulkAction = async (action: "confirm" | "cancel") => {
    if (selectedReservations.size === 0) {
      toast.warning("Aucune réservation sélectionnée");
      return;
    }
    const ids = Array.from(selectedReservations);
    let ok = 0;
    for (const id of ids) {
      const toStatus = action === "confirm" ? "confirme" : "annule";
      const { error } = await supabase.rpc("transition_kivuport_reservation", {
        p_reservation_id: id,
        p_to_status: toStatus,
        p_reason: `admin_bulk_${toStatus}`,
      });
      if (!error) ok++;
      await new Promise((r) => setTimeout(r, 60));
    }
    setSelectedReservations(new Set());
    setReloadKey((k) => k + 1);
    toast.success(`${ok}/${ids.length} réservation(s) ${action === "confirm" ? "confirmée(s)" : "annulée(s)"}`);
  };

  const exportSelected = () => {
    const selected = reservations.filter((r) => selectedReservations.has(r.id));
    if (selected.length === 0) {
      toast.warning("Aucune réservation sélectionnée");
      return;
    }
    formatExport(selected);
    setSelectedReservations(new Set());
  };

  // ===== EXPORT PDF =====
  const exportPDF = async () => {
    if (filteredReservations.length === 0) {
      toast.warning("Aucune donnée disponible pour générer le rapport demandé");
      return;
    }

    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const fontItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);
      const pageWidth = 595;
      const pageHeight = 842;
      const margin = 40;

      const reportLabel =
        periodFilter === "aujourdhui"
          ? "Rapport du jour"
          : periodFilter === "semaine"
            ? "Rapport de la semaine"
            : periodFilter === "mois"
              ? "Rapport du mois"
              : "Rapport global";

      const totalRevenue = filteredReservations.reduce((sum, reservation) => {
        const raw = String(reservation.amount ?? "0").replace(/[^0-9,.-]/g, "").replace(",", ".");
        return sum + (Number(raw) || 0);
      }, 0);

      const confirmed = filteredReservations.filter((r) => r.status === "Confirmée" || r.status === "Payée").length;
      const pending = filteredReservations.filter((r) => r.status === "En attente").length;
      const canceled = filteredReservations.filter((r) => r.status === "Annulée").length;

      const addPage = (pageNumber: number, currentY: number) => {
        const page = pdf.addPage([pageWidth, pageHeight]);
        page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: rgb(0.97, 0.98, 1) });
        page.drawRectangle({ x: 0, y: 770, width: pageWidth, height: 72, color: rgb(0.04, 0.18, 0.42) });
        page.drawText("KivuPort", { x: margin, y: 800, size: 22, font: fontBold, color: rgb(1, 1, 1) });
        page.drawText(reportLabel, { x: margin + 220, y: 804, size: 14, font: fontItalic, color: rgb(0.88, 0.92, 1) });
        page.drawText(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, {
          x: margin,
          y: 782,
          size: 9,
          font,
          color: rgb(0.88, 0.92, 1),
        });

        page.drawText(`Page ${pageNumber}`, {
          x: pageWidth - 80,
          y: 782,
          size: 9,
          font,
          color: rgb(0.88, 0.92, 1),
        });

        return page;
      };

      let currentPage = addPage(1, 730);
      let y = 700;

      const summaryCards = [
        { label: "Réservations", value: String(filteredReservations.length), color: rgb(0.13, 0.59, 0.95) },
        { label: "Confirmées", value: String(confirmed), color: rgb(0.21, 0.78, 0.55) },
        { label: "En attente", value: String(pending), color: rgb(0.98, 0.66, 0.15) },
        { label: "Montant", value: `${totalRevenue.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} USD`, color: rgb(0.31, 0.35, 0.8) },
      ];

      summaryCards.forEach((card, index) => {
        const x = margin + index * 130;
        currentPage.drawRectangle({ x, y: y - 8, width: 115, height: 54, color: card.color });
        currentPage.drawText(card.label, { x: x + 10, y: y + 20, size: 8, font: font, color: rgb(1, 1, 1) });
        currentPage.drawText(card.value, { x: x + 10, y: y + 2, size: 15, font: fontBold, color: rgb(1, 1, 1) });
      });

      y -= 84;
      currentPage.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
      y -= 18;

      const headers = ["Réf", "Client", "Trajet", "Date", "Montant", "Statut"];
      const columnX = [margin, margin + 68, margin + 188, margin + 305, margin + 395, margin + 470];

      headers.forEach((header, index) => {
        currentPage.drawText(header, { x: columnX[index], y, size: 9, font: fontBold, color: rgb(0.18, 0.18, 0.18) });
      });
      y -= 10;

      const headerLineY = y;
      currentPage.drawLine({ start: { x: margin, y: headerLineY }, end: { x: pageWidth - margin, y: headerLineY }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
      y -= 14;

      for (let i = 0; i < filteredReservations.length; i++) {
        const reservation = filteredReservations[i];
        if (y < 90) {
          const pageNumber = pdf.getPageCount() + 1;
          currentPage = addPage(pageNumber, 730);
          y = 700;
          currentPage.drawText("Suite du rapport", { x: margin, y, size: 12, font: fontBold, color: rgb(0.18, 0.18, 0.18) });
          y -= 18;
          currentPage.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
          y -= 14;
        }

        const rowValues = [
          reservation.reference,
          reservation.client,
          reservation.route,
          reservation.date,
          reservation.amount,
          reservation.status,
        ];

        const fillColor = i % 2 === 0 ? rgb(0.98, 0.99, 1) : rgb(1, 1, 1);
        currentPage.drawRectangle({ x: margin - 4, y: y - 12, width: pageWidth - (margin * 2) + 8, height: 18, color: fillColor });

        rowValues.forEach((value, index) => {
          const safeValue = String(value ?? "-").slice(0, index === 1 ? 18 : 22);
          currentPage.drawText(safeValue, {
            x: columnX[index],
            y,
            size: 7.5,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
        });

        y -= 18;
      }

      const bottomNote = canceled > 0 ? `Annulées : ${canceled}` : "Aucune réservation annulée";
      currentPage.drawText(bottomNote, {
        x: margin,
        y: 38,
        size: 8,
        font: font,
        color: rgb(0.55, 0.55, 0.55),
      });

      const blob = await pdf.save();
      const url = URL.createObjectURL(new Blob([new Uint8Array(blob)], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `kivuport-${reportLabel.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Rapport PDF généré avec succès");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Erreur lors de la génération du rapport PDF");
    }
  };

  // ===== MODE SOMBRE =====
  useEffect(() => {
    const saved = localStorage.getItem("kivuport-dark-mode");
    setIsDark(saved === "1");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("kivuport-dark-mode", isDark ? "1" : "0");
  }, [isDark]);

  // ===== FONCTIONS D'AJOUT =====
  const handleAddBoat = async (formData: any) => {
    setIsAdding(true);
    try {
      const { error } = await supabase
        .from("bateaux")
        .insert({
          nom: formData.nom,
          immatriculation: formData.immatriculation,
          type: formData.type,
          capacite_totale: parseInt(formData.capacite_totale || "0"),
          capacite_passager: parseInt(formData.capacite_passager || "0"),
          capacite_cargaison: parseInt(formData.capacite_cargaison || "0"),
          statut: formData.statut || "en_service",
        });

      if (error) {
        toast.error(`Erreur création bateau : ${error.message}`);
        return;
      }

      toast.success("Bateau ajouté avec succès !");
      setAddModalOpen(false);
      setReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error("Une erreur est survenue lors de l'ajout.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddVoyage = async (formData: any) => {
    setIsAdding(true);
    try {
      const { data: boatData, error: boatError } = await supabase
        .from("bateaux")
        .select("id")
        .eq("nom", formData.bateau_nom)
        .single();

      if (boatError || !boatData) {
        toast.error("Bateau non trouvé. Vérifiez le nom.");
        return;
      }

      const { error } = await supabase
        .from("voyages")
        .insert({
          code_voyage: formData.code_voyage,
          idbateau: boatData.id,
          description: formData.description || "",
          date_depart: new Date(formData.date_depart).toISOString(),
          statut: formData.statut || "prevu",
        });

      if (error) {
        toast.error(`Erreur création voyage : ${error.message}`);
        return;
      }

      toast.success("Voyage ajouté avec succès !");
      setAddModalOpen(false);
      setReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error("Une erreur est survenue lors de l'ajout.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddPavilion = async (formData: any) => {
    setIsAdding(true);
    try {
      const { error } = await supabase
        .from("pavillons")
        .insert({
          nom: formData.nom,
          idbateau: parseInt(formData.bateau_id || "0"),
          classe: formData.classe,
          capacite_max: parseInt(formData.capacite_max || "0"),
          unite: formData.unite,
          prix_unitaire: parseFloat(formData.prix_unitaire || "0"),
          prix_tonne: formData.prix_tonne ? parseFloat(formData.prix_tonne) : null,
          devise: formData.devise || "FC",
        });

      if (error) {
        toast.error(`Erreur création pavillon : ${error.message}`);
        return;
      }

      toast.success("Pavillon ajouté avec succès !");
      setAddModalOpen(false);
      setReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error("Une erreur est survenue lors de l'ajout.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddPort = async (formData: any) => {
    setIsAdding(true);
    try {
      const { error } = await supabase
        .from("ports")
        .insert({
          nom: formData.nom,
          ville: formData.ville,
          localisation: formData.localisation,
          statut: formData.statut || "actif",
        });

      if (error) {
        toast.error(`Erreur création port : ${error.message}`);
        return;
      }

      toast.success("Port ajouté avec succès !");
      setAddModalOpen(false);
      setReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error("Une erreur est survenue lors de l'ajout.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddDock = async (formData: any) => {
    setIsAdding(true);
    try {
      const { data: portData, error: portError } = await supabase
        .from("ports")
        .select("id")
        .eq("nom", formData.port_nom)
        .single();

      if (portError || !portData) {
        toast.error("Port non trouvé. Vérifiez le nom.");
        return;
      }

      const { error } = await supabase
        .from("quais")
        .insert({
          nom: formData.nom,
          idport: portData.id,
          numero: parseInt(formData.numero || "0"),
          capacite: parseInt(formData.capacite || "0"),
          type_quai: formData.type_quai || "mixte",
          statut: formData.statut || "libre",
        });

      if (error) {
        toast.error(`Erreur création quai : ${error.message}`);
        return;
      }

      toast.success("Quai ajouté avec succès !");
      setAddModalOpen(false);
      setReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error("Une erreur est survenue lors de l'ajout.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddClient = async (formData: any) => {
    setIsAdding(true);
    try {
      const { error } = await supabase
        .from("client")
        .insert({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          telephone: formData.telephone,
          adresse: formData.adresse || "",
          nationalite: formData.nationalite || "",
          genre: formData.genre || null,
          statut: formData.statut || "actif",
          date_inscription: new Date().toISOString(),
        });

      if (error) {
        toast.error(`Erreur création client : ${error.message}`);
        return;
      }

      toast.success("Client ajouté avec succès !");
      setAddModalOpen(false);
      setReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error("Une erreur est survenue lors de l'ajout.");
    } finally {
      setIsAdding(false);
    }
  };

  // ===== CONFIGURATION DES MODALS D'AJOUT =====
  const addModalConfigs: Record<string, { title: string; icon: any; fields: any[]; onSubmit: (data: any) => Promise<void> }> = {
    boat: {
      title: `Ajouter un bateau`,
      icon: Ship,
      fields: [
        { id: "nom", label: "Nom du bateau", type: "text", required: true },
        { id: "immatriculation", label: "Immatriculation", type: "text", required: true },
        { id: "type", label: "Type", type: "select", options: ["cargo", "mixte", "passager"] },
        { id: "capacite_totale", label: "Capacité totale", type: "number", required: true, min: 0 },
        { id: "capacite_passager", label: "Capacité passagers", type: "number", min: 0 },
        { id: "capacite_cargaison", label: "Capacité cargaison", type: "number", min: 0 },
        { id: "statut", label: "Statut", type: "select", options: ["en_service", "en_maintenance", "hors_service"] },
      ],
      onSubmit: handleAddBoat,
    },
    voyage: {
      title: `Ajouter un voyage`,
      icon: Sailboat,
      fields: [
        { id: "code_voyage", label: "Code voyage", type: "text", required: true },
        { id: "bateau_nom", label: "Nom du bateau", type: "text", required: true, placeholder: "Ex: MV Lumière" },
        { id: "description", label: "Description", type: "text" },
        { id: "date_depart", label: "Date de départ", type: "datetime-local", required: true },
        { id: "statut", label: "Statut", type: "select", options: ["prevu", "en_cours", "termine", "annule"] },
      ],
      onSubmit: handleAddVoyage,
    },
    pavilion: {
      title: `Ajouter un pavillon`,
      icon: Ticket,
      fields: [
        { id: "nom", label: "Nom du pavillon", type: "text", required: true },
        { id: "bateau_id", label: "ID du bateau", type: "number", required: true },
        { id: "classe", label: "Classe", type: "text", required: true },
        { id: "capacite_max", label: "Capacité max", type: "number", required: true, min: 0 },
        { id: "unite", label: "Unité", type: "text", required: true },
        { id: "prix_unitaire", label: "Prix unitaire", type: "number", required: true, min: 0 },
        { id: "prix_tonne", label: "Prix à la tonne", type: "number", min: 0 },
        { id: "devise", label: "Devise", type: "select", options: ["FC", "USD"] },
      ],
      onSubmit: handleAddPavilion,
    },
    port: {
      title: `Ajouter un port`,
      icon: Warehouse,
      fields: [
        { id: "nom", label: "Nom du port", type: "text", required: true },
        { id: "ville", label: "Ville", type: "text", required: true },
        { id: "localisation", label: "Localisation", type: "text", required: true },
        { id: "statut", label: "Statut", type: "select", options: ["actif", "hors_service"] },
      ],
      onSubmit: handleAddPort,
    },
    dock: {
      title: `Ajouter un quai`,
      icon: AnchorIcon,
      fields: [
        { id: "nom", label: "Nom du quai", type: "text", required: true },
        { id: "port_nom", label: "Nom du port", type: "text", required: true, placeholder: "Ex: Port de Goma" },
        { id: "numero", label: "Numéro", type: "number", required: true, min: 0 },
        { id: "capacite", label: "Capacité", type: "number", required: true, min: 0 },
        { id: "type_quai", label: "Type", type: "select", options: ["passager", "cargaison", "mixte"] },
        { id: "statut", label: "Statut", type: "select", options: ["libre", "occupe", "maintenance"] },
      ],
      onSubmit: handleAddDock,
    },
    client: {
      title: `Ajouter un client`,
      icon: UserPlus,
      fields: [
        { id: "nom", label: "Nom", type: "text", required: true },
        { id: "prenom", label: "Prénom", type: "text", required: true },
        { id: "email", label: "Email", type: "email", required: true },
        { id: "telephone", label: "Téléphone", type: "text", required: true },
        { id: "adresse", label: "Adresse", type: "text" },
        { id: "nationalite", label: "Nationalité", type: "text" },
        { id: "genre", label: "Genre", type: "select", options: ["M", "F", "Autre"] },
        { id: "statut", label: "Statut", type: "select", options: ["actif", "inactif"] },
      ],
      onSubmit: handleAddClient,
    },
  };

  const addConfig = addModalConfigs[addModalType] || addModalConfigs.boat;

  // ===== MODALS RÉSERVATIONS =====
  const openReservationEdit = (row: any) => {
    const rec = reservations.find((r) => r.reference === row[0] || String(r.id) === row[0]);
    if (!rec) return toast.error("Réservation introuvable");
    setSelectedItem(rec);
    setCurrentEditFields([
      { id: "statut", label: "Statut", type: "select", options: ["confirme", "arrive", "annule"] },
    ]);
    setCrudMode("reservation");
    setEditModalOpen(true);
  };

  const openReservationDelete = (row: any) => {
    const rec = reservations.find((r) => r.reference === row[0] || String(r.id) === row[0]);
    setCrudMode("reservation");
    setSelectedItem(rec || { id: Number(row[0]), reference: row[0] });
    setDeleteModalOpen(true);
  };

  const handleEditReservation = async (formData: any) => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      const target = formData.statut || selectedItem.statut || "confirme";
      const { error } = await supabase
        .from("reservations")
        .update({ statut: target })
        .eq("id", selectedItem.id);
      if (error) return toast.error(`Erreur modification réservation : ${error.message}`);
      toast.success("Réservation modifiée avec succès !");
      setEditModalOpen(false);
      setSelectedItem(null);
      setReloadKey((k) => k + 1);
    } catch {
      toast.error("Une erreur est survenue lors de la modification.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReservation = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("reservations").delete().eq("id", selectedItem.id);
      if (error) return toast.error(`Erreur suppression réservation : ${error.message}`);
      toast.success("Réservation supprimée avec succès !");
      setDeleteModalOpen(false);
      setSelectedItem(null);
      setReloadKey((k) => k + 1);
    } catch {
      toast.error("Une erreur est survenue lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ===== DISPATCHERS CRUD =====
  const handleEditSave = (formData: any) => {
    switch (crudMode) {
      case "boat": return handleUpdateBoat(formData);
      case "voyage": return handleUpdateVoyage(formData);
      case "pavilion": return handleUpdatePavilion(formData);
      case "port": return handleUpdatePort(formData);
      case "dock": return handleUpdateDock(formData);
      default: return handleEditReservation(formData);
    }
  };

  const handleDeleteConfirm = () => {
    switch (crudMode) {
      case "boat": return handleDeleteBoat();
      case "voyage": return handleDeleteVoyage();
      case "pavilion": return handleDeletePavilion();
      case "port": return handleDeletePort();
      case "dock": return handleDeleteDock();
      default: return handleDeleteReservation();
    }
  };

  const deleteItemName = (selectedItem?.nom || selectedItem?.reference || selectedItem?.code_voyage || selectedItem?.name || "cet élément");

  const handleClientView = (row: any) => {
    const rec = rawClients.find((c) => c.id === Number(row[0]) || `${c.prenom || ""} ${c.nom || ""}`.trim() === row[0] || c.email === row[1]);
    setSelectedItem(rec || { nom: row[0], email: row[1], telephone: row[2] });
    setViewModalOpen(true);
  };

  const handleClientEdit = (row: any) => {
    const rec = rawClients.find((c) => c.id === Number(row[0]) || `${c.prenom || ""} ${c.nom || ""}`.trim() === row[0] || c.email === row[1]);
    if (!rec) return toast.error("Client introuvable");
    setSelectedClient(rec);
    setEditClientModalOpen(true);
  };

  const handleClientDelete = (row: any) => {
    const rec = rawClients.find((c) => c.id === Number(row[0]) || `${c.prenom || ""} ${c.nom || ""}`.trim() === row[0] || c.email === row[1]);
    setSelectedClient(rec || { id: Number(row[0]), nom: row[0] });
    setDeleteClientModalOpen(true);
  };

  // ===== DONNÉES GRAPHIQUES =====
  const reservationCounts = useMemo(() => {
    const counts: Record<string, number> = { "En attente": 0, "Confirmée": 0, "Payée": 0, "Annulée": 0 };
    filteredReservations.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, [filteredReservations]);

  const statusChartData = useMemo(() => ({
    labels: Object.keys(reservationCounts),
    datasets: [
      {
        data: Object.values(reservationCounts),
        backgroundColor: ["#f59e0b", "#10b981", "#3b82f6", "#ef4444"],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }), [reservationCounts]);

  const statusChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" as const, labels: { usePointStyle: true, padding: 16 } } },
  }), []);

  const trendChartData = useMemo(() => {
    const byDay: Record<string, number> = {};
    reservations.forEach((r) => {
      const day = r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : "Inconnu";
      byDay[day] = (byDay[day] || 0) + 1;
    });
    const labels = Object.keys(byDay);
    return {
      labels,
      datasets: [
        {
          label: "Réservations",
          data: labels.map((d) => byDay[d]),
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.12)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [reservations]);

  const trendChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  }), []);

  const revenueChartData = useMemo(() => ({
    labels: ["Paiements reçus", "En attente"],
    datasets: [
      {
        label: "Montant (FC)",
        data: [metrics.totalRevenue, metrics.pendingPayments],
        backgroundColor: ["#10b981", "#f59e0b"],
        borderRadius: 8,
      },
    ],
  }), [metrics.totalRevenue, metrics.pendingPayments]);

  const revenueChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" as const } },
    scales: { y: { beginAtZero: true } },
  }), []);

  // ===== CLIENTS TABLE =====
  const clientRowArray = rawClients.map((c) => [
    c.id,
    `${c.prenom || ""} ${c.nom || ""}`.trim() || "—",
    c.email || "—",
    c.telephone || "—",
    c.date_inscription ? new Date(c.date_inscription).toLocaleDateString("fr-FR") : "—",
    c.statut || "—",
  ]);

  // ===== RENDER =====
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">Chargement de l'administration...</p>
          {notice && <p className="text-sm text-red-500 mt-2">{notice}</p>}
        </div>
      </div>
    );
  }

  const activeNavigation = navigation.find((n) => n.id === section);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        section={section}
        setSection={setSection}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        pendingReservations={pendingReservations}
        isDark={isDark}
        toggleDark={() => setIsDark((v) => !v)}
        onLogout={logout}
      />

      <div className={`transition-all duration-300 lg:ml-64`}>
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <div className="flex items-center gap-3">
              <button
                className="p-2 rounded-lg hover:bg-gray-100 lg:hidden transition-colors"
                type="button"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Administration</span>
                <ChevronRight size={14} className="text-gray-300" />
                <strong className="text-gray-900 dark:text-white">{activeNavigation?.label}</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                title="Actualiser"
              >
                <RefreshCw size={17} />
              </button>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
                onClick={() => setIsDark((v) => !v)}
                title={isDark ? "Mode clair" : "Mode sombre"}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 relative transition-colors"
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-blue-500/25">
                A
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* ===== VUE D'ENSEMBLE ===== */}
          {section === "overview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-6">
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Activité enregistrée</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold text-blue-600">{metrics.todayReservations + pendingReservations}</div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{metrics.todayReservations} aujourd&apos;hui</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{pendingReservations} en attente</p>
                    </div>
                  </div>
                  <div className="mt-5 h-40">
                    {trendChartData.labels.length > 0 ? (
                      <Line data={trendChartData} options={trendChartOptions} />
                    ) : (
                      <p className="text-sm text-gray-400">Aucune donnée de tendance</p>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Réservations par statut</h3>
                  <div className="h-48 relative">
                    <Doughnut data={statusChartData} options={statusChartOptions} />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Revenus & paiements</h3>
                  <div className="h-48 relative">
                    <Bar data={revenueChartData} options={revenueChartOptions} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Actions rapides</h3>
                  <div className="space-y-2">
                    <button
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left text-sm"
                      type="button"
                      onClick={() => setSection("reservations")}
                    >
                      <div className="p-1.5 bg-amber-100 rounded-lg"><Anchor size={14} className="text-amber-600" /></div>
                      <span className="font-medium text-gray-700 dark:text-gray-200">{pendingReservations} réservation(s) en attente</span>
                      <ChevronRight size={14} className="ml-auto text-gray-400" />
                    </button>
                    <button
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left text-sm"
                      type="button"
                      onClick={() => setSection("payments")}
                    >
                      <div className="p-1.5 bg-blue-100 rounded-lg"><CircleDollarSign size={14} className="text-blue-600" /></div>
                      <span className="font-medium text-gray-700 dark:text-gray-200">{metrics.pendingPayments} paiement(s) en attente</span>
                      <ChevronRight size={14} className="ml-auto text-gray-400" />
                    </button>
                    <button
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left text-sm"
                      type="button"
                      onClick={() => setSection("fleet")}
                    >
                      <div className="p-1.5 bg-purple-100 rounded-lg"><Ship size={14} className="text-purple-600" /></div>
                      <span className="font-medium text-gray-700 dark:text-gray-200">{metrics.plannedVoyages} voyage(s) planifié(s)</span>
                      <ChevronRight size={14} className="ml-auto text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Activité récente</h3>
                  <div className="space-y-3">
                    {adminLogs.length === 0 ? (
                      <p className="text-sm text-gray-400">Aucune activité enregistrée</p>
                    ) : (
                      adminLogs.slice(0, 6).map((log) => (
                        <div key={log.id} className="flex items-start gap-3">
                          <div className="p-1.5 bg-cyan-100 rounded-lg mt-0.5"><History size={14} className="text-cyan-600" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 dark:text-gray-200 truncate">{log.action || "Action"}</p>
                            <p className="text-xs text-gray-400">
                              {log.actor_email || "admin"} · {log.created_at ? new Date(log.created_at).toLocaleString("fr-FR") : ""}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== RÉSERVATIONS ===== */}
          {section === "reservations" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
              <AdminHeading
                eyebrow="Opérations · Supabase"
                title="Réservations"
                description="Données chargées directement depuis la table reservations."
                action={
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
                      type="button"
                      onClick={() => formatExport(filteredReservations)}
                    >
                      <Download size={16} /> Exporter CSV
                    </button>
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
                      type="button"
                      onClick={exportPDF}
                    >
                      <FileText size={16} /> Export PDF
                    </button>
                  </div>
                }
              />

              <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 shadow-sm">
                <div className="flex-1 min-w-[180px]">
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
                      placeholder="Rechercher par référence, client, code..."
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-gray-900 focus:border-blue-400 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as FilterStatus); setCurrentPage(1); }}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                >
                  <option value="tous">Tous les statuts</option>
                  <option value="en_attente">En attente</option>
                  <option value="confirmee">Confirmée</option>
                  <option value="payee">Payée</option>
                  <option value="annulee">Annulée</option>
                </select>
                <select
                  value={periodFilter}
                  onChange={(e) => { setPeriodFilter(e.target.value as FilterPeriod); setCurrentPage(1); }}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                >
                  <option value="tous">Toutes périodes</option>
                  <option value="aujourdhui">Aujourd&apos;hui</option>
                  <option value="semaine">Cette semaine</option>
                  <option value="mois">Ce mois</option>
                </select>
                <span className="text-xs text-gray-400">{filteredReservations.length} résultats</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 shadow-sm">
                <button
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300"
                  type="button"
                  onClick={toggleSelectAllVisible}
                >
                  <CheckCheck size={14} /> Tout sélectionner
                </button>
                {selectedReservations.size > 0 && (
                  <>
                    <span className="text-xs text-gray-400">{selectedReservations.size} sélectionnée(s)</span>
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors"
                      type="button"
                      onClick={() => bulkAction("confirm")}
                    >
                      <Check size={14} /> Confirmer
                    </button>
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm transition-colors"
                      type="button"
                      onClick={() => bulkAction("cancel")}
                    >
                      <X size={14} /> Annuler
                    </button>
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                      type="button"
                      onClick={exportSelected}
                    >
                      <Download size={14} /> Exporter
                    </button>
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors"
                      type="button"
                      onClick={() => setSelectedReservations(new Set())}
                    >
                      <XCircle size={14} /> Effacer
                    </button>
                  </>
                )}
              </div>

              <DataTableWithActions
                headers={["Référence", "Client", "Trajet", "Date", "Montant", "Statut"]}
                rows={paginatedReservations.map((row) => [row.reference, row.client, row.route, row.date, row.amount, row.status])}
                title="Réservations"
                onView={handleView}
                onEdit={openReservationEdit}
                onDelete={openReservationDelete}
                onConfirm={confirmReservationRow}
                onCancel={cancelReservationRow}
                selectable
                selectedIds={selectedReservations}
                onToggleSelect={toggleReservationSelection}
                idOf={(row) => Number(String(row[0]).replace("KP-", ""))}
                loading={isLoading}
              />
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredReservations.length}
                  itemsPerPage={itemsPerPage}
                />
              )}
            </motion.div>
          )}

          {/* ===== PAIEMENTS ===== */}
          {section === "payments" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
              <AdminHeading
                eyebrow="Finance · Supabase"
                title="Paiements"
                description="Paiements chargés directement depuis la table paiements."
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard label="Paiements reçus" value={adminRows.payments.length - metrics.pendingPayments} icon={Check} color="emerald" />
                <StatCard label="En attente" value={metrics.pendingPayments} icon={Activity} color="amber" />
                <StatCard label="Montant encaissé" value={metrics.revenue} icon={CircleDollarSign} color="blue" />
              </div>
              <DataTableWithActions
                headers={["Référence", "Mode", "Date", "Montant", "Statut"]}
                rows={adminRows.payments.slice((getPage("payments") - 1) * itemsPerPageState, getPage("payments") * itemsPerPageState)}
                title="Paiements"
              />
              <Pagination
                currentPage={getPage("payments")}
                totalPages={Math.ceil(adminRows.payments.length / itemsPerPageState)}
                onPageChange={(p) => setPage("payments", p)}
                totalItems={adminRows.payments.length}
                itemsPerPage={itemsPerPageState}
              />
            </motion.div>
          )}

          {/* ===== FLOTTE & VOYAGES ===== */}
          {section === "fleet" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
              <AdminHeading
                eyebrow="Opérations · Supabase"
                title="Flotte & voyages"
                description="Bateaux et départs publiés depuis Supabase."
                action={
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
                      type="button"
                      onClick={() => { setAddModalType("voyage"); setAddModalOpen(true); }}
                    >
                      <Plus size={16} /> Publier un voyage
                    </button>
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                      type="button"
                      onClick={() => { setAddModalType("boat"); setAddModalOpen(true); }}
                    >
                      <Plus size={16} /> Ajouter un bateau
                    </button>
                  </div>
                }
              />
              <DataTableWithActions
                headers={["ID", "Nom", "Immatriculation", "Type", "Capacité", "Statut"]}
                rows={rawBoats
                  .map((b) => [b.id, b.nom, b.immatriculation, b.type, `${b.capacite_totale || 0} (P:${b.capacite_passager || 0}/C:${b.capacite_cargaison || 0})`, b.statut])
                  .slice((getPage("boats") - 1) * itemsPerPageState, getPage("boats") * itemsPerPageState)}
                title="Bateaux"
                onView={(row) => { setSelectedItem(rawBoats.find((b) => b.id === Number(row[0])) || null); setViewModalOpen(true); }}
                onEdit={openBoatEdit}
                onDelete={openBoatDelete}
              />
              <Pagination
                currentPage={getPage("boats")}
                totalPages={Math.ceil(rawBoats.length / itemsPerPageState)}
                onPageChange={(p) => setPage("boats", p)}
                totalItems={rawBoats.length}
                itemsPerPage={itemsPerPageState}
              />
              <DataTableWithActions
                headers={["ID", "Code", "Bateau", "Description", "Départ", "Statut"]}
                rows={rawVoyages
                  .map((v) => [v.id, v.code_voyage, v.bateau?.nom || "—", v.description || "—", v.date_depart ? new Date(v.date_depart).toLocaleDateString("fr-FR") : "—", v.statut || "—"])
                  .slice((getPage("voyages") - 1) * itemsPerPageState, getPage("voyages") * itemsPerPageState)}
                title="Voyages"
                onView={(row) => { setSelectedItem(rawVoyages.find((v) => v.id === Number(row[0])) || null); setViewModalOpen(true); }}
                onEdit={openVoyageEdit}
                onDelete={openVoyageDelete}
              />
              <Pagination
                currentPage={getPage("voyages")}
                totalPages={Math.ceil(rawVoyages.length / itemsPerPageState)}
                onPageChange={(p) => setPage("voyages", p)}
                totalItems={rawVoyages.length}
                itemsPerPage={itemsPerPageState}
              />
            </motion.div>
          )}

          {/* ===== PAVILLONS & TARIFS ===== */}
          {section === "pavilions" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
              <AdminHeading
                eyebrow="Tarifs · Supabase"
                title="Pavillons"
                description="Capacités et tarifs rattachés aux bateaux."
                action={
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-xl transition-colors"
                    type="button"
                    onClick={() => { setAddModalType("pavilion"); setAddModalOpen(true); }}
                  >
                    <Plus size={16} /> Ajouter un pavillon
                  </button>
                }
              />
              <DataTableWithActions
                headers={["ID", "Nom", "Bateau", "Classe", "Capacité", "Prix"]}
                rows={rawPavilions
                  .map((p) => [p.id, p.nom, p.bateau?.nom || "—", p.classe || "—", `${p.capacite_max || 0} ${p.unite || ""}`, `${p.prix_unitaire || 0} ${p.devise || "FC"}`])
                  .slice((getPage("pavilions") - 1) * itemsPerPageState, getPage("pavilions") * itemsPerPageState)}
                title="Pavillons & tarifs"
                onView={(row) => { setSelectedItem(rawPavilions.find((p) => p.id === Number(row[0])) || null); setViewModalOpen(true); }}
                onEdit={openPavilionEdit}
                onDelete={openPavilionDelete}
              />
              <Pagination
                currentPage={getPage("pavilions")}
                totalPages={Math.ceil(rawPavilions.length / itemsPerPageState)}
                onPageChange={(p) => setPage("pavilions", p)}
                totalItems={rawPavilions.length}
                itemsPerPage={itemsPerPageState}
              />
            </motion.div>
          )}

          {/* ===== PORTS & QUAIS ===== */}
          {section === "infrastructure" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
              <AdminHeading
                eyebrow="Référentiel · Supabase"
                title="Ports & quais"
                description="Ports et quais chargés directement depuis Supabase."
                action={
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
                      type="button"
                      onClick={() => { setAddModalType("port"); setAddModalOpen(true); }}
                    >
                      <Plus size={16} /> Ajouter un port
                    </button>
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                      type="button"
                      onClick={() => { setAddModalType("dock"); setAddModalOpen(true); }}
                    >
                      <Plus size={16} /> Ajouter un quai
                    </button>
                  </div>
                }
              />
              <DataTableWithActions
                headers={["ID", "Nom", "Ville", "Localisation", "Statut"]}
                rows={rawPorts
                  .map((p) => [p.id, p.nom, p.ville || "—", p.localisation || "—", p.statut || "—"])
                  .slice((getPage("ports") - 1) * itemsPerPageState, getPage("ports") * itemsPerPageState)}
                title="Ports"
                onView={(row) => { setSelectedItem(rawPorts.find((p) => p.id === Number(row[0])) || null); setViewModalOpen(true); }}
                onEdit={openPortEdit}
                onDelete={openPortDelete}
              />
              <Pagination
                currentPage={getPage("ports")}
                totalPages={Math.ceil(rawPorts.length / itemsPerPageState)}
                onPageChange={(p) => setPage("ports", p)}
                totalItems={rawPorts.length}
                itemsPerPage={itemsPerPageState}
              />
              <DataTableWithActions
                headers={["ID", "Nom", "Port", "N°", "Capacité", "Statut"]}
                rows={rawDocks
                  .map((d) => [d.id, d.nom, d.port?.nom || "—", d.numero || "—", `${d.type_quai || ""} · ${d.capacite || "—"}`, d.statut || "—"])
                  .slice((getPage("docks") - 1) * itemsPerPageState, getPage("docks") * itemsPerPageState)}
                title="Quais"
                onView={(row) => { setSelectedItem(rawDocks.find((d) => d.id === Number(row[0])) || null); setViewModalOpen(true); }}
                onEdit={openDockEdit}
                onDelete={openDockDelete}
              />
              <Pagination
                currentPage={getPage("docks")}
                totalPages={Math.ceil(rawDocks.length / itemsPerPageState)}
                onPageChange={(p) => setPage("docks", p)}
                totalItems={rawDocks.length}
                itemsPerPage={itemsPerPageState}
              />
            </motion.div>
          )}

          {/* ===== CLIENTS ===== */}
          {section === "people" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
              <AdminHeading
                eyebrow="Utilisateurs · Supabase"
                title="Clients"
                description="Clients chargés directement depuis la table client."
                action={
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
                    type="button"
                    onClick={() => { setAddModalType("client"); setAddModalOpen(true); }}
                  >
                    <Plus size={16} /> Ajouter un client
                  </button>
                }
              />
              <DataTableWithActions
                headers={["ID", "Nom", "Email", "Téléphone", "Inscription", "Statut"]}
                rows={clientRowArray.slice((getPage("clients") - 1) * itemsPerPageState, getPage("clients") * itemsPerPageState)}
                title="Clients"
                onView={handleClientView}
                onEdit={handleClientEdit}
                onDelete={handleClientDelete}
              />
              <Pagination
                currentPage={getPage("clients")}
                totalPages={Math.ceil(clientRowArray.length / itemsPerPageState)}
                onPageChange={(p) => setPage("clients", p)}
                totalItems={clientRowArray.length}
                itemsPerPage={itemsPerPageState}
              />
            </motion.div>
          )}

          {/* ===== HISTORIQUE ===== */}
          {section === "logs" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
              <AdminHeading
                eyebrow="Traçabilité"
                title="Historique d'activité"
                description="Logs des actions effectuées par les administrateurs."
              />
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                {adminLogs.length === 0 ? (
                  <div className="p-10 text-center">
                    <History size={32} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Aucun log d'activité enregistré</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {adminLogs.map((log) => (
                      <div key={log.id} className="px-5 py-4 flex items-start gap-4">
                        <div className="p-2 bg-cyan-100 rounded-lg mt-0.5"><History size={16} className="text-cyan-600" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{log.action || "Action"}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 break-words">
                            {log.entity_type || ""} {log.actor_email ? `par ${log.actor_email}` : ""}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {log.created_at ? new Date(log.created_at).toLocaleString("fr-FR") : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ===== PARAMÈTRES ===== */}
          {section === "settings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
              <AdminHeading
                eyebrow="Configuration"
                title="Paramètres"
                description="Configurez les règles opérationnelles de KivuPort."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsCard icon={Settings} title="Général" text="Nom du service, coordonnées et devise par défaut." />
                <SettingsCard icon={Bell} title="Notifications" text="Emails de réservation, paiement et alertes opérationnelles." />
                <SettingsCard icon={SlidersHorizontal} title="Sécurité" text="Sessions, vérification email et permissions d'équipe." />
                <SettingsCard icon={BarChart3} title="Apparence" text={`Thème actuel : ${isDark ? "sombre" : "clair"}.`} onClick={() => setIsDark((v) => !v)} />
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
        title="Détails"
      />

      <EditModal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedItem(null); }}
        onSave={handleEditSave}
        data={selectedItem}
        title={crudMode === "reservation" ? "Modifier la réservation" : "Modifier l'enregistrement"}
        fields={currentEditFields}
        isSaving={isSaving}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setSelectedItem(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={deleteItemName}
        isDeleting={isDeleting}
      />

      <AddModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={addConfig.onSubmit}
        title={addConfig.title}
        icon={addConfig.icon}
        fields={addConfig.fields}
        isSaving={isAdding}
      />

      <EditClientModal
        isOpen={editClientModalOpen}
        onClose={() => { setEditClientModalOpen(false); setSelectedClient(null); }}
        onSave={handleEditClient}
        data={selectedClient}
        isSaving={isSavingClient}
      />

      <DeleteClientModal
        isOpen={deleteClientModalOpen}
        onClose={() => { setDeleteClientModalOpen(false); setSelectedClient(null); }}
        onConfirm={handleDeleteClient}
        clientName={[selectedClient?.prenom, selectedClient?.nom].filter(Boolean).join(" ") || selectedClient?.nom || "ce client"}
        isDeleting={isDeletingClient}
      />
    </div>
  );
}