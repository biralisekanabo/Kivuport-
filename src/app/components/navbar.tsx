"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { 
  User, Menu, X, LogOut, LayoutDashboard, 
  Loader2, Home, Ship, Ticket, CalendarDays, Compass, Sparkles,
  Moon, Sun, Shield, Award, Crown, Gem, Waves, Anchor, Bell,
  Gift, Headphones, ChevronRight, Star, TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { applyTheme, getStoredTheme, resolveTheme } from '@/lib/theme';
import { supabase } from '@/lib/supabase-browser';

type NavbarUser = {
  email?: string;
  name?: string;
  nom?: string;
  username?: string;
};

type NavbarProps = {
  onLogin?: () => void;
  onSignup?: () => void;
  authOpen?: boolean;
};

export function Navbar({ onLogin, onSignup, authOpen = false }: NavbarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isUserOpen, setIsUserOpen] = useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  
  const [user, setUser] = useState<NavbarUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { scrollY, scrollYProgress } = useScroll();

  // --- Gestion du thème ---
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ? {
        email: data.user.email,
        name: data.user.user_metadata?.name,
        nom: data.user.user_metadata?.nom,
        username: data.user.user_metadata?.username,
      } : null);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ? {
        email: session.user.email,
        name: session.user.user_metadata?.name,
        nom: session.user.user_metadata?.nom,
        username: session.user.user_metadata?.username,
      } : null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setTheme(resolveTheme(getStoredTheme()));
    const handleThemeChange = (event: Event) => {
      const preference = (event as CustomEvent<"light" | "dark" | "system">).detail || getStoredTheme();
      setTheme(resolveTheme(preference));
    };
    window.addEventListener("kivuport-theme-change", handleThemeChange);
    return () => window.removeEventListener("kivuport-theme-change", handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const themeLabel = theme === "dark" ? "Mode clair" : "Mode sombre";

  // --- Gestion du scroll ---
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (pathname !== '/') return;
    if (latest > 20 && !isScrolled) setIsScrolled(true);
    if (latest <= 20 && isScrolled) setIsScrolled(false);
  });

  // --- Fermeture des menus ---
  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserOpen(false);
      }
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (isMobileMenuOpen || isAuthOpen) ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen, isAuthOpen]);

  // --- Conditions d'affichage ---
  if (pathname !== '/') {
    return null;
  }

  // --- Handlers ---
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setIsMobileMenuOpen(false);
      setIsUserOpen(false);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    }
  };

  const openLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      setIsAuthOpen(true);
    }
  };

  const displayNom = user ? (user.nom || user.name || user.username || "Client") : "";
  const initial = displayNom ? displayNom[0].toUpperCase() : "?";

  // --- Liens de navigation ---
  const navLinks = [
    { name: 'Traversées', href: '/voyages', icon: Ship },
    { name: 'Réservations', href: '/reservations', icon: Ticket },
    { name: 'Services', href: '/services', icon: Anchor },
    { name: 'Contact', href: '/contact', icon: Headphones },
  ];

  const userMenuItems = [
    { label: "Mon tableau de bord", href: "/dashboard", icon: LayoutDashboard, color: "text-blue-500" },
    { label: "Mes réservations", href: "/reservations", icon: Ticket, color: "text-emerald-500" },
    { label: "Mon profil", href: "/profile", icon: User, color: "text-purple-500" },
    { label: "Historique", href: "/history", icon: TrendingUp, color: "text-amber-500" },
  ];

  const isHome = pathname === '/';

  // --- Animations ---
  const glowVariants = {
    initial: { opacity: 0.2, scale: 0.8 },
    animate: {
      opacity: [0.2, 0.5, 0.2],
      scale: [0.8, 1.2, 0.8],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const }
    }
  };

  return (
    <>
      <nav 
        role="navigation" 
        aria-label="Navigation principale" 
        className={`fixed top-0 left-0 right-0 z-[100] overflow-visible transition-all duration-500 ${
          (authOpen || isAuthOpen) ? 'pointer-events-none invisible opacity-0' : ''
        } ${
          isScrolled ? 'py-1' : 'py-4'
        }`}
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-24 w-[min(78vw,44rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/30 blur-3xl dark:bg-blue-500/25"
          animate={{ x: ["-8%", "8%", "-8%"], scale: [0.92, 1.08, 0.92], opacity: [0.45, 0.8, 0.45] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-14 w-[min(52vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-2xl dark:bg-cyan-400/20"
          animate={{ x: ["10%", "-10%", "10%"], y: [-4, 4, -4], opacity: [0.3, 0.65, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        {/* Barre de progression */}
        <motion.div 
          className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 origin-left"
          style={{ scaleX: scrollYProgress }}
        />

        <div className="container mx-auto px-4 md:px-6">
          <motion.div 
            className={`relative flex items-center justify-between px-4 py-2 rounded-2xl transition-all duration-500 ${
              isScrolled || !isHome
                ? 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-2xl shadow-blue-500/5 border border-white/20 dark:border-white/5'
                : 'bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/10 dark:border-white/5'
            }`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Effet de lueur */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
              <motion.div
                className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl"
                variants={glowVariants}
                initial="initial"
                animate="animate"
              />
              <motion.div
                className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-indigo-400/8 blur-3xl"
                variants={glowVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: 2 }}
              />
            </div>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 opacity-20 blur-md" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Ship size={20} className="text-white drop-shadow-sm" />
                  <motion.div
                    className="absolute -right-1 -top-1"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    
                  </motion.div>
                </div>
              </motion.div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none">
                  Kivu<span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Port</span>
                </span>
                <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-blue-500 mt-0.5">
                  Navigation
                </span>
              </div>
            </Link>

            {/* Liens de navigation desktop */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  onMouseEnter={() => setHoveredLink(link.name)}
                  onMouseLeave={() => setHoveredLink(null)}
                  className="nav-icon-action group relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300"
                  title={link.name}
                  aria-label={link.name}
                >
                  <span className="relative flex items-center gap-1.5">
                    <link.icon size={24} strokeWidth={2.4} className="transition-colors" />
                  </span>
                  {hoveredLink === link.name && (
                    <motion.div 
                      layoutId="navUnderline"
                      className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Thème */}
              <motion.button
                type="button"
                onClick={toggleTheme}
                className="nav-icon-action flex h-12 w-12 items-center justify-center rounded-full transition-colors"
                whileHover={{ scale: 1.1, rotate: theme === "dark" ? -15 : 15 }}
                whileTap={{ scale: 0.9 }}
                aria-label={themeLabel}
              >
                <ThemeIcon size={23} strokeWidth={2.4} />
              </motion.button>

              {/* Utilisateur */}
              {isLoading ? (
                <div className="nav-icon-action flex h-12 w-12 items-center justify-center"><Loader2 size={23} className="animate-spin text-blue-600" /></div>
              ) : (
                <>
                  {user ? (
                    <div className="relative" ref={userMenuRef}>
                      <motion.button
                        type="button"
                        onClick={() => setIsUserOpen(!isUserOpen)}
                        className="flex items-center gap-2 rounded-full p-1 transition-all hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="relative">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-500/20">
                            {initial}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400 shadow-sm shadow-emerald-400/30 dark:border-slate-900" />
                        </div>
                        <span className="hidden sm:inline text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                          {displayNom}
                        </span>
                      </motion.button>

                      {/* Menu utilisateur */}
                      <AnimatePresence>
                        {isUserOpen && (
                          <motion.div
                            className="absolute right-0 top-full mt-3 w-72 origin-top-right overflow-hidden rounded-2xl border border-white/20 bg-white/90 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/90 dark:shadow-black/30"
                            initial={{ opacity: 0, y: -15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            role="menu"
                          >
                            {/* En-tête avec dégradé */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-400 to-indigo-500 p-4 text-white">
                              <div className="absolute inset-0 opacity-10">
                                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white" />
                                <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white" />
                              </div>
                              <div className="relative flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-bold shadow-xl backdrop-blur-sm">
                                  {initial}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold drop-shadow-sm">{displayNom}</p>
                                  <p className="text-xs text-blue-100/80">{user.email || "Utilisateur"}</p>
                                </div>
                                <Crown size={18} className="text-amber-300 drop-shadow-lg" />
                              </div>
                            </div>

                            {/* Badge premium */}
                            <div className="mx-3 mt-3 flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-50/80 to-amber-100/50 px-3 py-2 dark:from-amber-900/20 dark:to-amber-800/20">
                              <Award size={14} className="text-amber-500" />
                              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Membre Premium</span>
                              <span className="ml-auto text-[10px] font-bold text-amber-600 dark:text-amber-400">1 250 pts</span>
                            </div>

                            {/* Liens */}
                            <div className="p-2">
                              {userMenuItems.map((item) => (
                                <motion.div
                                  key={item.href}
                                  whileHover={{ x: 4 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Link
                                    href={item.href}
                                    onClick={() => setIsUserOpen(false)}
                                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition-all hover:bg-slate-100/70 dark:text-slate-200 dark:hover:bg-slate-800/50"
                                  >
                                    <item.icon size={18} className={item.color} />
                                    <span className="flex-1">{item.label}</span>
                                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
                                  </Link>
                                </motion.div>
                              ))}
                            </div>

                            {/* Actions */}
                            <div className="border-t border-slate-200/50 p-2 dark:border-slate-700/50">
                              <button
                                type="button"
                                onClick={toggleTheme}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition-all hover:bg-slate-100/70 dark:text-slate-200 dark:hover:bg-slate-800/50"
                              >
                                <ThemeIcon size={18} className="text-slate-400" />
                                <span className="flex-1">{themeLabel}</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-500 transition-all hover:bg-red-50/70 dark:text-red-400 dark:hover:bg-red-900/20"
                              >
                                <LogOut size={18} />
                                <span className="flex-1">Déconnexion</span>
                              </button>
                            </div>

                            {/* Support */}
                            <div className="flex items-center gap-3 border-t border-slate-200/50 px-4 py-2.5 dark:border-slate-700/50">
                              <Headphones size={14} className="text-slate-400" />
                              <span className="text-xs text-slate-400">Support 24/7</span>
                              <span className="ml-auto text-xs font-medium text-blue-500">+243 123 456 789</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <motion.button 
                      onClick={openLogin}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <User size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Compte</span>
                    </motion.button>
                  )}
                </>
              )}

              {/* Menu mobile */}
              <motion.button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-slate-900 dark:text-white bg-slate-100/80 dark:bg-slate-800/80 rounded-full hover:bg-blue-600 hover:text-white transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Menu mobile */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-full left-0 right-0 px-6 mt-4 lg:hidden"
              >
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 space-y-4">
                  {user && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                          {initial}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Connecté</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{displayNom}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="p-3 bg-white dark:bg-slate-800 rounded-xl text-blue-600 shadow-sm">
                          <LayoutDashboard size={20} />
                        </Link>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {navLinks.map((link) => (
                      <Link 
                        key={link.name} 
                        href={link.href} 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-slate-50 p-4 text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-blue-900/20"
                        title={link.name}
                        aria-label={link.name}
                      >
                        <link.icon size={22} strokeWidth={2.3} className="text-blue-700 dark:text-blue-300" />
                        <span className="sr-only">{link.name}</span>
                      </Link>
                    ))}
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs"
                  >
                    <ThemeIcon size={16} /> {themeLabel}
                  </button>
                  {user ? (
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/10 text-red-500 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs border border-red-100 dark:border-red-900/20">
                      <LogOut size={16} /> Déconnexion
                    </button>
                  ) : (
                    <button onClick={() => { openLogin(); setIsMobileMenuOpen(false); }} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-blue-500/30">
                      Connexion / Inscription
                    </button>
                  )}
                </div>
              </motion.div>
              <motion.div
                className="fixed inset-0 -z-10 bg-black/10 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
              />
            </>
          )}
        </AnimatePresence>
      </nav>

      {/* Modal Auth */}
      <AnimatePresence>
        {isAuthOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthOpen(false)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-sm"
            >
              {/* AuthForm à importer */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-800/50 p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Bienvenue</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Connectez-vous à votre espace KivuPort</p>
                </div>
                {/* Formulaire d'authentification */}
                <div className="space-y-4">
                  <input 
                    type="email" 
                    placeholder="Email" 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-blue-500/50 outline-none text-slate-900 dark:text-white"
                  />
                  <input 
                    type="password" 
                    placeholder="Mot de passe" 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-blue-500/50 outline-none text-slate-900 dark:text-white"
                  />
                  <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
                    Se connecter
                  </button>
                  <button 
                    onClick={() => setIsAuthOpen(false)}
                    className="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;