"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Anchor,
  ArrowRight,
  CalendarDays,
  LogIn,
  MapPin,
  Ship,
  ShieldCheck,
  Ticket,
  Clock,
  ChevronDown,
  Navigation,
  RefreshCw,
  AlertCircle,
  Wind,
  Droplets,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Award,
  Users,
  Star,
  CheckCircle,
  ChevronRight,
  Search,
  Sparkles,
  Compass,
  Waves,
  Sailboat,
  Package,
  UserPlus,
  Shield,
} from "lucide-react";
import { Footer } from "@/app/components/footer";
import { LoginModal } from "@/app/components/login-modal";
import { Navbar } from "@/app/components/navbar";
import { SignupModal } from "@/app/components/signup-modal";

// ===== IMPORT DYNAMIQUE DE LEAFLET =====
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

// ===== CHARGEMENT DES STYLES CSS =====
import "leaflet/dist/leaflet.css";

// ===== TYPES =====
type WeatherData = {
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  description: string;
};

type PortInfo = {
  name: string;
  location: string;
  status: "open" | "closed" | "partial";
  vessels: number;
  nextDeparture: string;
  capacity: string;
};

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=90",
    label: "Le lac au départ",
  },
  {
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=90",
    label: "Les rives de Kivu",
  },
  {
    image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1800&q=90",
    label: "Goma en mouvement",
  },
];

const services = [
  {
    icon: Ship,
    title: "Voyages & horaires",
    description: "Consultez les départs planifiés et choisissez le trajet qui vous convient.",
  },
  {
    icon: Ticket,
    title: "Réservations faciles",
    description: "Réservez une place ou une cargaison en quelques étapes claires.",
  },
  {
    icon: ShieldCheck,
    title: "Suivi en confiance",
    description: "Retrouvez vos demandes, confirmations et paiements au même endroit.",
  },
];

const benefits = [
  {
    icon: Shield,
    title: "Sécurité garantie",
    description: "Tous nos bateaux sont certifiés et régulièrement inspectés.",
    color: "blue",
  },
  {
    icon: Clock,
    title: "Ponctualité assurée",
    description: "98% de nos traversées partent à l'heure.",
    color: "emerald",
  },
  {
    icon: Users,
    title: "Support 24/7",
    description: "Une équipe dédiée à votre écoute à tout moment.",
    color: "purple",
  },
  {
    icon: Award,
    title: "Excellence reconnue",
    description: "Élu meilleur service portuaire de la région.",
    color: "amber",
  },
];

// ===== DONNÉES POUR LA CARTE =====
const ports = [
  { name: "Goma", lat: -1.679, lng: 29.225, status: "open", icon: "⚓" },
  { name: "Bukavu", lat: -2.502, lng: 28.859, status: "open", icon: "⚓" },
  { name: "Kalehe", lat: -1.509, lng: 29.104, status: "partial", icon: "⚓" },
  { name: "Minova", lat: -1.697, lng: 29.026, status: "open", icon: "⚓" },
  { name: "Idjwi", lat: -2.150, lng: 29.040, status: "partial", icon: "⚓" },
];

const routes = [
  { from: "Goma", to: "Bukavu", color: "#3B82F6" },
  { from: "Goma", to: "Kalehe", color: "#8B5CF6" },
  { from: "Goma", to: "Minova", color: "#10B981" },
  { from: "Goma", to: "Idjwi", color: "#F59E0B" },
];

// ===== COMPOSANTS =====

