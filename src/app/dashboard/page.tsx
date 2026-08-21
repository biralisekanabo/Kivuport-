"use client";

import { useEffect, useState } from "react";
import { Anchor, CalendarDays, LogOut, Mail, Save, ShieldCheck, Ship, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-browser";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const response = await fetch("/api/admin/status", {
          headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        });
        if (response.ok) setIsAdmin((await response.json()).isAdmin === true);
      }
      setIsLoading(false);
    }

    loadUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) router.replace("/");
      if (session?.user) {
        setUser(session.user);
        setName(session.user.user_metadata?.name ?? "");
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

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
    setMessage("Profil mis à jour.");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (isLoading) return <main className="dashboard-loading"><Ship className="animate-pulse" size={28} /><p>Chargement de votre espace...</p></main>;
  if (!user) return null;
  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a href="/" className="brand"><span className="brand-symbol"><Ship size={20} /></span><span>KivuPort</span></a>
        <div className="dashboard-header-actions">{isAdmin && <Link className="dashboard-admin-link" href="/admin"><ShieldCheck size={16} /> Administration</Link>}<Link className="dashboard-admin-link" href="/settings">Réglages</Link><button className="dashboard-logout" type="button" onClick={logout}><LogOut size={16} /> Déconnexion</button></div>
      </header>
      <section className="dashboard-content">
        <p className="kicker"><span className="kicker-line" /> Port de Goma</p>
        <h1>Bonjour {name || "et bienvenue"}.</h1>
        <p className="dashboard-intro">{isAdmin ? "Espace d'administration KivuPort." : "Votre espace personnel KivuPort."}</p>
        {!isAdmin && <div className="dashboard-shortcuts"><Link className="dashboard-button" href="/voyages"><CalendarDays size={16} /> Voir les voyages</Link><Link className="dashboard-button" href="/reservations"><Anchor size={16} /> Mes réservations</Link></div>}
        <div className="dashboard-grid">
          <article className="dashboard-card profile-card">
            <div className="dashboard-card-title"><span><UserRound size={18} /></span><div><p>Mon profil</p><small>Informations du compte</small></div></div>
            <form onSubmit={saveProfile} className="profile-form">
              <label>Nom complet<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Votre nom" /></label>
              <label>Email<div className="readonly-field"><Mail size={15} />{user.email}</div></label>
              {message && <p className="profile-message" role="status">{message}</p>}
              <button type="submit" className="dashboard-button" disabled={isSaving}><Save size={16} /> {isSaving ? "Enregistrement..." : "Enregistrer"}</button>
            </form>
          </article>
          <article className="dashboard-card empty-bookings">
            <span>{isAdmin ? <ShieldCheck size={21} /> : <Anchor size={21} />}</span>
            <h2>{isAdmin ? "Administration" : "Mes réservations"}</h2>
            <p>{isAdmin ? "Compte administrateur connecté." : "Vos prochaines réservations apparaîtront ici."}</p>
            {!isAdmin && <Link className="dashboard-button booking-link" href="/reservations"><Anchor size={16} /> Gérer mes réservations</Link>}
          </article>
        </div>
      </section>
    </main>
  );
}
