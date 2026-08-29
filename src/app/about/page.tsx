"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  ShieldCheck,
  Users,
  Globe,
  Sparkles,
  HeartHandshake,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  Rocket,
  Code,
  ArrowRight,
  Award,
  Clock,
  CheckCircle,
  Ship,
  Navigation,
  Compass,
  Star,
  Calendar,
  Anchor,
  BadgeCheck,
  Briefcase,
  Quote,
  Play,
  ChevronDown,
  Building2,
  Wifi,
  Coffee,
  Sun,
  Cloud,
} from "lucide-react";
import { PublicLayout } from "@/app/components/public-layout";
import Link from "next/link";
import { useState, useRef } from "react";

const backgroundParticles = Array.from({ length: 20 }, (_, index) => ({
  id: index,
  size: 2 + ((index * 17) % 5),
  left: (index * 47) % 100,
  top: (index * 73) % 100,
  duration: 5 + ((index * 13) % 10),
  delay: (index * 19) % 5,
}));

// ===== ICÔNES RÉSEAUX SOCIAUX PERSONNALISÉES =====
function GithubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17 4.6 18 5 18 5c.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9 0-6.3-5.2-11.5-11.5-11.5z" />
    </svg>
  );
}

function LinkedinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

function TwitterIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z" />
    </svg>
  );
}

// ===== DONNÉES =====
const values = [
  {
    icon: ShieldCheck,
    title: "Sécurité avant tout",
    text: "Des traversées strictement encadrées avec des contrôles rigoureux à chaque embarquement.",
    color: "blue",
  },
  {
    icon: Users,
    title: "Service centré client",
    text: "Une équipe dédiée à votre confort et à la fluidité de vos déplacements sur le lac Kivu.",
    color: "emerald",
  },
  {
    icon: Globe,
    title: "Connectivité régionale",
    text: "Des liaisons fiables reliant la région des Grands Lacs aux principaux points d'échange.",
    color: "purple",
  },
  {
    icon: Sparkles,
    title: "Innovation maritime",
    text: "Une plateforme moderne pour réserver, suivre et gérer vos traversées en temps réel.",
    color: "amber",
  },
];

const teamMembers = [
  {
    name: "Nzanzu Muanda Aristarque",
    role: "Développeur Backend",
    phone: "+243 983 379 962",
    location: "Goma, Quartier Katoyi",
    skills: "Architecture & Base de données",
    initials: "NM",
    photo: "/Muanda.jpg",
    gradient: "from-blue-600 to-indigo-700",
    shadow: "shadow-blue-500/20",
    social: {
      github: "https://github.com/aristarque26",
      linkedin: "https://linkedin.com/in/aristarque",
      twitter: "https://twitter.com/aristarque",
    },
    bio: "Passionné par l'architecture des systèmes et les bases de données, il assure la robustesse et la fiabilité de la plateforme KivuPort.",
  },
  {
    name: "Birali Sekanabo Blessing",
    role: "Développeur Frontend",
    phone: "+243 995 910 469",
    location: "Kiwanja, Quartier Office 1",
    skills: "UI/UX & Expérience utilisateur",
    initials: "BS",
    photo: "/Blessing.jpeg",
    gradient: "from-emerald-600 to-teal-700",
    shadow: "shadow-emerald-500/20",
    social: {
      github: "https://github.com/biralisekanabo",
      linkedin: "https://linkedin.com/in/blessing",
      twitter: "https://twitter.com/blessing",
    },
    bio: "Spécialiste de l'expérience utilisateur, il crée des interfaces intuitives et modernes pour faciliter les réservations.",
  },
];

const stats = [
  { value: "15K+", label: "Traversées", icon: Ship },
  { value: "98%", label: "Satisfaction", icon: Star },
  { value: "50+", label: "Destinations", icon: Compass },
  { value: "24/7", label: "Support", icon: HeartHandshake },
];

const timeline = [
  {
    year: "2024",
    title: "Naissance du projet",
    desc: "L'idée de KivuPort est née de la volonté de moderniser les traversées sur le Lac Kivu.",
    icon: Rocket,
    color: "blue",
  },
  {
    year: "2025",
    title: "Développement",
    desc: "L'équipe s'est attelée à la conception et au développement de la plateforme.",
    icon: Code,
    color: "emerald",
  },
  {
    year: "2026",
    title: "Lancement officiel",
    desc: "KivuPort est désormais opérationnel, offrant une solution moderne de réservation.",
    icon: Rocket,
    color: "purple",
  },
];

