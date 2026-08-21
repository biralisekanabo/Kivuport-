"use client";

import { useState } from "react";
import {
  Anchor,
  ArrowRight,
  CalendarDays,
  Compass,
  LogIn,
  MapPin,
  Ship,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { Footer } from "@/app/components/footer";
import { LoginModal } from "@/app/components/login-modal";
import { Navbar } from "@/app/components/navbar";
import { SignupModal } from "@/app/components/signup-modal";

export default function Home() {
  const [authMode, setAuthMode] = useState<"login" | "signup" | null>(null);

  return (
    <div className="home-page">
      <Navbar onLogin={() => setAuthMode("login")} onSignup={() => setAuthMode("signup")} />

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="kicker"><span className="kicker-line" /> Port de Goma</p>
            <h1>Votre traversée commence <em>ici.</em></h1>
            <p className="hero-description">Réservez une traversée depuis le port de Goma et suivez votre réservation en toute simplicité.</p>
            <div className="hero-actions">
              <button type="button" className="primary-button" onClick={() => setAuthMode("signup")}>Réserver une traversée <ArrowRight size={18} /></button>
              <button type="button" className="secondary-button" onClick={() => setAuthMode("login")}><LogIn size={17} /> Accéder à mon espace</button>
            </div>
            <div className="hero-note"><ShieldCheck size={17} /> Paiements et informations protégés</div>
          </div>

          <div className="route-visual" aria-label="Illustration du port de Goma">
            <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
            <div className="route-label route-label-top"><MapPin size={15} /><span>Port de Goma</span><small>Départ</small></div>
            <div className="route-label route-label-bottom"><MapPin size={15} /><span>Zone portuaire</span><small>Goma</small></div>
            <div className="route-path"><span className="route-dot dot-start" /><span className="route-dot dot-end" /><Ship className="route-ship" size={31} /></div>
            <div className="visual-caption"><span><Compass size={16} /> Port de Goma</span><strong>Départs du jour</strong><small>Réservations disponibles</small></div>
          </div>
        </section>

        <section className="booking-strip" id="fonctionnement">
          <div className="strip-heading"><span className="strip-icon"><Ticket size={19} /></span><div><p>Port de Goma</p><strong>Réserver une traversée</strong></div></div>
          <div className="strip-fields"><div><MapPin size={16} /><span>Départ</span><strong>Port de Goma</strong></div><div><Anchor size={16} /><span>Service</span><strong>Passager ou cargaison</strong></div><div><CalendarDays size={16} /><span>Date</span><strong>Choisir une date</strong></div><button type="button" onClick={() => setAuthMode("signup")} className="strip-button" aria-label="Réserver une traversée"><ArrowRight size={20} /></button></div>
        </section>

        <section className="services-section" id="services">
          <div className="section-heading"><div><p className="kicker"><span className="kicker-line" /> Services du port</p><h2>Simple, local, efficace.</h2></div><p>Tout le nécessaire pour vos réservations au port de Goma.</p></div>
          <div className="service-grid"><article><span><Ship size={20} /></span><h3>Voyages &amp; horaires</h3><p>Consultez les départs planifiés et choisissez le trajet qui vous convient.</p></article><article><span><Ticket size={20} /></span><h3>Réservations faciles</h3><p>Réservez une place ou une cargaison en quelques étapes claires.</p></article><article><span><ShieldCheck size={20} /></span><h3>Suivi en confiance</h3><p>Retrouvez vos demandes, confirmations et paiements au même endroit.</p></article></div>
        </section>
      </main>

      <Footer />
      {authMode === "login" && <LoginModal onClose={() => setAuthMode(null)} onSignup={() => setAuthMode("signup")} />}
      {authMode === "signup" && <SignupModal onClose={() => setAuthMode(null)} onLogin={() => setAuthMode("login")} />}
    </div>
  );
}
