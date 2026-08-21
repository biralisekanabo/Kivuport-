"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Anchor, CalendarDays, Ship, Ticket } from "lucide-react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

type Detail = { id: number; code_voyage: string; description?: string | null; date_depart: string; bateau?: { id?: number; nom?: string; capacite_passager?: number; capacite_cargaison?: number } | null; trajets?: { nom: string; date: string; distance: number; conceder?: { port?: { nom?: string; ville?: string } | null; ordre_etape?: number }[] }[] };
type Pavilion = { id: number; nom: string; classe?: string | null; capacite_max: number; unite: string; prix_unitaire: number; prix_tonne?: number | null; devise: string; idbateau: number };

export default function VoyageDetailPage() {
  const params = useParams<{ id: string }>();
  const [voyage, setVoyage] = useState<Detail | null>(null);
  const [pavilions, setPavilions] = useState<Pavilion[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    async function load() {
      const voyageResult = await supabase.from("voyages").select("id, code_voyage, description, date_depart, idbateau").eq("id", Number(params.id)).single();
      if (voyageResult.error || !voyageResult.data) { setError(voyageResult.error?.message || "Voyage introuvable."); return; }
      const [boatResult, routesResult, pavilionResult] = await Promise.all([
        supabase.from("bateaux").select("id, nom, capacite_passager, capacite_cargaison").eq("id", voyageResult.data.idbateau).single(),
        supabase.from("trajets").select("id, nom, date, distance").eq("idvoyage", Number(params.id)).order("date"),
        supabase.from("pavillons").select("id, nom, classe, capacite_max, unite, prix_unitaire, prix_tonne, devise, idbateau").eq("idbateau", voyageResult.data.idbateau).order("prix_unitaire"),
      ]);
      if (boatResult.error) { setError(`Impossible de charger le bateau : ${boatResult.error.message}`); return; }
      if (pavilionResult.error) { setError(`Impossible de charger les pavillons : ${pavilionResult.error.message}`); return; }
      setVoyage({ ...voyageResult.data, bateau: boatResult.data, trajets: routesResult.data || [] } as Detail);
      setPavilions((pavilionResult.data || []) as Pavilion[]);
    }
    load();
  }, [params.id]);
  if (error) return <main className="dashboard-loading"><p className="booking-message error" role="alert">Impossible de charger ce voyage : {error}</p><Link className="admin-primary" href="/voyages">Retour aux voyages</Link></main>;
  if (!voyage) return <main className="dashboard-loading"><Ship className="animate-pulse" size={28} /><p>Chargement du voyage...</p></main>;
  return <main className="travel-page"><header className="dashboard-header"><Link href="/voyages" className="brand"><span className="brand-symbol"><Ship size={20} /></span><span>KivuPort</span></Link></header><section className="travel-detail"><Link className="booking-back" href="/voyages"><ArrowLeft size={15} /> Tous les voyages</Link><p className="kicker"><span className="kicker-line" /> {voyage.code_voyage}</p><h1>{voyage.bateau?.nom || "Voyage KivuPort"}</h1><p className="dashboard-intro">{voyage.description || "Une traversée organisée depuis le port de Goma."}</p><div className="detail-grid"><article className="dashboard-card"><CalendarDays size={19} /><small>Départ</small><strong>{new Date(voyage.date_depart).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}</strong></article><article className="dashboard-card"><Ship size={19} /><small>Capacité</small><strong>{voyage.bateau?.capacite_passager || 0} passagers · {voyage.bateau?.capacite_cargaison || 0} t cargo</strong></article></div><section className="dashboard-card route-card"><div className="dashboard-card-title"><span><Anchor size={18} /></span><div><p>Trajet et escales</p><small>Ports et quais associés au voyage</small></div></div>{(voyage.trajets || []).map((route) => <div className="route-row" key={`${route.nom}-${route.date}`}><strong>{route.nom}</strong><span>{route.nom}</span></div>)}</section><section className="dashboard-card route-card"><div className="dashboard-card-title"><span><Ticket size={18} /></span><div><p>Pavillons disponibles</p><small>Choisissez une catégorie pour votre réservation</small></div></div>{pavilions.length === 0 ? <p className="booking-empty">Aucun pavillon disponible pour ce bateau.</p> : pavilions.map((pavilion) => <div className="route-row" key={pavilion.id}><div><strong>{pavilion.nom}</strong><span>{pavilion.classe || "Catégorie standard"} · capacité {pavilion.capacite_max} {pavilion.unite}</span></div><strong>{Number(pavilion.prix_unitaire || 0).toLocaleString("fr-FR")} {pavilion.devise}{Number(pavilion.prix_tonne || 0) > 0 ? ` · ${Number(pavilion.prix_tonne).toLocaleString("fr-FR")} ${pavilion.devise}/tonne` : ""}</strong></div>)}</section><Link className="admin-primary detail-book-button" href={`/reservations?voyage=${voyage.id}`}><Ticket size={17} /> Réserver ce voyage</Link></section></main>;
}