const achievements = [
  { value: "100%", label: "Réservations en ligne", icon: TrendingUp },
  { value: "50+", label: "Destinations", icon: Compass },
  { value: "98%", label: "Satisfaction", icon: Star },
  { value: "24/7", label: "Support", icon: HeartHandshake },
];

// ===== COMPOSANTS =====

function ValueCard({ value, index }: { value: typeof values[0]; index: number }) {
  const colors = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", hover: "hover:border-blue-200" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", hover: "hover:border-emerald-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100", hover: "hover:border-purple-200" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", hover: "hover:border-amber-200" },
  } as const;
  const c = colors[value.color as keyof typeof colors];

  return (
    <motion.div
      className={`p-6 bg-white rounded-2xl border ${c.border} hover:shadow-xl ${c.hover} transition-all duration-300 group`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -6, scale: 1.01 }}
    >
      <motion.div 
        className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center transition-transform`}
        whileHover={{ rotate: -5, scale: 1.1 }}
      >
        <value.icon size={22} className={c.text} />
      </motion.div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{value.title}</h3>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{value.text}</p>
    </motion.div>
  );
}

// ===== COMPOSANT ÉQUIPE AVEC PHOTOS ARRONDIES ET ANIMATIONS =====
function TeamCard({ member }: { member: typeof teamMembers[0] }) {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-500 overflow-hidden group"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Photo arrondie */}
      <div className="relative pt-8 px-6 flex flex-col items-center">
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <div className={`absolute -inset-3 rounded-full bg-gradient-to-br ${member.gradient} opacity-20 blur-md group-hover:opacity-40 transition-opacity`} />
          
          <motion.div 
            className="absolute -inset-1 rounded-full border-2 border-transparent"
            style={{ borderImage: `linear-gradient(to bottom right, #3B82F6, #8B5CF6) 1` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          
          <motion.div 
            className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {member.photo && !imageError ? (
              <img
                src={member.photo}
                alt={member.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white text-2xl font-bold`}>
                {member.initials}
              </div>
            )}
          </motion.div>

          <motion.div 
            className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5 border-2 border-white shadow-lg"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CheckCircle size={14} className="text-white" />
          </motion.div>
        </motion.div>

        <motion.div 
          className="text-center mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 font-medium mt-0.5">
            <Briefcase size={14} />
            <span>{member.role}</span>
          </div>
        </motion.div>

        <motion.div 
          className="absolute top-4 right-4 z-10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className={`px-3 py-1 text-[10px] font-medium text-white rounded-full backdrop-blur-md bg-black/30 border border-white/20 shadow-lg`}>
            {member.role}
          </span>
        </motion.div>
      </div>

      <div className="p-6 pt-4">
        <motion.p 
          className="text-sm text-gray-600 leading-relaxed text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {member.bio}
        </motion.p>
        
        <motion.div 
          className="mt-4 space-y-2.5 text-sm max-w-xs mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div 
            className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors group/item justify-center"
            whileHover={{ x: 4 }}
          >
            <div className="p-1.5 bg-gray-100 rounded-lg group-hover/item:bg-blue-50 transition-colors">
              <Phone size={14} className="text-gray-400 group-hover/item:text-blue-600 transition-colors" />
            </div>
            <a href={`tel:${member.phone.replace(/\s/g, "")}`} className="hover:text-blue-600 transition-colors">
              {member.phone}
            </a>
          </motion.div>
          <motion.div 
            className="flex items-center gap-3 text-gray-600 justify-center"
            whileHover={{ x: 4 }}
          >
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <MapPin size={14} className="text-gray-400" />
            </div>
            <span>{member.location}</span>
          </motion.div>
          <motion.div 
            className="flex items-center gap-3 text-gray-600 justify-center"
            whileHover={{ x: 4 }}
          >
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Globe size={14} className="text-gray-400" />
            </div>
            <span>{member.skills}</span>
          </motion.div>
        </motion.div>

        <motion.div 
          className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {member.social.github && (
            <motion.a
              href={member.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-50 rounded-lg hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900"
              aria-label="GitHub"
              whileHover={{ scale: 1.15, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
            >
              <GithubIcon size={18} />
            </motion.a>
          )}
          {member.social.linkedin && (
            <motion.a
              href={member.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600"
              aria-label="LinkedIn"
              whileHover={{ scale: 1.15, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <LinkedinIcon size={18} />
            </motion.a>
          )}
          {member.social.twitter && (
            <motion.a
              href={member.social.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-50 rounded-lg hover:bg-sky-50 transition-colors text-gray-600 hover:text-sky-500"
              aria-label="Twitter"
              whileHover={{ scale: 1.15, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
            >
              <TwitterIcon size={18} />
            </motion.a>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

// ===== COMPOSANT STAT CARD ANIMÉ =====
function StatCard({ stat, index }: { stat: typeof stats[0]; index: number }) {
  return (
    <motion.div
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-center hover:bg-white/10 transition-colors group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.1 }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      <motion.div
        animate={{ 
          rotate: [0, 10, -10, 0],
        }}
        transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
      >
        <stat.icon size={24} className="mx-auto text-blue-300 mb-2" />
      </motion.div>
      <motion.div 
        className="text-2xl sm:text-3xl font-extrabold text-white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.6 + index * 0.1 }}
      >
        {stat.value}
      </motion.div>
      <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
    </motion.div>
  );
}

// ===== PAGE PRINCIPALE =====
export default function AboutPage() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.7]);

  return (
    <PublicLayout>
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute top-1/2 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          />
          <motion.div 
            className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, delay: 2 }}
          />
          
          {backgroundParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full bg-white/5"
              style={{
                width: particle.size,
                height: particle.size,
                left: `${particle.left}%`,
                top: `${particle.top}%`,
              }}
              animate={{
                y: [0, -50, 0],
                x: [0, 30, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
              }}
            />
          ))}
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            style={{ opacity }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-blue-200 border border-white/10 mb-6"
            >
              <Anchor size={16} />
              À propos de KivuPort
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              Le port de Goma,{" "}
              <span className="bg-gradient-to-r from-blue-400 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
                au service des Grands Lacs
              </span>
            </motion.h1>

            <motion.p
              className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              KivuPort connecte les communautés et les marchés autour du lac Kivu. Nous modernisons la navigation
              lacustre pour offrir des déplacements sûrs, confortables et accessibles à tous.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-wrap items-center justify-center gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/reservations"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all transform"
                >
                  Réserver maintenant
                  <ArrowRight size={18} />
                </Link>
              </motion.div>
              <motion.a
                href="#mission"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 backdrop-blur-sm transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                En savoir plus
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronDown size={16} />
                </motion.div>
              </motion.a>
            </motion.div>
          </motion.div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} index={index} />
            ))}
          </div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown size={24} className="text-white/30" />
        </motion.div>
      </section>

      {/* ===== MISSION ===== */}
      <section id="mission" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-600 text-sm font-medium mb-4">
                <Award size={16} />
                Notre mission
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                Rendre le lac Kivu <br />
                <span className="text-blue-600">plus accessible</span>
              </h2>
              <p className="mt-5 text-gray-600 leading-relaxed text-lg">
                Située à Goma, notre plateforme facilite la réservation de traversées maritimes pour les voyageurs,
                les marchandises et les professionnels. Grâce à une tarification transparente et à un suivi en temps
                réel, nous redonnons confiance à la navigation lacustre régionale.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <motion.span 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full"
                  whileHover={{ scale: 1.05 }}
                >
                  <CheckCircle size={16} />
                  Réservation instantanée
                </motion.span>
                <motion.span 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-full"
                  whileHover={{ scale: 1.05 }}
                >
                  <ShieldCheck size={16} />
                  Paiement sécurisé
                </motion.span>
                <motion.span 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 text-sm font-medium rounded-full"
                  whileHover={{ scale: 1.05 }}
                >
                  <Navigation size={16} />
                  Suivi en temps réel
                </motion.span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <motion.div 
                className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/20 bg-gradient-to-br from-blue-600 to-indigo-800 p-10 text-white min-h-[300px] flex flex-col justify-between"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="absolute top-6 right-6 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 rounded-full text-xs font-semibold"
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                  En direct
                </motion.div>
                <div>
                  <Ship size={48} className="text-blue-200 mb-4" />
                  <div className="text-2xl font-bold">Port de Goma</div>
                  <div className="text-blue-200 mt-1">Lac Kivu, République Démocratique du Congo</div>
                </div>
                <div className="flex items-center gap-4 mt-6 text-sm text-blue-200">
                  <span className="flex items-center gap-1">
                    <BadgeCheck size={16} />
                    Certifié
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={16} />
                    24/7
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={16} />
                    15K+ traversées
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== TIMELINE ===== */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-600 text-sm font-medium mb-4">
              <Clock size={16} />
              Notre histoire
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              L&apos;aventure <span className="text-blue-600">KivuPort</span>
            </h2>
            <p className="mt-2 text-gray-600">De l&apos;idée à la réalisation, découvrez notre parcours</p>
          </motion.div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {timeline.map((item, index) => {
              const colors = {
                blue: "from-blue-500 to-blue-600 shadow-blue-500/20",
                emerald: "from-emerald-500 to-emerald-600 shadow-emerald-500/20",
                purple: "from-purple-500 to-purple-600 shadow-purple-500/20",
              };
              return (
                <motion.div
                  key={item.year}
                  className="relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <motion.div 
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors[item.color as keyof typeof colors]} flex items-center justify-center text-white shadow-lg transition-transform`}
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <item.icon size={24} />
                  </motion.div>
                  <div className="mt-4 text-sm font-bold text-blue-600">{item.year}</div>
                  <h3 className="mt-1 text-lg font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== VALEURS ===== */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-600 text-sm font-medium mb-4">
              <Sparkles size={16} />
              Nos valeurs
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Ce qui guide <span className="text-blue-600">chacune de nos traversées</span>
            </h2>
            <p className="mt-2 text-gray-600">Des principes forts qui nous animent au quotidien</p>
          </motion.div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <ValueCard key={value.title} value={value} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== ÉQUIPE ===== */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-600 text-sm font-medium mb-4">
              <Users size={16} />
              L&apos;équipe
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Derrière <span className="text-blue-600">KivuPort</span>
            </h2>
            <p className="mt-2 text-gray-600">Une équipe passionnée au service de la région des Grands Lacs</p>
          </motion.div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {teamMembers.map((member) => (
              <TeamCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== ACHIEVEMENTS ===== */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-600 text-sm font-medium mb-4">
              <Award size={16} />
              Nos réalisations
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Des chiffres qui <span className="text-blue-600">parlent</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {achievements.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  className="bg-gray-50 rounded-2xl p-6 text-center hover:bg-blue-50 transition-colors border border-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                  >
                    <Icon size={28} className="mx-auto text-blue-600 mb-2" />
                  </motion.div>
                  <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{item.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-600 text-sm font-medium mb-4">
              <HeartHandshake size={16} />
              Contact
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Nous sommes là pour <span className="text-blue-600">vous aider</span>
            </h2>
            <p className="mt-2 text-gray-600">
              Une question, une suggestion ou un problème ? N&apos;hésitez pas à nous contacter.
            </p>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <motion.a
              href="tel:+243995910469"
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all text-center group"
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <motion.div 
                className="w-14 h-14 mx-auto bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors"
                whileHover={{ rotate: -5 }}
              >
                <Phone size={28} className="text-blue-600" />
              </motion.div>
              <div className="text-sm font-semibold text-gray-900 mt-3">Téléphone</div>
              <div className="text-sm text-gray-500 mt-1">+243 995 910 469</div>
            </motion.a>
            <motion.a
              href="mailto:kivuport@gmail.com"
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all text-center group"
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <motion.div 
                className="w-14 h-14 mx-auto bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors"
                whileHover={{ rotate: 5 }}
              >
                <Mail size={28} className="text-emerald-600" />
              </motion.div>
              <div className="text-sm font-semibold text-gray-900 mt-3">Email</div>
              <div className="text-sm text-gray-500 mt-1">kivuport@gmail.com</div>
            </motion.a>
            <motion.div
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all text-center group"
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <motion.div 
                className="w-14 h-14 mx-auto bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors"
                whileHover={{ rotate: -5 }}
              >
                <Clock size={28} className="text-purple-600" />
              </motion.div>
              <div className="text-sm font-semibold text-gray-900 mt-3">Disponibilité</div>
              <div className="text-sm text-gray-500 mt-1">24h/24, 7j/7</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-16 sm:px-16 text-center text-white shadow-2xl shadow-blue-500/30"
          >
            <motion.div 
              className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div 
              className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />

            <div className="relative">
              <motion.div
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Ship size={48} className="mx-auto text-blue-200 mb-4" />
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-bold">
                Prêt à traverser le <span className="text-blue-200">Lac Kivu</span> ?
              </h2>
              <p className="mt-4 text-blue-100 max-w-2xl mx-auto">
                Rejoignez des milliers de passagers qui nous font confiance chaque jour.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/reservations"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl"
                  >
                    Réserver maintenant
                    <ArrowRight size={18} />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 backdrop-blur-sm transition-all"
                  >
                    Mon espace
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}