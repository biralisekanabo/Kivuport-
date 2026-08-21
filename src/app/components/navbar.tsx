"use client";

import Link from "next/link";
import { ArrowRight, Menu, Ship, X } from "lucide-react";
import { useState } from "react";

type NavbarProps = { onLogin: () => void; onSignup: () => void };

export function Navbar({ onLogin, onSignup }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);
  const openLogin = () => { closeMenu(); onLogin(); };
  const openSignup = () => { closeMenu(); onSignup(); };

  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="KivuPort, accueil" onClick={closeMenu}>
        <span className="brand-symbol"><Ship size={20} /></span>
        <span>KivuPort</span>
      </Link>
      <button className="menu-button" type="button" aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)}>
        {isMenuOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
      <nav className={`site-nav${isMenuOpen ? " is-open" : ""}`} aria-label="Navigation principale">
        <a href="#services" onClick={closeMenu}>Nos services</a>
        <a href="#fonctionnement" onClick={closeMenu}>Comment ça marche</a>
        <button type="button" onClick={openLogin}>Connexion</button>
        <button type="button" className="header-button" onClick={openSignup}>Créer un compte <ArrowRight size={16} /></button>
      </nav>
    </header>
  );
}
