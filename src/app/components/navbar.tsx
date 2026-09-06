"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Anchor,
  Compass,
  HelpCircle,
  History,
  Home,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Settings,
  Ship,
  Sun,
  Ticket,
  UserCircle,
  UserPlus,
  X,
} from "lucide-react";
import { applyTheme, getStoredTheme, resolveTheme } from "@/lib/theme";

type NavbarProps = {
  onLogin: () => void;
  onSignup: () => void;
  isAuthenticated?: boolean;
  user?: { name?: string; email?: string; avatar?: string } | null;
};

const navItems = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Destinations", href: "/#carte", icon: Compass },
  { label: "Services", href: "/#services", icon: Anchor },
  { label: "À propos", href: "/about", icon: Info },
];

const userItems = [
  { label: "Mon tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Mes réservations", href: "/reservations", icon: Ticket },
  { label: "Mon profil", href: "/profile", icon: UserCircle },
  { label: "Historique", href: "/history", icon: History },
  { label: "Paramètres", href: "/settings", icon: Settings },
  { label: "Aide & support", href: "/help", icon: HelpCircle },
];

export function Navbar({ onLogin, onSignup, isAuthenticated = false, user = null }: NavbarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme(resolveTheme(getStoredTheme()));
    const handleThemeChange = (event: Event) => {
      const preference = (event as CustomEvent<"light" | "dark" | "system">).detail || getStoredTheme();
      setTheme(resolveTheme(preference));
    };
    window.addEventListener("kivuport-theme-change", handleThemeChange);
    return () => window.removeEventListener("kivuport-theme-change", handleThemeChange);
  }, []);

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
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  const closeMobile = () => setIsOpen(false);
  const themeLabel = theme === "dark" ? "Mode clair" : "Mode sombre";

  return (
    <nav className="bg-white dark:bg-slate-950 fixed w-full z-50 top-0 start-0 border-b border-gray-200 dark:border-slate-800">
      <div className="max-w-none grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center mx-auto px-3 sm:px-6 py-3">
        <Link href="/" onClick={closeMobile} className="flex items-center space-x-3 rtl:space-x-reverse md:col-start-1">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/25">
            <Ship size={20} />
          </span>
          <span className="self-center text-2xl text-gray-950 dark:text-white font-semibold whitespace-nowrap tracking-tight">KivuPort</span>
        </Link>

        <div className="flex items-center justify-end gap-1.5 md:col-start-3 md:row-start-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center justify-center w-10 h-10 text-gray-600 dark:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Activer le ${themeLabel.toLowerCase()}`}
            title={themeLabel}
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              {isUserOpen && (
                <div className="absolute right-0 top-full mt-3 z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl w-64 overflow-hidden" role="menu">
                  <div className="px-5 py-5 border-b border-gray-200 dark:border-slate-700">
                    <span className="block text-gray-900 dark:text-white font-semibold text-base">{user?.name || "Utilisateur"}</span>
                    <span className="block text-gray-500 dark:text-gray-400 text-base truncate">{user?.email || ""}</span>
                  </div>
                  <div className="p-3">
                    {userItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setIsUserOpen(false)} className="flex items-center w-full px-2.5 py-3 text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                        {item.label}
                      </Link>
                    ))}
                    <button type="button" onClick={() => router.push("/")} className="flex items-center w-full px-2.5 py-3 text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <button type="button" onClick={onLogin} className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800">
                <LogIn size={16} /> Connexion
              </button>
              <button type="button" onClick={onSignup} className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">
                <UserPlus size={16} /> Créer un compte
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (isAuthenticated) setIsUserOpen((open) => !open);
              else onLogin();
            }}
            className="hidden md:flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950"
            aria-label={isAuthenticated ? "Ouvrir le menu utilisateur" : "Se connecter"}
            title={isAuthenticated ? "Menu utilisateur" : "Se connecter"}
          >
            {user?.avatar ? (
              <img className="h-full w-full object-cover" src={user.avatar} alt="" />
            ) : (
              <img className="h-full w-full object-cover" src="/Blessing.jpeg" alt="Profil KivuPort" />
            )}
          </button>

          <button type="button" onClick={() => setIsOpen((open) => !open)} className="inline-flex items-center justify-center p-2 w-10 h-10 text-gray-600 dark:text-gray-200 rounded-lg md:hidden hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-controls="navbar-user" aria-expanded={isOpen}>
            <span className="sr-only">{isOpen ? "Fermer le menu" : "Ouvrir le menu"}</span>
            {isOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>

        <div className={`${isOpen ? "block" : "hidden"} col-span-2 items-center justify-between w-full md:col-span-1 md:flex md:w-auto md:col-start-2 md:row-start-1`} id="navbar-user">
          <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900 md:flex-row md:items-center md:gap-10 md:mt-0 md:border-0 md:bg-white md:dark:bg-slate-950">
            {navItems.map((item, index) => (
              <li key={item.href}>
                <Link href={item.href} onClick={closeMobile} className={`flex items-center gap-2 py-2 px-3 rounded-lg text-lg text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-800 md:hover:bg-transparent md:dark:hover:bg-transparent md:hover:text-blue-600 ${index === 0 ? "text-blue-600 md:text-blue-600" : ""}`} aria-current={index === 0 ? "page" : undefined}>
                  <item.icon size={15} className="md:hidden" />
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="md:hidden border-t border-gray-200 dark:border-slate-700 mt-2 pt-2">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" onClick={closeMobile} className="flex items-center gap-2 py-2 px-3 text-gray-800 dark:text-gray-200"><LayoutDashboard size={15} /> Tableau de bord</Link>
                  <button type="button" onClick={() => { closeMobile(); router.push("/"); }} className="flex items-center gap-2 w-full py-2 px-3 text-left text-gray-800 dark:text-gray-200"><LogOut size={15} /> Déconnexion</button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <button type="button" onClick={() => { closeMobile(); onLogin(); }} className="flex items-center gap-2 py-2 px-3 text-blue-600"><LogIn size={15} /> Connexion</button>
                  <button type="button" onClick={() => { closeMobile(); onSignup(); }} className="flex items-center gap-2 py-2 px-3 text-blue-600"><UserPlus size={15} /> Créer un compte</button>
                </div>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
