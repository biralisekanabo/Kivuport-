"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Menu,
  Ship,
  X,
  User,
  LogIn,
  UserPlus,
  Anchor,
  Globe,
  ChevronDown,
  Sparkles,
  Search,
  Compass,
  CalendarDays,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Sun,
  Moon,
  Settings,
  HelpCircle,
  LogOut,
  UserCircle,
  History,
  Ticket,
  Home,
  LayoutDashboard,
  Info,
  type LucideIcon,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type NavbarProps = { 
  onLogin: () => void; 
  onSignup: () => void;
  isAuthenticated?: boolean;
  user?: { name?: string; email?: string; avatar?: string } | null;
};

export function Navbar({ onLogin, onSignup, isAuthenticated = false, user = null }: NavbarProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const userMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fermer les menus au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Détection du scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Empêcher le scroll quand le menu est ouvert
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const openLogin = () => { closeMenu(); onLogin(); };
  const openSignup = () => { closeMenu(); onSignup(); };

  // ===== LIENS DE NAVIGATION =====
  const navItems = [
    { label: "Accueil", href: "/", icon: Home },
    { label: "Destinations", href: "/#destinations", icon: Compass },
    { label: "Services", href: "/#services", icon: Anchor },
    { label: "À propos", href: "/about", icon: Info },
  ];

  type UserMenuLink = { label: string; icon: LucideIcon; href: string; onClick?: () => void };
  type UserMenuDivider = { divider: true };
  const userMenuItems: Array<UserMenuLink | UserMenuDivider> = [
    { label: "Mon tableau de bord", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Mes réservations", icon: Ticket, href: "/reservations" },
    { label: "Mon profil", icon: UserCircle, href: "/profile" },
    { label: "Historique", icon: History, href: "/history" },
    { label: "Paramètres", icon: Settings, href: "/settings" },
    { label: "Aide & support", icon: HelpCircle, href: "/help" },
    { divider: true },
    { label: "Déconnexion", icon: LogOut, href: "#", onClick: () => {
      // Gérer la déconnexion ici
      console.log("Déconnexion");
      router.push("/");
    }},
  ];
  const userMenuLinks = userMenuItems.filter((item): item is UserMenuLink => !("divider" in item));
  const userMenuDividers = userMenuItems.filter((item): item is UserMenuDivider => "divider" in item);

  // ===== RENDU MOBILE =====
  const renderMobileMenu = () => (
    <AnimatePresence>
      {isMenuOpen && (
        <motion.div
          ref={menuRef}
          className="fixed inset-0 top-0 left-0 w-full h-full bg-white z-[100] overflow-y-auto"
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ top: 0, left: 0 }}
        >
          <div className="min-h-screen px-6 py-4 pb-32">
            {/* En-tête mobile avec bouton de fermeture */}
            <div className="flex items-center justify-between mb-8">
              <Link href="/" onClick={closeMenu} className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/40">
                  <Ship size={20} className="relative z-10" />
                </div>
                <span className="font-bold text-lg text-gray-900">KivuPort</span>
              </Link>
              <button
                onClick={closeMenu}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Fermer le menu"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Liens de navigation */}
            <div className="space-y-1">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center gap-4 px-4 py-4 text-lg font-medium text-gray-800 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <item.icon size={18} className="text-blue-600" />
                  </div>
                  {item.label}
                  <ArrowRight size={16} className="ml-auto text-gray-300" />
                </motion.a>
              ))}
            </div>

            <div className="h-px bg-gray-100 my-6" />

            {/* Actions principales */}
            <div className="space-y-3">
              {isAuthenticated ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25">
                      {user?.name?.[0] || "U"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user?.name || "Utilisateur"}</p>
                      <p className="text-xs text-gray-500">{user?.email || "user@email.com"}</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors shadow-sm"
                    onClick={closeMenu}
                  >
                    <LayoutDashboard size={18} className="text-blue-500" />
                    Accéder au tableau de bord
                    <ArrowRight size={14} className="ml-auto text-gray-300" />
                  </Link>
                </div>
              ) : (
                <>
                  <motion.button
                    type="button"
                    onClick={openLogin}
                    className="flex items-center justify-center gap-2 w-full px-4 py-4 text-base font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <LogIn size={18} />
                    Se connecter
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={openSignup}
                    className="flex items-center justify-center gap-2 w-full px-4 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all shadow-lg shadow-blue-500/30"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <UserPlus size={18} />
                    Créer un compte
                    <ArrowRight size={16} />
                  </motion.button>
                </>
              )}
            </div>

            {/* Contact rapide */}
            <div className="mt-8 p-4 bg-gray-50 rounded-2xl">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact</p>
              <div className="space-y-2">
                <a href="tel:+243995910469" className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  <Phone size={16} className="text-blue-500" />
                  +243 995 910 469
                </a>
                <a href="mailto:kivuport@gmail.com" className="flex items-center gap-3 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  <Mail size={16} className="text-blue-500" />
                  kivuport@gmail.com
                </a>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin size={16} className="text-blue-500" />
                  Goma, RDC
                </div>
              </div>
            </div>

            {/* Footer mobile */}
            <div className="mt-8 flex items-center justify-between text-xs text-gray-400">
              <span>© {new Date().getFullYear()} KivuPort</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  En ligne
                </span>
                <span className="text-[10px]">|</span>
                <span>Goma</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ===== RENDU DESKTOP =====
  const renderDesktopNav = () => (
    <nav className="hidden md:flex items-center gap-1" aria-label="Navigation principale">
      {navItems.map((item, index) => (
        <motion.a
          key={item.href}
          href={item.href}
          onClick={() => setActiveLink(item.href)}
          className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-xl ${
            activeLink === item.href
              ? "text-blue-700 bg-blue-50/80"
              : "text-gray-600 hover:text-blue-600 hover:bg-blue-50/50"
          }`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + index * 0.05 }}
          whileHover={{ y: -1 }}
        >
          <span className="flex items-center gap-1.5">
            <item.icon size={14} className="opacity-60" />
            {item.label}
          </span>
        </motion.a>
      ))}

      <div className="w-px h-6 bg-gray-200 mx-2" />

      {isAuthenticated ? (
        <div className="relative" ref={userMenuRef}>
          <motion.button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-blue-500/20">
              {user?.name?.[0] || "U"}
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {isUserMenuOpen && (
              <motion.div
                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 overflow-hidden"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-gray-100">
                  <p className="font-semibold text-gray-900 text-sm">{user?.name || "Utilisateur"}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || "user@email.com"}</p>
                </div>

                <div className="py-1">
                  {userMenuDividers.map((_, index) => (
                    <div key={`divider-${index}`} className="h-px bg-gray-100 my-1" />
                  ))}
                  {userMenuLinks.map((item, index) => (
                    <motion.a
                      key={item.label}
                      href={item.href}
                      onClick={item.onClick || (() => { setIsUserMenuOpen(false); })}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <item.icon size={16} className="text-gray-400" />
                      {item.label}
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <>
          <motion.button
            type="button"
            onClick={openLogin}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-xl hover:bg-blue-50/50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogIn size={16} />
            Connexion
          </motion.button>

          <motion.button
            type="button"
            onClick={openSignup}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <UserPlus size={16} />
            <span className="hidden lg:inline">Créer un compte</span>
            <span className="lg:hidden">S'inscrire</span>
          </motion.button>
        </>
      )}
    </nav>
  );

  // ===== RENDU PRINCIPAL =====
  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? "bg-white/95 backdrop-blur-md shadow-lg shadow-black/5 border-b border-gray-100/50" 
            : "bg-white/80 backdrop-blur-sm"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-[72px]">
            {/* ===== LOGO ===== */}
            <Link 
              href="/" 
              className="flex items-center gap-2.5 group shrink-0"
              aria-label="KivuPort, accueil"
              onClick={closeMenu}
            >
              <motion.div
                className="relative"
                whileHover={{ rotate: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/40">
                  <Ship size={20} className="relative z-10" />
                </div>
              </motion.div>
              <div className="flex items-baseline">
                <span className="font-bold text-xl text-gray-900 tracking-tight">
                  KivuPort
                </span>
                <span className="ml-2 text-[10px] font-semibold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-full border border-blue-200/50 hidden sm:inline">
                  Goma
                </span>
              </div>
            </Link>

            {/* ===== DESKTOP NAVIGATION ===== */}
            {renderDesktopNav()}

            {/* ===== BOUTON MENU MOBILE ===== */}
            <motion.button
              ref={buttonRef}
              className="md:hidden p-2.5 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-all relative z-[200]"
              type="button"
              aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={isMenuOpen}
              onClick={toggleMenu}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={24} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu size={24} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ===== MENU MOBILE ===== */}
      {renderMobileMenu()}
    </>
  );
}