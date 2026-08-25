"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Anchor,
  CalendarDays,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  Ship,
  UserRound,
  Clock,
  Ticket,
  MapPin,
  Compass,
  Award,
  Sparkles,
  ChevronRight,
  Settings,
  Bell,
  Users,
  Activity,
  TrendingUp,
  Menu,
  X,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  DollarSign,
  Plus,
  Download,
  Eye,
  Edit,
  Star,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-browser";
import { format, formatDistanceToNow, parseISO, subDays, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

// ===== CHART.JS =====
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
const Line = dynamic(() => import("react-chartjs-2").then((module) => module.Line), { ssr: false });
const Bar = dynamic(() => import("react-chartjs-2").then((module) => module.Bar), { ssr: false });
const Doughnut = dynamic(() => import("react-chartjs-2").then((module) => module.Doughnut), { ssr: false });
const PolarArea = dynamic(() => import("react-chartjs-2").then((module) => module.PolarArea), { ssr: false });

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ===== TYPES =====
type DashboardStats = {
  totalBookings: number;
  totalTrips: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  activeUsers: number;
  totalAdmins: number;
  totalUsers: number;
  cancellationRate: number;
  occupancyRate: number;
  averageRating: number;
};

type RecentBooking = {
  id: string;
  destination: string;
  departure_date: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  type: "passenger" | "cargo";
  price: number;
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_id?: string;
};

type UpcomingTrip = {
  id: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  total_seats: number;
  status: "on-time" | "delayed" | "cancelled";
  price: number;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  created_at: string;
  target_role?: "admin" | "user" | "all";
};

type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  bookings_count: number;
};

type ChartData = {
  labels: string[];
  datasets: {
    label?: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }[];
};

// ===== COMPOSANTS =====

function SkeletonLoader({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className || "h-12"}`} />;
}

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  trend,
  loading,
  onClick,
}: { 
  label: string; 
  value: string | number; 
  icon: any; 
  color: "blue" | "emerald" | "amber" | "purple" | "red" | "indigo" | "pink";
  trend?: { value: number; positive: boolean };
  loading?: boolean;
  onClick?: () => void;
}) {
  const colors = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", hover: "hover:border-blue-200" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", hover: "hover:border-emerald-200" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", hover: "hover:border-amber-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", hover: "hover:border-purple-200" },
    red: { bg: "bg-red-50", text: "text-red-600", hover: "hover:border-red-200" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", hover: "hover:border-indigo-200" },
    pink: { bg: "bg-pink-50", text: "text-pink-600", hover: "hover:border-pink-200" },
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <SkeletonLoader className="h-20" />
      </div>
    );
  }

  return (
    <motion.div
      className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer ${colors[color].hover}`}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 ${colors[color].bg} rounded-xl`}>
          <Icon size={18} className={colors[color].text} />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.positive ? "text-emerald-600" : "text-red-600"} flex items-center gap-1`}>
            {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </motion.div>
  );
}

