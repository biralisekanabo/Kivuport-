"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu, Ship, X, User, LogIn, UserPlus, Anchor, Globe, ChevronDown, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

type NavbarProps = { 
  onLogin: () => void; 
  onSignup: () => void;
};

export function Navbar({ onLogin, onSignup }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("");

  const closeMenu = () => setIsMenuOpen(false);
  const openLogin = () => { closeMenu(); onLogin(); };
  const openSignup = () => { closeMenu(); onSignup(); };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Services", href: "#services", icon: Anchor },
    { label: "Comment ça marche", href: "#fonctionnement", icon: Globe },
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? "bg-white shadow-lg shadow-black/10 border-b border-gray-100" 
          : "bg-white/95 backdrop-blur-sm shadow-sm"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-[72px]">
          {/* Logo - Version Premium avec visibilité maximale */}
          <Link 
            href="/" 
            className="flex items-center gap-2.5 group"
            aria-label="KivuPort, accueil"
            onClick={closeMenu}
          >
            <motion.div
              className="relative"
              whileHover={{ rotate: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/40">
                <Ship size={20} className="relative z-10" />
              </div>
            </motion.div>
            <div className="flex items-baseline">
              <span className="font-bold text-xl text-gray-900">
                KivuPort
              </span>
              <span className="ml-2 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 hidden sm:inline">
                Goma
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - VISIBLE ET CLAIRE */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navigation principale">
            {navItems.map((item, index) => (
              <motion.a
                key={item.href}
                href={item.href}
                onClick={() => {
                  closeMenu();
                  setActiveLink(item.href);
                }}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-xl ${
                  activeLink === item.href
                    ? "text-blue-700 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50/80"
                }`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center gap-1.5">
                  <item.icon size={15} className="opacity-70" />
                  {item.label}
                </span>
              </motion.a>
            ))}

            {/* Séparateur */}
            <div className="w-px h-6 bg-gray-300 mx-2" />

            {/* Bouton Connexion - CLAIR ET VISIBLE */}
            <motion.button
              type="button"
              onClick={openLogin}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors rounded-xl hover:bg-blue-50/80"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogIn size={16} />
              Connexion
            </motion.button>

            {/* Bouton Créer un compte - PREMIUM ET VISIBLE */}
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
              <span className="hidden sm:inline">Créer un compte</span>
              <span className="sm:hidden">S'inscrire</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </nav>

          {/* Mobile Menu Button - VISIBLE */}
          <motion.button
            className="md:hidden p-2.5 rounded-xl text-gray-700 hover:text-blue-600 hover:bg-blue-50/80 transition-all relative z-10"
            type="button"
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
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

      {/* Mobile Menu - Premium avec haute visibilité */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden absolute top-full left-0 right-0 bg-white shadow-2xl shadow-black/20 border-t border-gray-100"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="px-4 py-6 space-y-1">
              {/* Mobile Nav Items - VISIBLES */}
              {navItems.map((item, index) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-800 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + index * 0.05 }}
                  whileHover={{ x: 5 }}
                >
                  <item.icon size={18} className="text-blue-500" />
                  {item.label}
                </motion.a>
              ))}

              <div className="h-px bg-gray-200 my-3" />

              {/* Mobile Buttons - VISIBLES ET CLAIRS */}
              <motion.button
                type="button"
                onClick={openLogin}
                className="flex items-center gap-3 w-full px-4 py-3.5 text-base font-medium text-gray-800 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ x: 5 }}
              >
                <LogIn size={18} className="text-blue-500" />
                Connexion
              </motion.button>

              <motion.button
                type="button"
                onClick={openSignup}
                className="flex items-center justify-center gap-2 w-full px-4 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all shadow-md shadow-blue-500/30"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <UserPlus size={18} />
                Créer un compte
                <ArrowRight size={16} />
              </motion.button>

              {/* Footer mobile - VISIBLE */}
              <motion.div
                className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span className="text-xs text-gray-500">
                  © {new Date().getFullYear()} KivuPort
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-500">Sécurisé</span>
                  <span className="text-[10px] text-gray-400">|</span>
                  <span className="text-xs text-gray-500">Goma</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}