// Composant Carte Interactive
function InteractiveMap({ userLocation, onMapReady }: { 
  userLocation: { lat: number; lng: number } | null;
  onMapReady?: () => void;
}) {
  const [isClient, setIsClient] = useState(false);
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);
  const [mapZoom, setMapZoom] = useState(11);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-1.679, 29.225]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    import("leaflet").then(({ default: leafletModule }) => {
      delete (leafletModule.Icon.Default.prototype as any)._getIconUrl;
      leafletModule.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
      setLeaflet(leafletModule);
    });
    setIsClient(true);
    if (onMapReady) onMapReady();
  }, [onMapReady]);

  if (!isClient || !leaflet) {
    return (
      <div className="w-full h-full min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] bg-gradient-to-br from-blue-100 to-slate-200 rounded-2xl overflow-hidden flex items-center justify-center">
        <div className="text-center p-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-500">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]'}`}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className={`w-full ${isFullscreen ? 'h-screen' : 'h-full min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]'} rounded-2xl`}
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle
          center={[-1.679, 29.225]}
          radius={50000}
          pathOptions={{ color: "#3B82F6", fillColor: "#93C5FD", fillOpacity: 0.15, weight: 1 }}
        />

        {routes.map((route) => {
          const fromPort = ports.find(p => p.name === route.from);
          const toPort = ports.find(p => p.name === route.to);
          if (!fromPort || !toPort) return null;
          return (
            <Polyline
              key={`${route.from}-${route.to}`}
              positions={[
                [fromPort.lat, fromPort.lng],
                [toPort.lat, toPort.lng],
              ]}
              pathOptions={{
                color: route.color,
                weight: 2,
                opacity: 0.6,
                dashArray: "8,6",
              }}
            />
          );
        })}

        {ports.map((port) => (
          <Marker
            key={port.name}
            position={[port.lat, port.lng]}
          >
            <Popup>
              <div className="p-1 sm:p-2">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">{port.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${port.status === 'open' ? 'bg-emerald-500' : port.status === 'partial' ? 'bg-amber-500' : 'bg-red-500'}`} />
                  {port.status === 'open' ? 'Ouvert' : port.status === 'partial' ? 'Partiel' : 'Fermé'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Coordonnées: {port.lat.toFixed(4)}, {port.lng.toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={100}
              pathOptions={{ color: "#3B82F6", fillColor: "#60A5FA", fillOpacity: 0.3, weight: 2 }}
            />
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={leaflet.divIcon({
                className: 'custom-marker',
                html: `<div class="w-4 h-4 sm:w-5 sm:h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })}
            >
              <Popup>
                <div className="p-1 sm:p-2">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">📍 Vous êtes ici</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-[1000]">
        <button 
          className="p-1.5 sm:p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          onClick={() => setMapZoom(z => Math.min(z + 1, 18))}
          aria-label="Zoom in"
        >
          <ZoomIn size={16} className="text-gray-600" />
        </button>
        <button 
          className="p-1.5 sm:p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          onClick={() => setMapZoom(z => Math.max(z - 1, 8))}
          aria-label="Zoom out"
        >
          <ZoomOut size={16} className="text-gray-600" />
        </button>
        <button 
          className="p-1.5 sm:p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          onClick={() => setIsFullscreen(!isFullscreen)}
          aria-label="Fullscreen"
        >
          {isFullscreen ? <Minimize size={16} className="text-gray-600" /> : <Maximize size={16} className="text-gray-600" />}
        </button>
      </div>

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-2 sm:p-3 shadow-lg border border-gray-100 text-[10px] sm:text-xs z-[1000] max-w-[200px] sm:max-w-none">
        <h4 className="font-semibold text-gray-700 mb-1 sm:mb-1.5">Lac Kivu - Ports</h4>
        <div className="space-y-0.5 sm:space-y-1">
          {ports.slice(0, 3).map((port) => (
            <div key={port.name} className="flex items-center gap-1.5 sm:gap-2">
              <div className={`w-2 h-2 rounded-full ${port.status === 'open' ? 'bg-emerald-500' : port.status === 'partial' ? 'bg-amber-500' : 'bg-red-500'}`} />
              <span className="text-gray-600 text-[9px] sm:text-xs">{port.name}</span>
            </div>
          ))}
          {ports.length > 3 && (
            <div className="text-gray-400 text-[8px] sm:text-[10px]">+{ports.length - 3} autres</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Composant Météo
function WeatherWidget({ weather }: { weather: WeatherData | null }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (weather) setIsLoading(false);
  }, [weather]);

  const getWeatherIcon = (condition: string) => {
    const icons: Record<string, any> = {
      sunny: Sun,
      cloudy: Cloud,
      rainy: CloudRain,
      stormy: CloudLightning,
    };
    return icons[condition] || Sun;
  };

  if (isLoading || !weather) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 animate-pulse">
        <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/3 mb-2 sm:mb-3" />
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 sm:h-6 bg-gray-200 rounded w-1/2 mb-1 sm:mb-2" />
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  const Icon = getWeatherIcon(weather.condition);

  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <MapPin size={12} className="text-gray-500" />
          <span className="text-xs sm:text-sm font-medium text-gray-700">Goma</span>
        </div>
        <RefreshCw size={12} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="p-1.5 sm:p-2 bg-blue-50 rounded-full">
          <Icon size={20} className="sm:w-8 sm:h-8 text-blue-600" />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{Math.round(weather.temperature)}°C</span>
            <span className="text-[10px] sm:text-xs text-gray-500">{weather.condition}</span>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 capitalize">{weather.description}</p>
        </div>
        <div className="ml-auto flex flex-col gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Droplets size={10} className="sm:w-3 sm:h-3" />
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Wind size={10} className="sm:w-3 sm:h-3" />
            <span>{weather.windSpeed} km/h</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Composant Statut du Port
function PortStatus({ portInfo }: { portInfo: PortInfo }) {
  const statusColors = {
    open: "bg-emerald-500 text-white",
    closed: "bg-red-500 text-white",
    partial: "bg-amber-500 text-white",
  };

  const statusLabels = {
    open: "Ouvert",
    closed: "Fermé",
    partial: "Partiel",
  };

  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Anchor size={12} className="text-gray-500" />
          <span className="text-xs sm:text-sm font-medium text-gray-700">Port de {portInfo.name}</span>
        </div>
        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-medium ${statusColors[portInfo.status]}`}>
          {statusLabels[portInfo.status]}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div>
          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-wider">Navires</p>
          <p className="text-sm sm:text-lg font-semibold text-gray-900">{portInfo.vessels}</p>
        </div>
        <div>
          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-wider">Prochain départ</p>
          <p className="text-sm sm:text-lg font-semibold text-gray-900">{portInfo.nextDeparture}</p>
        </div>
        <div>
          <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-wider">Capacité</p>
          <p className="text-sm sm:text-lg font-semibold text-gray-900">{portInfo.capacity}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ===== SECTION TRAJET GOMA → BUKAVU =====
function RouteSection({ onAuth }: { onAuth: (mode: "login" | "signup") => void }) {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-blue-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête de section */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-sm font-medium mb-4">
            <Navigation size={16} className="text-blue-500" />
            Trajet phare
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Goma → <span className="text-blue-600">Bukavu</span>
          </h2>
          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
            La traversée emblématique du Lac Kivu. Un voyage de 2h30 entre deux des plus belles villes de l&apos;Est de la RDC.
          </p>
        </motion.div>

        {/* Carte principale du trajet */}
        <motion.div
          className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* En-tête de la carte */}
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
            </div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider">
                  Trajet régulier
                </p>
                <h3 className="text-xl font-bold text-white">Goma → Bukavu</h3>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-xs">
                <Clock size={14} />
                <span>2h30 de traversée</span>
              </div>
            </div>
          </div>

          {/* Corps de la carte - Visualisation du trajet */}
          <div className="p-6">
            {/* Carte interactive miniature */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 via-slate-100 to-indigo-50/50 h-64 md:h-80 mb-6 border border-gray-200">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-400/10 via-blue-300/5 to-transparent" />
              
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                  }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    backgroundImage: `
                      radial-gradient(ellipse at 20% 60%, rgba(59,130,246,0.08) 0%, transparent 50%),
                      radial-gradient(ellipse at 80% 40%, rgba(59,130,246,0.06) 0%, transparent 40%),
                      radial-gradient(ellipse at 50% 80%, rgba(59,130,246,0.04) 0%, transparent 60%)
                    `,
                    backgroundSize: "200% 200%",
                  }}
                />
              </div>

              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400">
                <path
                  d="M 50,200 Q 200,100 400,200 Q 600,300 750,200"
                  fill="none"
                  stroke="rgba(59,130,246,0.1)"
                  strokeWidth="8"
                  strokeDasharray="8,8"
                />
                
                <motion.path
                  d="M 50,200 Q 200,100 400,200 Q 600,300 750,200"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                    repeatDelay: 1,
                  }}
                />
                
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>

                {/* Port de Goma */}
                <g transform="translate(30, 180)">
                  <circle cx="20" cy="20" r="16" fill="#3B82F6" className="shadow-lg" />
                  <circle cx="20" cy="20" r="8" fill="white" opacity="0.3" />
                  <circle cx="20" cy="20" r="4" fill="white" />
                  <text x="20" y="50" textAnchor="middle" className="text-xs font-semibold fill-gray-700">Goma</text>
                  <rect x="5" y="55" width="30" height="14" rx="7" fill="#3B82F6" opacity="0.15" />
                  <text x="20" y="65" textAnchor="middle" className="text-[8px] fill-blue-600 font-medium">Départ</text>
                </g>

                {/* Bateau animé */}
                <motion.g
                  animate={{
                    x: [0, 700],
                    y: [0, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <g transform="translate(100, 185)">
                    <rect x="-12" y="-6" width="24" height="12" rx="6" fill="#3B82F6" />
                    <rect x="-8" y="-10" width="16" height="4" rx="2" fill="#60A5FA" />
                    <rect x="-4" y="-14" width="8" height="4" rx="2" fill="#93C5FD" />
                    <circle cx="12" cy="0" r="2" fill="#FCD34D" />
                  </g>
                </motion.g>

                {/* Port de Bukavu */}
                <g transform="translate(730, 180)">
                  <circle cx="20" cy="20" r="16" fill="#10B981" className="shadow-lg" />
                  <circle cx="20" cy="20" r="8" fill="white" opacity="0.3" />
                  <circle cx="20" cy="20" r="4" fill="white" />
                  <text x="20" y="50" textAnchor="middle" className="text-xs font-semibold fill-gray-700">Bukavu</text>
                  <rect x="5" y="55" width="30" height="14" rx="7" fill="#10B981" opacity="0.15" />
                  <text x="20" y="65" textAnchor="middle" className="text-[8px] fill-emerald-600 font-medium">Arrivée</text>
                </g>

                <circle cx="250" cy="150" r="4" fill="#6366F1" opacity="0.5" />
                <circle cx="400" cy="200" r="4" fill="#6366F1" opacity="0.5" />
                <circle cx="550" cy="250" r="4" fill="#6366F1" opacity="0.5" />

                <text x="250" y="135" textAnchor="middle" className="text-[8px] fill-gray-400">45 min</text>
                <text x="400" y="185" textAnchor="middle" className="text-[8px] fill-gray-400">1h30</text>
                <text x="550" y="235" textAnchor="middle" className="text-[8px] fill-gray-400">2h</text>

                <motion.g
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <circle cx="400" cy="195" r="12" fill="white" stroke="#6366F1" strokeWidth="2" />
                  <text x="400" y="199" textAnchor="middle" className="text-xs fill-indigo-600">⚓</text>
                </motion.g>
              </svg>

              <motion.div
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-white"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs text-gray-600">En direct</span>
                  </div>
                  <div className="w-px h-4 bg-gray-200" />
                  <div className="flex items-center gap-1">
                    <Users size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-600">42 passagers</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Informations du trajet */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Clock size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Durée</p>
                    <p className="text-sm font-semibold text-gray-900">2h30</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 rounded-lg">
                    <Ship size={14} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Navire</p>
                    <p className="text-sm font-semibold text-gray-900">Kivu 1</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <Ticket size={14} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Prix</p>
                    <p className="text-sm font-semibold text-gray-900">25 000 FC</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 rounded-lg">
                    <CalendarDays size={14} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Prochain départ</p>
                    <p className="text-sm font-semibold text-gray-900">08:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="mt-6 flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 min-w-[140px] px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                onClick={() => onAuth("signup")}
              >
                <Ticket size={18} />
                Réserver ce trajet
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2"
                onClick={() => document.getElementById('carte')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <MapPin size={18} />
                Voir sur la carte
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Points forts du trajet */}
        <motion.div
          className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {[
            {
              icon: Shield,
              title: "Sécurité maximale",
              description: "Bateau certifié et équipage expérimenté",
              color: "blue",
            },
            {
              icon: Wind,
              title: "Confort optimal",
              description: "Pavillons spacieux et équipements modernes",
              color: "emerald",
            },
            {
              icon: Award,
              title: "Service reconnu",
              description: "Élu meilleure traversée du Lac Kivu",
              color: "amber",
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
              whileHover={{ y: -4 }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                item.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                'bg-amber-50 text-amber-600'
              }`}>
                <item.icon size={20} />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Autres destinations */}
        <motion.div
          className="mt-12 pt-8 border-t border-gray-200"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-700">Autres destinations</h4>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Voir toutes <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: "Kalehe", time: "1h45", price: "18 000 FC" },
              { name: "Minova", time: "3h15", price: "32 000 FC" },
              { name: "Idjwi", time: "4h00", price: "40 000 FC" },
              { name: "Sake", time: "1h15", price: "12 000 FC" },
            ].map((dest, index) => (
              <motion.button
                key={dest.name}
                className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left group"
                whileHover={{ x: 4 }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <p className="font-medium text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                  {dest.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <Clock size={10} />
                  <span>{dest.time}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span>{dest.price}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ===== PAGE PRINCIPALE =====
export default function Home() {
  const [authMode, setAuthMode] = useState<"login" | "signup" | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [portInfo, setPortInfo] = useState<PortInfo>({
    name: "Goma",
    location: "Goma, RDC",
    status: "open",
    vessels: 12,
    nextDeparture: "08:00",
    capacity: "85%",
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // ===== Récupération de la météo =====
  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoadingWeather(true);
      try {
        const weatherData: WeatherData = {
          temperature: 26 + Math.floor(Math.random() * 4),
          condition: ["sunny", "cloudy", "rainy"][Math.floor(Math.random() * 3)] as WeatherData["condition"],
          icon: "sunny",
          humidity: 45 + Math.floor(Math.random() * 30),
          windSpeed: 5 + Math.floor(Math.random() * 15),
          description: "Ciel dégagé, légère brise",
        };
        setWeather(weatherData);
        setIsLoadingWeather(false);
      } catch (error) {
        console.error("Erreur météo:", error);
        setIsLoadingWeather(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 300000);
    return () => clearInterval(interval);
  }, []);

  // ===== Géolocalisation =====
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          console.warn("Erreur de géolocalisation:", error);
          setLocationError("Impossible de récupérer votre position");
        }
      );
    } else {
      setLocationError("La géolocalisation n'est pas supportée");
    }
  }, []);

  // ===== Carousel =====
  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide((slide) => (slide + 1) % heroSlides.length), 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar onLogin={() => setAuthMode("login")} onSignup={() => setAuthMode("signup")} />

      <main>
        {/* ===== HERO SECTION ===== */}
        <section className="relative min-h-[100svh] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${heroSlides[activeSlide].image})` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            />
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          <div className="relative flex min-h-[100svh] items-center py-24 sm:py-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 items-start">
                {/* Texte principal */}
                <div className="lg:col-span-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <p className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-[10px] sm:text-xs font-medium text-white/80 border border-white/10 mb-4 sm:mb-6">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Port de Goma • En direct
                    </p>
                  </motion.div>

                  <motion.h1
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    Votre traversée
                    <span className="block text-blue-400">commence ici.</span>
                  </motion.h1>

                  <motion.p
                    className="mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base md:text-lg text-white/70 max-w-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    Réservez une traversée depuis le port de Goma et suivez votre réservation en toute simplicité.
                  </motion.p>

                  <motion.div
                    className="mt-4 sm:mt-6 md:mt-8 flex flex-wrap gap-3 sm:gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    <button
                      type="button"
                      onClick={() => setAuthMode("signup")}
                      className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                    >
                      Réserver
                      <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode("login")}
                      className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition-all flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                    >
                      <LogIn size={16} className="sm:w-[18px] sm:h-[18px]" />
                      Se connecter
                    </button>
                  </motion.div>

                  <motion.div
                    className="mt-4 sm:mt-5 md:mt-6 flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-sm text-white/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <ShieldCheck size={14} className="sm:w-4 sm:h-4 text-emerald-400" />
                    <span>Paiements sécurisés</span>
                    {userLocation && (
                      <>
                        <span className="w-px h-3 sm:h-4 bg-white/20 mx-1 sm:mx-2" />
                        <Navigation size={12} className="sm:w-[14px] sm:h-[14px] text-blue-300" />
                        <span className="text-white/60 hidden xs:inline">Position détectée</span>
                        <span className="text-white/60 inline xs:hidden">📍</span>
                      </>
                    )}
                    {locationError && (
                      <>
                        <span className="w-px h-3 sm:h-4 bg-white/20 mx-1 sm:mx-2" />
                        <AlertCircle size={12} className="sm:w-[14px] sm:h-[14px] text-amber-400" />
                        <span className="text-white/40 text-[8px] sm:text-xs">{locationError}</span>
                      </>
                    )}
                  </motion.div>
                </div>

                {/* Widgets météo et port */}
                <div className="lg:col-span-2 space-y-3 sm:space-y-4 mt-4 lg:mt-0">
                  <WeatherWidget weather={weather} />
                  <PortStatus portInfo={portInfo} />
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Dots */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeSlide ? "w-6 sm:w-8 bg-white" : "w-2 sm:w-3 bg-white/30 hover:bg-white/50"
                }`}
                onClick={() => setActiveSlide(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 hidden md:block">
            <ChevronDown size={20} className="text-white/30 animate-bounce" />
          </div>
        </section>

        {/* ===== SECTION TRAJET GOMA → BUKAVU ===== */}
        <RouteSection onAuth={(mode) => setAuthMode(mode)} />

        {/* ===== MAP SECTION ===== */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8" id="carte">
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="text-center max-w-2xl mx-auto mb-6 sm:mb-8 md:mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-wider flex items-center justify-center gap-2">
                <span className="w-6 sm:w-8 h-px bg-blue-300" />
                Géolocalisation
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">Lac Kivu - Port de Goma</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-2">Visualisez les routes maritimes et les ports du lac Kivu</p>
            </motion.div>

            <motion.div
              className="rounded-2xl overflow-hidden shadow-xl shadow-blue-500/5"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <InteractiveMap userLocation={userLocation} onMapReady={() => setIsMapReady(true)} />
            </motion.div>
          </div>
        </section>

        {/* ===== SERVICES SECTION ===== */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8" id="services">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Services à gauche */}
              <div>
                <div className="text-left max-w-2xl mb-6 sm:mb-8">
                  <p className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-wider">Services</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">Simple, local, efficace.</h2>
                  <p className="text-sm sm:text-base text-gray-600 mt-2">Tout le nécessaire pour vos réservations au port de Goma.</p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {services.map((service, index) => (
                    <motion.div
                      key={service.title}
                      className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <service.icon size={16} className="sm:w-[18px] sm:h-[18px] text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900">{service.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{service.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Image illustrative */}
              <motion.div
                className="relative bg-gradient-to-br from-blue-50 to-slate-100 rounded-2xl overflow-hidden p-6 sm:p-8 flex items-center justify-center min-h-[250px] sm:min-h-[300px] lg:min-h-[400px]"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="relative w-full max-w-md">
                  <div className="relative aspect-square">
                    <motion.div
                      className="absolute top-4 sm:top-8 right-4 sm:right-8 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full shadow-2xl shadow-amber-300/30"
                      animate={{
                        scale: [1, 1.05, 1],
                        boxShadow: [
                          "0 0 20px rgba(251, 191, 36, 0.3)",
                          "0 0 40px rgba(251, 191, 36, 0.5)",
                          "0 0 20px rgba(251, 191, 36, 0.3)",
                        ],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />

                    <motion.div
                      className="absolute top-8 sm:top-12 left-4 sm:left-8 flex gap-1 sm:gap-2 opacity-60"
                      animate={{ x: [0, 10, 0] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="w-8 h-4 sm:w-12 sm:h-6 bg-white/70 rounded-full blur-sm" />
                      <div className="w-6 h-3 sm:w-8 sm:h-5 bg-white/60 rounded-full blur-sm" />
                    </motion.div>

                    <div className="absolute bottom-24 sm:bottom-32 left-0 right-0 h-16 sm:h-24">
                      <svg viewBox="0 0 400 100" className="w-full h-full">
                        <polygon points="0,100 40,20 80,100" fill="rgba(100, 116, 139, 0.3)" />
                        <polygon points="60,100 110,10 160,100" fill="rgba(71, 85, 105, 0.25)" />
                        <polygon points="140,100 190,30 240,100" fill="rgba(100, 116, 139, 0.2)" />
                        <polygon points="220,100 270,15 320,100" fill="rgba(71, 85, 105, 0.2)" />
                        <polygon points="300,100 350,25 400,100" fill="rgba(100, 116, 139, 0.25)" />
                      </svg>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 via-blue-500/10 to-transparent" />
                      <motion.div
                        className="absolute inset-0"
                        animate={{
                          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        style={{
                          backgroundImage: `
                            radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                            radial-gradient(ellipse at 80% 30%, rgba(255,255,255,0.08) 0%, transparent 40%),
                            radial-gradient(ellipse at 50% 70%, rgba(255,255,255,0.06) 0%, transparent 60%)
                          `,
                          backgroundSize: "200% 200%",
                        }}
                      />
                    </div>

                    <motion.div
                      className="absolute bottom-1/3 left-1/2 -translate-x-1/2"
                      animate={{
                        y: [0, -2, 0],
                        rotate: [-2, 2, -2],
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div className="relative">
                        <div className="w-16 h-3 sm:w-24 sm:h-4 bg-gradient-to-r from-blue-700 to-blue-600 rounded-t-full" />
                        <div className="w-14 h-2 sm:w-20 sm:h-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-t-full mx-auto -mt-1" />
                        <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 w-0.5 h-4 sm:w-1 sm:h-5 bg-gray-400" />
                        <div className="absolute -top-5 sm:-top-7 left-1/2 -translate-x-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-white/30 rounded-full" />
                      </div>
                    </motion.div>

                    <div className="absolute bottom-16 sm:bottom-20 left-2 flex flex-col items-center">
                      <div className="w-1.5 h-5 sm:w-2 sm:h-8 bg-gradient-to-b from-gray-600 to-gray-700 rounded-full" />
                      <span className="text-[6px] sm:text-[8px] text-gray-500 font-medium mt-0.5 sm:mt-1">Goma</span>
                    </div>
                    <div className="absolute bottom-20 sm:bottom-24 right-2 flex flex-col items-center">
                      <div className="w-1 h-4 sm:w-1.5 sm:h-5 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full" />
                      <span className="text-[6px] sm:text-[8px] text-gray-500 font-medium mt-0.5 sm:mt-1">Bukavu</span>
                    </div>

                    <motion.div
                      className="absolute"
                      style={{ bottom: '30%', left: '15%', right: '15%' }}
                    >
                      <svg viewBox="0 0 200 30" className="w-full h-6 sm:h-8">
                        <motion.path
                          d="M0,15 Q50,-5 100,15 Q150,35 200,15"
                          fill="none"
                          stroke="rgba(59, 130, 246, 0.4)"
                          strokeWidth="1.5"
                          strokeDasharray="4,4"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      </svg>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== STATS SECTION ===== */}
        <section className="py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 border-y border-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {[
                { value: "15K+", label: "Traversées" },
                { value: "98%", label: "Satisfaction" },
                { value: "50+", label: "Destinations" },
                { value: "24/7", label: "Support" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== POURQUOI KIVUPORT ===== */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              className="text-center max-w-3xl mx-auto mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-sm font-medium mb-4">
                <Sparkles size={16} />
                Pourquoi nous choisir
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Des raisons de nous faire confiance</h2>
              <p className="text-gray-600 mt-2">Une expérience maritime pensée pour vous</p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  className="text-center p-6 bg-gray-50 rounded-2xl hover:shadow-xl transition-all border border-gray-100"
                  whileHover={{ y: -8 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    benefit.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                    benefit.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                    benefit.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    <benefit.icon size={28} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== ROUTE SECTION ===== */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8" id="fonctionnement">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-wider">Navigation</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">Visualisez votre itinéraire.</h2>
                <p className="text-sm sm:text-base text-gray-600 mt-3 leading-relaxed">
                  Une vue immersive pour comprendre le départ, le trajet et l&apos;arrivée avant de confirmer votre réservation.
                </p>
                <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-600 rounded-full" />
                    <span className="text-xs sm:text-sm text-gray-700 font-medium">Port de Goma</span>
                  </div>
                  <div className="w-10 sm:w-16 h-px bg-gray-300 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 rounded-full" />
                    <span className="text-xs sm:text-sm text-gray-700 font-medium">Destination</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className="mt-6 sm:mt-8 px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all flex items-center gap-2 text-sm sm:text-base"
                >
                  Voir les départs
                  <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>

              <div className="relative aspect-square bg-gradient-to-br from-blue-50 to-slate-100 rounded-2xl overflow-hidden flex items-center justify-center min-h-[250px] sm:min-h-[350px] lg:min-h-[400px]">
                <div className="relative">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 border-2 border-blue-200 rounded-full animate-spin-slow" />
                  <div className="absolute inset-3 sm:inset-4 border-2 border-blue-100 rounded-full animate-spin-slower" />
                  <div className="absolute inset-6 sm:inset-8 border border-blue-50 rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center">
                      <Ship size={20} className="sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 text-center">
                  <p className="text-[10px] sm:text-xs text-gray-500">Port de Goma • Départs disponibles</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {authMode === "login" && (
        <LoginModal onClose={() => setAuthMode(null)} onSignup={() => setAuthMode("signup")} />
      )}
      {authMode === "signup" && (
        <SignupModal onClose={() => setAuthMode(null)} onLogin={() => setAuthMode("login")} />
      )}
    </div>
  );
}