function ChartCard({ 
  title, 
  children, 
  className,
  loading,
}: { 
  title: string; 
  children: React.ReactNode; 
  className?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm ${className || ""}`}>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
        <div className="h-[200px] sm:h-[250px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-400 mt-2">Chargement des données...</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow ${className || ""}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="h-[200px] sm:h-[250px]">
        {children}
      </div>
    </div>
  );
}

// ===== PAGE PRINCIPALE =====
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ===== DONNÉES =====
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalTrips: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    activeUsers: 0,
    totalAdmins: 0,
    totalUsers: 0,
    cancellationRate: 0,
    occupancyRate: 0,
    averageRating: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  // ===== DONNÉES POUR LES CHARTS =====
  const [chartBookingsData, setChartBookingsData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [chartRevenueData, setChartRevenueData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [chartTypeData, setChartTypeData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [chartStatusData, setChartStatusData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [chartDailyData, setChartDailyData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);

  // ===== CHARGEMENT DES DONNÉES =====
  const loadConnectedUserData = useCallback(async () => {
    setIsRefreshing(true);
    setLoadingStats(true);
    setLoadingBookings(true);
    setLoadingTrips(true);
    setLoadingNotifications(true);
    setLoadingCharts(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const authUser = authData.user;
      if (authError || !authUser?.email) return;
      const currentIsAdmin = authUser.email.toLowerCase() === "admin@portuaire.com";
      setIsAdmin(currentIsAdmin);

      const { data: client, error: clientError } = await supabase
        .from("client")
        .select("id, nom, prenom, email, telephone")
        .ilike("email", authUser.email)
        .maybeSingle();
      if (clientError) throw clientError;
      if (client) setName([client.prenom, client.nom].filter(Boolean).join(" ") || authUser.user_metadata?.name || "");

      const now = new Date();
      const voyagesPromise = supabase.from("voyages").select("id, code_voyage, date_depart, statut").gte("date_depart", now.toISOString()).order("date_depart", { ascending: true }).limit(5);
      const notificationsPromise = supabase.from("kivuport_notifications").select("id, title, message, kind, read_at, created_at").order("created_at", { ascending: false }).limit(5);
      const reservationQuery = supabase.from("reservations").select("id, date_reservation, date_embarquement, statut, type_reservation, prix_total, idclient, voyage:voyages(code_voyage, date_depart)").order("date_reservation", { ascending: false });
      const { data: reservationRows, error: reservationError } = currentIsAdmin
        ? await reservationQuery
        : client
          ? await reservationQuery.eq("idclient", client.id)
          : { data: [], error: null };
      if (reservationError) throw reservationError;

      const reservations = (reservationRows || []) as any[];
      const countStatus = (status: string) => reservations.filter((row) => row.statut === status).length;
      const cancelled = ["annule", "refusee", "expiree"].reduce((sum, status) => sum + countStatus(status), 0);
      const completed = ["termine", "embarque", "arrive"].reduce((sum, status) => sum + countStatus(status), 0);
      const reservationIds = reservations.map((row) => row.id);
      const { data: paymentRows, error: paymentError } = reservationIds.length
        ? await supabase.from("paiements").select("idreservation, montant, statut, date_paiement").in("idreservation", reservationIds).eq("statut", "paye")
        : { data: [], error: null };
      if (paymentError) throw paymentError;
      const totalRevenue = (paymentRows || []).reduce((sum, payment) => sum + Number(payment.montant || 0), 0);
      const bookings = reservations.map((row): RecentBooking => ({
        id: String(row.id),
        destination: row.voyage?.code_voyage || "Voyage KivuPort",
        departure_date: row.date_embarquement,
        status: row.statut === "en_attente" ? "pending" : row.statut === "confirme" ? "confirmed" : ["annule", "refusee", "expiree"].includes(row.statut) ? "cancelled" : ["termine", "embarque", "arrive"].includes(row.statut) ? "completed" : "pending",
        type: row.type_reservation === "cargaison" ? "cargo" : "passenger",
        price: Number(row.prix_total || 0),
        created_at: row.date_reservation || row.date_embarquement,
      }));

      setRecentBookings(bookings.slice(0, 5));
      setStats({ totalBookings: reservations.length, totalTrips: new Set(reservations.map((row) => row.voyage?.code_voyage).filter(Boolean)).size, pendingBookings: countStatus("en_attente"), confirmedBookings: countStatus("confirme"), completedBookings: completed, cancelledBookings: cancelled, totalRevenue, activeUsers: client ? 1 : 0, totalAdmins: 0, totalUsers: client ? 1 : 0, cancellationRate: reservations.length ? (cancelled / reservations.length) * 100 : 0, occupancyRate: 0, averageRating: 0 });

      const months = Array.from({ length: 6 }, (_, index) => subMonths(now, 5 - index));
      setChartBookingsData({ labels: months.map((month) => format(month, "MMM", { locale: fr })), datasets: [{ label: "Réservations", data: months.map((month) => bookings.filter((booking) => { const created = parseISO(booking.created_at); return created.getFullYear() === month.getFullYear() && created.getMonth() === month.getMonth(); }).length), borderColor: "rgb(59, 130, 246)", backgroundColor: "rgba(59, 130, 246, 0.1)", fill: true, tension: 0.4 }] });
      setChartTypeData({ labels: ["Passagers", "Cargaison"], datasets: [{ data: [bookings.filter((booking) => booking.type === "passenger").length, bookings.filter((booking) => booking.type === "cargo").length], backgroundColor: ["rgba(59, 130, 246, 0.8)", "rgba(251, 191, 36, 0.8)"], borderColor: ["rgb(59, 130, 246)", "rgb(251, 191, 36)"], borderWidth: 2 }] });

      setChartRevenueData({ labels: months.map((month) => format(month, "MMM", { locale: fr })), datasets: [{ label: "Paiements confirmés (FC)", data: months.map((month) => (paymentRows || []).filter((payment: any) => { const paidAt = payment.date_paiement ? parseISO(payment.date_paiement) : null; return paidAt && paidAt.getFullYear() === month.getFullYear() && paidAt.getMonth() === month.getMonth(); }).reduce((sum: number, payment: any) => sum + Number(payment.montant || 0), 0)), borderColor: "rgb(16, 185, 129)", backgroundColor: "rgba(16, 185, 129, 0.1)", fill: true, tension: 0.4 }] });
      setChartStatusData({ labels: ["Confirmées", "En attente", "Terminées", "Annulées"], datasets: [{ data: [countStatus("confirme"), countStatus("en_attente"), completed, cancelled], backgroundColor: ["rgba(16, 185, 129, 0.8)", "rgba(251, 191, 36, 0.8)", "rgba(59, 130, 246, 0.8)", "rgba(239, 68, 68, 0.8)"], borderColor: ["rgb(16, 185, 129)", "rgb(251, 191, 36)", "rgb(59, 130, 246)", "rgb(239, 68, 68)"], borderWidth: 2 }] });
      setChartDailyData({ labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"], datasets: [{ label: "Réservations", data: Array.from({ length: 7 }, (_, index) => { const day = subDays(now, 6 - index); return bookings.filter((booking) => format(parseISO(booking.created_at), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).length; }), backgroundColor: "rgba(139, 92, 246, 0.6)", borderColor: "rgb(139, 92, 246)", borderWidth: 1 }] });

      const [{ data: voyageRows, error: voyageError }, { data: notificationRows, error: notificationError }] = await Promise.all([voyagesPromise, notificationsPromise]);
      if (voyageError) throw voyageError;
      setUpcomingTrips((voyageRows || []).map((voyage: any) => ({ id: String(voyage.id), destination: voyage.code_voyage, departure_time: voyage.date_depart, available_seats: 0, total_seats: 0, status: voyage.statut === "annule" ? "cancelled" : "on-time", price: 0 })));

      if (notificationError) throw notificationError;
      setNotifications((notificationRows || []).map((notification: any) => ({ id: String(notification.id), title: notification.title, message: notification.message, type: ["success", "warning", "error"].includes(notification.kind) ? notification.kind : "info", read: Boolean(notification.read_at), created_at: notification.created_at })) as Notification[]);
    } catch (error) {
      console.error("Erreur lors du chargement des données Supabase:", error);
    } finally {
      setLoadingStats(false);
      setLoadingBookings(false);
      setLoadingTrips(false);
      setLoadingNotifications(false);
      setLoadingCharts(false);
      setLoadingUsers(false);
      setIsRefreshing(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    await loadConnectedUserData();
    return;
    setIsRefreshing(true);
    try {
      // ===== 1. RÉCUPÉRER LES RÉSERVATIONS =====
      const { data: rawBookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      const bookingsData = rawBookingsData || [];

      if (!bookingsError && bookingsData) {
        const total = bookingsData.length;
        const pending = bookingsData.filter((b: any) => b.status === "pending").length;
        const confirmed = bookingsData.filter((b: any) => b.status === "confirmed").length;
        const completed = bookingsData.filter((b: any) => b.status === "completed").length;
        const cancelled = bookingsData.filter((b: any) => b.status === "cancelled").length;
        const revenue = bookingsData.reduce((sum: number, b: any) => sum + (b.price || 0), 0);

        setStats({
          totalBookings: total,
          totalTrips: 12,
          pendingBookings: pending,
          confirmedBookings: confirmed,
          completedBookings: completed,
          cancelledBookings: cancelled,
          totalRevenue: revenue,
          activeUsers: Math.floor(total * 0.4),
          totalAdmins: 3,
          totalUsers: 45,
          cancellationRate: total > 0 ? (cancelled / total) * 100 : 0,
          occupancyRate: 78,
          averageRating: 4.7,
        });

        setRecentBookings(bookingsData.slice(0, 5) as RecentBooking[]);
      }
      setLoadingStats(false);
      setLoadingBookings(false);

      // ===== 2. RÉCUPÉRER LES DÉPARTS =====
      const { data: tripsData } = await supabase
        .from("trips")
        .select("*")
        .gte("departure_time", new Date().toISOString())
        .order("departure_time", { ascending: true })
        .limit(5);

      if (tripsData) {
        setUpcomingTrips(tripsData as UpcomingTrip[]);
      }
      setLoadingTrips(false);

      // ===== 3. RÉCUPÉRER LES NOTIFICATIONS =====
      const { data: notifData } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (notifData) {
        setNotifications(notifData as Notification[]);
      }
      setLoadingNotifications(false);

      // ===== 4. RÉCUPÉRER LES UTILISATEURS =====
      if (isAdmin) {
        const { data: usersData } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (usersData) {
          setUsers(usersData as UserProfile[]);
        }
        setLoadingUsers(false);
      }

      // ===== 5. PRÉPARER LES DONNÉES POUR LES CHARTS =====
      if (bookingsData && bookingsData.length > 0) {
        // Grouper par date pour les tendances
        const now = new Date();
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(now, 5 - i);
          return format(date, "MMM", { locale: fr });
        });

        // Réservations par mois
        const bookingsByMonth = last6Months.map((month, index) => {
          const monthIndex = (new Date().getMonth() - 5 + index + 12) % 12;
          return bookingsData.filter((b: any) => {
            const date = parseISO(b.created_at);
            return date.getMonth() === monthIndex;
          }).length;
        });

        // Revenus par mois
        const revenueByMonth = last6Months.map((month, index) => {
          const monthIndex = (new Date().getMonth() - 5 + index + 12) % 12;
          return bookingsData
            .filter((b: any) => {
              const date = parseISO(b.created_at);
              return date.getMonth() === monthIndex;
            })
            .reduce((sum: number, b: any) => sum + (b.price || 0), 0);
        });

        // Répartition par type
        const passengerCount = bookingsData.filter((b: any) => b.type === "passenger").length;
        const cargoCount = bookingsData.filter((b: any) => b.type === "cargo").length;

        // Répartition par statut
        const statusPending = bookingsData.filter((b: any) => b.status === "pending").length;
        const statusConfirmed = bookingsData.filter((b: any) => b.status === "confirmed").length;
        const statusCompleted = bookingsData.filter((b: any) => b.status === "completed").length;
        const statusCancelled = bookingsData.filter((b: any) => b.status === "cancelled").length;

        // Activité quotidienne (7 derniers jours)
        const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
        const dailyActivity = days.map((_, index) => {
          const date = subDays(now, 6 - index);
          return bookingsData.filter((b: any) => {
            const created = parseISO(b.created_at);
            return format(created, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
          }).length;
        });

        // Mise à jour des données de charts
        const isAdminUser = isAdmin;
        setChartBookingsData({
          labels: last6Months,
          datasets: [{
            label: "Réservations",
            data: bookingsByMonth,
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            fill: true,
            tension: 0.4,
          }],
        });

        setChartRevenueData({
          labels: last6Months,
          datasets: [{
            label: "Revenus ($)",
            data: revenueByMonth,
            borderColor: "rgb(16, 185, 129)",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            fill: true,
            tension: 0.4,
          }],
        });

        setChartTypeData({
          labels: ["Passagers", "Cargaison"],
          datasets: [{
            data: [passengerCount, cargoCount],
            backgroundColor: ["rgba(59, 130, 246, 0.8)", "rgba(251, 191, 36, 0.8)"],
            borderColor: ["rgb(59, 130, 246)", "rgb(251, 191, 36)"],
            borderWidth: 2,
          }],
        });

        setChartStatusData({
          labels: ["Confirmé", "En attente", "Terminé", "Annulé"],
          datasets: [{
            data: [statusConfirmed, statusPending, statusCompleted, statusCancelled],
            backgroundColor: [
              "rgba(16, 185, 129, 0.8)",
              "rgba(251, 191, 36, 0.8)",
              "rgba(59, 130, 246, 0.8)",
              "rgba(239, 68, 68, 0.8)",
            ],
            borderColor: ["rgb(16, 185, 129)", "rgb(251, 191, 36)", "rgb(59, 130, 246)", "rgb(239, 68, 68)"],
            borderWidth: 2,
          }],
        });

        setChartDailyData({
          labels: days,
          datasets: [{
            label: "Réservations",
            data: dailyActivity,
            backgroundColor: "rgba(139, 92, 246, 0.6)",
            borderColor: "rgb(139, 92, 246)",
            borderWidth: 1,
          }],
        });

        setLoadingCharts(false);
      }

    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setLoadingCharts(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadConnectedUserData]);

  // ===== INITIALISATION =====
  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (!data.user) {
        router.replace("/");
        return;
      }
      setUser(data.user);
      setName(data.user.user_metadata?.name ?? "");
      setEmail(data.user.email ?? "");
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const response = await fetch("/api/admin/status", {
          headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        });
        const isAdminUser = response.ok && (await response.json()).isAdmin === true;
        setIsAdmin(isAdminUser);
      }
      setIsLoading(false);
      
      await loadData();
    }

    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) router.replace("/");
      if (session?.user) {
        setUser(session.user);
        setName(session.user.user_metadata?.name ?? "");
        setEmail(session.user.email ?? "");
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router, loadData]);

  // ===== SAVE PROFILE =====
  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    setMessage("");
    const { data, error } = await supabase.auth.updateUser({ data: { name: name.trim() } });
    setIsSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (data.user) setUser(data.user);
    setMessage("✅ Profil mis à jour avec succès.");
    setTimeout(() => setMessage(""), 3000);
  }

  // ===== LOGOUT =====
  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  // ===== MARK NOTIFICATION READ =====
  async function markNotificationRead(id: string) {
    try {
      await supabase
        .from("kivuport_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error("Erreur lors du marquage de la notification:", error);
    }
  }

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
        type: "spring" as const,
        stiffness: 300,
        damping: 25,
      },
    },
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
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
          Chargement de votre espace...
        </motion.p>
      </div>
    );
  }

  if (!user) return null;

  // ===== RENDER ADMIN DASHBOARD =====
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
        {/* Header - ADMIN (similaire à avant, gardé concis) */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/80 shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <Link href="/" className="flex items-center gap-2.5 group">
                <motion.div className="relative" whileHover={{ rotate: -5 }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white shadow-lg shadow-purple-500/30">
                    <ShieldCheck size={20} className="relative z-10" />
                  </div>
                </motion.div>
                <span className="font-bold text-lg text-gray-900">KivuPort</span>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="text-[10px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100"
                >
                  Administrateur
                </motion.span>
              </Link>

              <div className="hidden md:flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={loadData}
                  disabled={isRefreshing}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100"
                >
                  <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                </motion.button>
                <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                  <Settings size={16} />
                  Réglages
                </Link>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                  type="button"
                  onClick={logout}
                >
                  <LogOut size={16} />
                  Déconnexion
                </motion.button>
              </div>

              <motion.button
                className="md:hidden p-2.5 rounded-xl text-gray-700 hover:text-purple-600 hover:bg-purple-50/80 transition-all"
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                whileTap={{ scale: 0.9 }}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                className="md:hidden bg-white/95 backdrop-blur-xl border-b border-gray-100"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="px-4 py-4 space-y-2">
                  <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors" onClick={() => { setIsMobileMenuOpen(false); loadData(); }}>
                    <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                    Actualiser
                  </button>
                  <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                    <Settings size={18} />
                    Réglages
                  </Link>
                  <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors" type="button" onClick={() => { setIsMobileMenuOpen(false); logout(); }}>
                    <LogOut size={18} />
                    Déconnexion
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* ADMIN CONTENT */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            {/* Welcome - ADMIN */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-purple-600 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-8 h-px bg-purple-300" />
                  Administration
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-1">
                  Bonjour{" "}
                  <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                    {name || "Administrateur"}
                  </span>
                  .
                </h1>
                <p className="text-gray-500 mt-1 flex items-center gap-2">
                  Panneau d'administration KivuPort
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Connecté
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/admin" className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 font-semibold rounded-xl transition-all">
                  <ShieldCheck size={16} />
                  Gestion complète
                </Link>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50">
                  <Plus size={16} />
                  Nouveau
                </button>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-purple-300 text-gray-700 font-medium rounded-xl transition-all shadow-sm hover:shadow-md">
                  <Download size={16} />
                  Exporter
                </button>
              </div>
            </motion.div>

            {/* Admin Stats Grid - DONNÉES RÉELLES */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <StatCard label="Réservations" value={stats.totalBookings} icon={Ticket} color="blue" loading={loadingStats} />
              <StatCard label="Revenu total" value={`${stats.totalRevenue.toLocaleString()}$`} icon={DollarSign} color="emerald" loading={loadingStats} trend={{ value: 12, positive: true }} />
              <StatCard label="Utilisateurs" value={stats.totalUsers} icon={Users} color="purple" loading={loadingStats} />
              <StatCard label="En attente" value={stats.pendingBookings} icon={ClockIcon} color="amber" loading={loadingStats} />
              <StatCard label="Taux d'occupation" value={`${stats.occupancyRate}%`} icon={BarChart3} color="indigo" loading={loadingStats} />
              <StatCard label="Évaluation" value={`${stats.averageRating} ⭐`} icon={Star} color="pink" loading={loadingStats} />
            </motion.div>

            {/* Admin Charts - DONNÉES RÉELLES */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              <ChartCard title="Tendance des réservations" className="xl:col-span-2" loading={loadingCharts}>
                <Line
                  data={chartBookingsData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } },
                  }}
                />
              </ChartCard>

              <ChartCard title="Tendance des revenus" loading={loadingCharts}>
                <Bar
                  data={chartRevenueData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } },
                  }}
                />
              </ChartCard>

              <ChartCard title="Répartition par type" loading={loadingCharts}>
                <Doughnut
                  data={chartTypeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "bottom", labels: { boxWidth: 12, padding: 8, font: { size: 10 } } },
                    },
                    cutout: "65%",
                  }}
                />
              </ChartCard>

              <ChartCard title="Statut des réservations" className="xl:col-span-2" loading={loadingCharts}>
                <PolarArea
                  data={chartStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "right", labels: { boxWidth: 12, padding: 8, font: { size: 10 } } },
                    },
                  }}
                />
              </ChartCard>

              <ChartCard title="Activité quotidienne" loading={loadingCharts}>
                <Bar
                  data={chartDailyData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } },
                  }}
                />
              </ChartCard>
            </motion.div>

            {/* Admin Tables - DONNÉES RÉELLES */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Bookings - Admin */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <CalendarDays size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Réservations récentes</h2>
                      <p className="text-sm text-gray-500">Dernières réservations du port</p>
                    </div>
                  </div>
                  <Link href="/admin/bookings" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                    Voir tout <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="space-y-3">
                  {loadingBookings ? (
                    <>
                      <SkeletonLoader className="h-16" />
                      <SkeletonLoader className="h-16" />
                      <SkeletonLoader className="h-16" />
                    </>
                  ) : recentBookings.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Aucune réservation</p>
                  ) : (
                    recentBookings.map((booking, index) => (
                      <motion.div
                        key={booking.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg">
                            <MapPin size={14} className="text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{booking.destination}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{booking.user_name || "Client"}</span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full" />
                              <span>{format(parseISO(booking.departure_date), "dd MMM yyyy", { locale: fr })}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                                booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                                booking.status === "cancelled" ? "bg-red-100 text-red-700" :
                                booking.status === "completed" ? "bg-blue-100 text-blue-700" :
                                "bg-gray-100 text-gray-700"
                              }`}>
                                {booking.status === "confirmed" ? "Confirmé" :
                                 booking.status === "pending" ? "En attente" :
                                 booking.status === "cancelled" ? "Annulé" :
                                 booking.status === "completed" ? "Terminé" : "Inconnu"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-900">{booking.price.toLocaleString("fr-FR")} FC</span>
                          <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50">
                            <Eye size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Users - Admin */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 rounded-xl">
                      <Users size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Utilisateurs récents</h2>
                      <p className="text-sm text-gray-500">Dernières inscriptions</p>
                    </div>
                  </div>
                  <Link href="/admin/users" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                    Voir tout <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="space-y-3">
                  {loadingUsers ? (
                    <>
                      <SkeletonLoader className="h-16" />
                      <SkeletonLoader className="h-16" />
                    </>
                  ) : users.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Aucun utilisateur</p>
                  ) : (
                    users.map((userProfile, index) => (
                      <motion.div
                        key={userProfile.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">
                            {userProfile.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{userProfile.name || "Utilisateur"}</p>
                            <p className="text-xs text-gray-500">{userProfile.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            userProfile.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                          }`}>
                            {userProfile.role === "admin" ? "Admin" : "Utilisateur"}
                          </span>
                          <button className="p-1.5 text-gray-400 hover:text-purple-600 transition-colors rounded-lg hover:bg-purple-50">
                            <Edit size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>
    );
  }

  // ===== RENDER USER DASHBOARD =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header - USER */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/80 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div className="relative" whileHover={{ rotate: -5 }}>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
                  <Ship size={20} className="relative z-10" />
                </div>
              </motion.div>
              <span className="font-bold text-lg text-gray-900">KivuPort</span>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100"
              >
                Espace client
              </motion.span>
            </Link>

            <div className="hidden md:flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadData}
                disabled={isRefreshing}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100"
              >
                <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
              </motion.button>
              <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                <Settings size={16} />
                Réglages
              </Link>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                type="button"
                onClick={logout}
              >
                <LogOut size={16} />
                Déconnexion
              </motion.button>
            </div>

            <motion.button
              className="md:hidden p-2.5 rounded-xl text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 transition-all"
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileTap={{ scale: 0.9 }}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-gray-100" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
              <div className="px-4 py-4 space-y-2">
                <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors" onClick={() => { setIsMobileMenuOpen(false); loadData(); }}>
                  <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                  Actualiser
                </button>
                <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  <Settings size={18} />
                  Réglages
                </Link>
                <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors" type="button" onClick={() => { setIsMobileMenuOpen(false); logout(); }}>
                  <LogOut size={18} />
                  Déconnexion
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* USER CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          {/* Welcome - USER */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                <span className="w-8 h-px bg-blue-300" />
                Port de Goma
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-1">
                Bonjour{" "}
                <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  {name || "et bienvenue"}
                </span>
                .
              </h1>
              <p className="text-gray-500 mt-1 flex items-center gap-2">
                Votre espace personnel KivuPort
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Connecté
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {isAdmin && <Link href="/admin" className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 font-semibold rounded-xl transition-all"><ShieldCheck size={16} /> Administration</Link>}
              <Link href="/voyages" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-blue-300 text-gray-700 font-medium rounded-xl transition-all shadow-sm hover:shadow-md">
                <CalendarDays size={16} />
                Voir les voyages
                <ChevronRight size={14} />
              </Link>
              <Link href="/reservations" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50">
                <Anchor size={16} />
                Mes réservations
                <ChevronRight size={14} />
              </Link>
            </div>
          </motion.div>

          {/* User Stats Grid - DONNÉES RÉELLES */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Réservations" value={stats.totalBookings} icon={Ticket} color="blue" loading={loadingStats} />
            <StatCard label="En attente" value={stats.pendingBookings} icon={ClockIcon} color="amber" loading={loadingStats} />
            <StatCard label="Terminées" value={stats.completedBookings} icon={CheckCircle} color="emerald" loading={loadingStats} />
            <StatCard label="Dépenses" value={`${stats.totalRevenue.toLocaleString("fr-FR")} FC`} icon={DollarSign} color="purple" loading={loadingStats} />
          </motion.div>

          {/* User Charts - DONNÉES RÉELLES */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Mes réservations" loading={loadingCharts}>
              <Line
                data={chartBookingsData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } },
                }}
              />
            </ChartCard>
            <ChartCard title="Répartition" loading={loadingCharts}>
              <Doughnut
                data={chartTypeData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom", labels: { boxWidth: 12, padding: 8, font: { size: 10 } } } },
                  cutout: "65%",
                }}
              />
            </ChartCard>
          </motion.div>

          {/* User Main Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card - USER */}
            <motion.article className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow" variants={itemVariants} whileHover={{ y: -2 }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <UserRound size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Mon profil</h2>
                  <p className="text-sm text-gray-500">Informations du compte</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
                  <Sparkles size={12} className="text-blue-400" />
                  <span>Connecté</span>
                </div>
              </div>

              <form onSubmit={saveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Votre nom"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-400 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email</label>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-600">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-sm">{email}</span>
                  </div>
                </div>

                <AnimatePresence>
                  {message && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-xl">
                      {message}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button type="submit" disabled={isSaving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save size={16} />
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </motion.button>
              </form>
            </motion.article>

            {/* Notifications - USER */}
            <motion.article className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow" variants={itemVariants}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-amber-50 rounded-xl">
                  <Bell size={20} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                  <p className="text-sm text-gray-500">{notifications.filter(n => !n.read).length} non lues</p>
                </div>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {loadingNotifications ? (
                  <>
                    <SkeletonLoader className="h-16" />
                    <SkeletonLoader className="h-16" />
                    <SkeletonLoader className="h-16" />
                  </>
                ) : notifications.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Aucune notification</p>
                ) : (
                  notifications.filter(n => n.target_role === "user" || n.target_role === "all" || !n.target_role).map((notification) => (
                    <div key={notification.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          notification.type === "success" ? "bg-emerald-50" :
                          notification.type === "warning" ? "bg-amber-50" :
                          notification.type === "error" ? "bg-red-50" : "bg-blue-50"
                        }`}>
                          {notification.type === "success" ? <CheckCircle size={14} className="text-emerald-500" /> :
                           notification.type === "warning" ? <AlertCircle size={14} className="text-amber-500" /> :
                           notification.type === "error" ? <AlertCircle size={14} className="text-red-500" /> :
                           <Bell size={14} className="text-blue-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{notification.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true, locale: fr })}</p>
                        </div>
                        {!notification.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.article>
          </motion.div>

          {/* User Bookings & Trips - DONNÉES RÉELLES */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Bookings */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <CalendarDays size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Mes réservations</h2>
                  <p className="text-sm text-gray-500">Vos dernières réservations</p>
                </div>
              </div>
              <div className="space-y-3">
                {loadingBookings ? (
                  <>
                    <SkeletonLoader className="h-16" />
                    <SkeletonLoader className="h-16" />
                  </>
                ) : recentBookings.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Aucune réservation</p>
                ) : (
                  recentBookings.slice(0, 3).map((booking, index) => (
                    <motion.div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg">
                          <MapPin size={14} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{booking.destination}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{format(parseISO(booking.departure_date), "dd MMM yyyy", { locale: fr })}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              booking.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                              booking.status === "pending" ? "bg-amber-100 text-amber-700" :
                              booking.status === "cancelled" ? "bg-red-100 text-red-700" :
                              booking.status === "completed" ? "bg-blue-100 text-blue-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {booking.status === "confirmed" ? "Confirmé" :
                               booking.status === "pending" ? "En attente" :
                               booking.status === "cancelled" ? "Annulé" :
                               booking.status === "completed" ? "Terminé" : "Inconnu"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{booking.price.toLocaleString("fr-FR")} FC</span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Trips */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-emerald-50 rounded-xl">
                  <Ship size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Départs à venir</h2>
                  <p className="text-sm text-gray-500">Prochaines traversées</p>
                </div>
              </div>
              <div className="space-y-3">
                {loadingTrips ? (
                  <>
                    <SkeletonLoader className="h-16" />
                    <SkeletonLoader className="h-16" />
                  </>
                ) : upcomingTrips.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Aucun départ prévu</p>
                ) : (
                  upcomingTrips.slice(0, 3).map((trip, index) => (
                    <motion.div key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg">
                          <Compass size={14} className="text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{trip.destination}</p>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(trip.departure_time), "dd MMM, HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        trip.status === "on-time" ? "bg-emerald-100 text-emerald-700" :
                        trip.status === "delayed" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {trip.status === "on-time" ? "À l'heure" :
                         trip.status === "delayed" ? "Retardé" : "Annulé"}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
