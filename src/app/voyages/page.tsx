"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Search, Ship } from "lucide-react";
import { supabase } from "@/lib/supabase-browser";

type Voyage = { id: number; idbateau: number; code_voyage: string; description?: string | null; statut: string; date_depart: string; prix_minimum: number; bateau?: { nom?: string; capacite_passager?: number; capacite_cargaison?: number } | null; trajets?: { nom: string; date: string; distance: number }[] };

export default function VoyagesPage() {
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [query, setQuery] = useState("");
  const [port, setPort] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState("date-asc");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const pageSize = 10;

  useEffect(() => {
    async function load() {
      const voyagesResult = await supabase.from("voyages").select("id, idbateau, code_voyage, description, statut, date_depart").eq("statut", "prevu").order("date_depart");
      if (voyagesResult.error) { setError(`Impossible de charger les voyages : ${voyagesResult.error.message}`); return; }
      const baseVoyages = (voyagesResult.data || []) as { id: number; idbateau: number; code_voyage: string; description?: string | null; statut: string; date_depart: string }[];
      const boatIds = [...new Set(baseVoyages.map((voyage) => voyage.idbateau))];
      const voyageIds = baseVoyages.map((voyage) => voyage.id);
      const [boatsResult, pavilionsResult, routesResult] = await Promise.all([
        boatIds.length ? supabase.from("bateaux").select("id, nom, capacite_passager, capacite_cargaison").in("id", boatIds) : Promise.resolve({ data: [], error: null }),
        boatIds.length ? supabase.from("pavillons").select("idbateau, prix_unitaire").in("idbateau", boatIds) : Promise.resolve({ data: [], error: null }),
        voyageIds.length ? supabase.from("trajets").select("idvoyage, nom, date, distance").in("idvoyage", voyageIds) : Promise.resolve({ data: [], error: null }),
      ]);
      const errors = [boatsResult.error, pavilionsResult.error, routesResult.error].filter(Boolean);
      if (errors.length) setError(`Certaines informations de voyage sont indisponibles : ${errors[0]?.message}`);
      const boatsById = new Map((boatsResult.data || []).map((boat) => [boat.id, boat]));
      const routesByVoyage = new Map<number, { nom: string; date: string; distance: number }[]>();
      (routesResult.data || []).forEach((route) => routesByVoyage.set(route.idvoyage, [...(routesByVoyage.get(route.idvoyage) || []), route]));
      const pricesByBoat = new Map<number, number>();
      (pavilionsResult.data || []).forEach((pavilion) => { const price = Number(pavilion.prix_unitaire || 0); pricesByBoat.set(pavilion.idbateau, Math.min(pricesByBoat.get(pavilion.idbateau) ?? Number.POSITIVE_INFINITY, price)); });
      setVoyages(baseVoyages.map((voyage) => ({ ...voyage, bateau: boatsById.get(voyage.idbateau) || null, trajets: routesByVoyage.get(voyage.id) || [], prix_minimum: pricesByBoat.get(voyage.idbateau) ?? 0 })));
    }
    load();
  }, []);

  const filtered = useMemo(() => voyages.filter((voyage) => { const haystack = `${voyage.code_voyage} ${voyage.description || ""} ${voyage.bateau?.nom || ""} ${(voyage.trajets || []).map((route) => route.nom).join(" ")}`.toLowerCase(); const date = voyage.date_depart.slice(0, 10); return haystack.includes(query.toLowerCase()) && (!port || haystack.includes(port.toLowerCase())) && (!fromDate || date >= fromDate) && (!toDate || date <= toDate); }).sort((left, right) => sort === "date-desc" ? right.date_depart.localeCompare(left.date_depart) : sort === "price-asc" ? left.prix_minimum - right.prix_minimum : sort === "price-desc" ? right.prix_minimum - left.prix_minimum : left.date_depart.localeCompare(right.date_depart)), [fromDate, port, query, sort, toDate, voyages]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const resetPage = () => setPage(1);

  return <main className="travel-page"><header className="dashboard-header"><Link href="/dashboard" className="brand"><span className="brand-symbol"><Ship size={20} /></span><span>KivuPort</span></Link><Link href="/dashboard" className="dashboard-logout">Mon espace</Link></header><section className="travel-content"><Link className="booking-back" href="/dashboard"><ArrowLeft size={15} /> Mon espace</Link><p className="kicker"><span className="kicker-line" /> Horaires du port</p><h1>Voyages disponibles.</h1><p className="dashboard-intro">Consultez les départs futurs et préparez votre réservation.</p>{error && <p className="booking-message error" role="alert">{error}</p>}<div className="travel-filters"><label><Search size={15} /><input value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder="Code, bateau ou trajet" /></label><label><Search size={15} /><input value={port} onChange={(event) => { setPort(event.target.value); resetPage(); }} placeholder="Port" /></label><label><CalendarDays size={15} /><input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); resetPage(); }} /></label><label><CalendarDays size={15} /><input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); resetPage(); }} /></label><select value={sort} onChange={(event) => { setSort(event.target.value); resetPage(); }}><option value="date-asc">Départ bientôt</option><option value="date-desc">Départ le plus tard</option><option value="price-asc">Prix croissant</option><option value="price-desc">Prix décroissant</option></select></div><div className="travel-list">{visible.length === 0 ? <p className="booking-empty">Aucun voyage publié par l’administration avec le statut « prévu ».</p> : visible.map((voyage) => <article className="travel-card" key={voyage.id}><span className="admin-icon"><Ship size={19} /></span><div><small>{voyage.code_voyage}</small><h2>{voyage.bateau?.nom || "Bateau KivuPort"}</h2><p>{voyage.description || (voyage.trajets || []).map((route) => route.nom).join(" · ") || "Trajet à consulter"}</p><strong>{voyage.prix_minimum > 0 ? `À partir de ${voyage.prix_minimum.toLocaleString("fr-FR")} FC` : "Tarif à confirmer"}</strong></div><time>{new Date(voyage.date_depart).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</time><Link href={`/voyages/${voyage.id}`} aria-label={`Voir le voyage ${voyage.code_voyage}`}><ArrowRight size={18} /></Link></article>)}</div><div className="travel-pagination"><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Page précédente"><ArrowLeft size={16} /></button><span>Page {currentPage} sur {totalPages}</span><button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} aria-label="Page suivante"><ArrowRight size={16} /></button></div></section></main>;
}