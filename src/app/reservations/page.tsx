"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CircleDollarSign, LoaderCircle, LogOut, Ship, Ticket, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

type Voyage = { id: number; code_voyage: string; date_depart: string; statut: string; bateau?: { id: number; nom: string; capacite_passager: number; capacite_cargaison: number } | null };
type Pavillon = { id: number; nom: string; capacite_max: number; prix_unitaire: number; prix_tonne?: number | null; devise: string; idbateau: number };
type Reservation = { id: number; date_embarquement: string; statut: string; type_reservation: string; prix_total: number; voyage?: { code_voyage?: string } | null; pavillon?: { nom?: string } | null };

export default function ReservationsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [pavillons, setPavillons] = useState<Pavillon[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [paidReservationIds, setPaidReservationIds] = useState<number[]>([]);
  const [selectedVoyage, setSelectedVoyage] = useState("");
  const [selectedPavillon, setSelectedPavillon] = useState("");
  const [reservationType, setReservationType] = useState("passage");
  const [cargoWeight, setCargoWeight] = useState("");
  const [message, setMessage] = useState("");
  const [dataError, setDataError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentVoyage = voyages.find((voyage) => voyage.id === Number(selectedVoyage));
  const availablePavillons = useMemo(() => pavillons.filter((pavillon) => pavillon.idbateau === currentVoyage?.bateau?.id), [currentVoyage, pavillons]);
  const currentPavillon = availablePavillons.find((pavillon) => pavillon.id === Number(selectedPavillon));
  const estimatedPrice = (Number(currentPavillon?.prix_unitaire || 0) + (reservationType !== "passage" ? Number(cargoWeight || 0) * Number(currentPavillon?.prix_tonne || 0) : 0));

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return router.replace("/");
      setEmail(userData.user.email || "");
      setName(userData.user.user_metadata?.name || "");
      const voyagesResult = await supabase.from("voyages").select("id, code_voyage, date_depart, statut, idbateau").eq("statut", "prevu").order("date_depart");
      const voyageRows = (voyagesResult.data || []) as { id: number; code_voyage: string; date_depart: string; statut: string; idbateau: number }[];
      const boatIds = [...new Set(voyageRows.map((voyage) => voyage.idbateau))];
      const [boatsResult, pavillonsResult] = await Promise.all([
        boatIds.length ? supabase.from("bateaux").select("id, nom, capacite_passager, capacite_cargaison").in("id", boatIds) : Promise.resolve({ data: [], error: null }),
        supabase.from("pavillons").select("id, nom, capacite_max, prix_unitaire, prix_tonne, devise, idbateau"),
      ]);
      const loadingError = [voyagesResult.error, boatsResult.error, pavillonsResult.error].find(Boolean);
      if (loadingError) setDataError(`Impossible de charger les voyages ou pavillons : ${loadingError.message}`);
      const boatsById = new Map((boatsResult.data || []).map((boat) => [boat.id, boat]));
      setVoyages(voyageRows.map((voyage) => ({ ...voyage, bateau: boatsById.get(voyage.idbateau) || null })) as Voyage[]);
      setPavillons((pavillonsResult.data || []) as Pavillon[]);
      await loadReservations(userData.user.email || "");
      setIsLoading(false);
    }
    load();
  }, [router]);

  async function loadReservations(userEmail: string) {
    const { data: client } = await supabase.from("client").select("id").ilike("email", userEmail).maybeSingle();
    if (!client) return setReservations([]);
    const { data, error } = await supabase.from("reservations").select("id, date_embarquement, statut, type_reservation, prix_total, voyage:voyages(code_voyage), pavillon:pavillons!reservations_idpavillon_fkey(nom)").eq("idclient", client.id).order("date_embarquement", { ascending: false });
    if (error) setDataError(`Impossible de charger vos réservations : ${error.message}`);
    setReservations((data || []) as Reservation[]);
    const reservationIds = (data || []).map((reservation) => reservation.id);
    if (reservationIds.length > 0) {
      const { data: payments } = await supabase.from("paiements").select("idreservation").in("idreservation", reservationIds).eq("statut", "paye");
      setPaidReservationIds((payments || []).map((payment) => payment.idreservation));
    } else {
      setPaidReservationIds([]);
    }
  }

  async function createReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentVoyage || !currentPavillon || !name.trim() || !phone.trim()) return setMessage("Choisissez un voyage, un pavillon et complétez votre téléphone.");
    setIsSubmitting(true);
    setMessage("");
    const parts = name.trim().split(/\s+/);
    const result = await supabase.rpc("create_kivuport_reservation", { p_date_reservation: new Date().toISOString(), p_date_embarquement: currentVoyage.date_depart, p_type_reservation: reservationType, p_poids_cargaison: reservationType === "passage" ? null : Number(cargoWeight || 0), p_idvoyage: currentVoyage.id, p_idpavillon: currentPavillon.id, p_prix_total: estimatedPrice, p_client_nom: parts.slice(1).join(" ") || parts[0], p_client_prenom: parts[0], p_client_telephone: phone.trim() });
    setIsSubmitting(false);
    if (result.error) return setMessage(`Réservation impossible : ${result.error.message}`);
    setMessage("Réservation créée. Elle est maintenant en attente de confirmation.");
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) await fetch("/api/reservations/notification", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionData.session.access_token}` }, body: JSON.stringify({ reservationId: result.data[0].id, kind: "created" }) });
    setSelectedVoyage(""); setSelectedPavillon(""); setCargoWeight("");
    await loadReservations(email);
  }

  async function simulatePayment(reservation: Reservation) {
    setMessage("");
    if (reservation.statut !== "confirme") return setMessage("Le paiement sera disponible après confirmation de votre réservation.");
    if (paidReservationIds.includes(reservation.id)) return setMessage("Cette réservation est déjà payée.");
    const result = await supabase.rpc("create_kivuport_payment_intent", { p_reservation_id: reservation.id, p_provider: "mobile_money" });
    if (result.error) return setMessage(`Paiement impossible : ${result.error.message}`);
    setMessage(`Session de paiement créée pour la réservation #${reservation.id}. Le paiement sera confirmé après validation du prestataire.`);
  }

  async function cancelReservation(reservation: Reservation) {
    const result = await supabase.rpc("transition_kivuport_reservation", { p_reservation_id: reservation.id, p_to_status: "annule", p_reason: "client_request" });
    if (result.error) return setMessage(`Annulation impossible : ${result.error.message}`);
    setMessage(`La réservation #${reservation.id} a été annulée.`);
    await loadReservations(email);
  }

  async function logout() { await supabase.auth.signOut(); router.replace("/"); }
  if (isLoading) return <main className="dashboard-loading"><Ship className="animate-pulse" size={28} /><p>Chargement des voyages...</p></main>;

  return <main className="booking-page"><header className="dashboard-header"><Link href="/dashboard" className="brand"><span className="brand-symbol"><Ship size={20} /></span><span>KivuPort</span></Link><div className="dashboard-header-actions"><button className="dashboard-logout" type="button" onClick={logout}><LogOut size={16} /> Déconnexion</button></div></header><section className="booking-content"><Link className="booking-back" href="/dashboard"><ArrowLeft size={15} /> Mon espace</Link><p className="kicker"><span className="kicker-line" /> Réservations</p><h1>Préparer votre traversée.</h1><p className="dashboard-intro">Choisissez un voyage disponible et suivez vos demandes depuis un seul endroit.</p>{dataError && <p className="booking-message error" role="alert">{dataError}<br /><small>Vérifiez les politiques de lecture dans Supabase.</small></p>}{message && <p className="booking-message" role="status">{message}</p>}<div className="booking-layout"><form className="dashboard-card booking-form" onSubmit={createReservation}><div className="dashboard-card-title"><span><Ticket size={18} /></span><div><p>Nouvelle réservation</p><small>Disponibilités contrôlées automatiquement</small></div></div><label>Voyage<select value={selectedVoyage} onChange={(event) => { setSelectedVoyage(event.target.value); setSelectedPavillon(""); }} required><option value="">Choisir un voyage</option>{voyages.map((voyage) => <option value={voyage.id} key={voyage.id}>{voyage.code_voyage} · {new Date(voyage.date_depart).toLocaleString("fr-FR")} · {voyage.bateau?.nom}</option>)}</select></label><label>Pavillon<select value={selectedPavillon} onChange={(event) => setSelectedPavillon(event.target.value)} required><option value="">Choisir un pavillon</option>{availablePavillons.map((pavillon) => <option value={pavillon.id} key={pavillon.id}>{pavillon.nom} · {pavillon.prix_unitaire} {pavillon.devise}</option>)}</select></label><label>Type de réservation<select value={reservationType} onChange={(event) => setReservationType(event.target.value)}><option value="passage">Passage</option><option value="mixte">Passage + cargaison</option><option value="cargaison">Cargaison</option></select></label>{reservationType !== "passage" && <label>Poids de cargaison (tonnes)<input type="number" min="1" value={cargoWeight} onChange={(event) => setCargoWeight(event.target.value)} required /></label>}<label>Nom complet<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>Téléphone<input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+243..." required /></label>{currentPavillon && <p className="booking-price">Total estimé <strong>{estimatedPrice.toLocaleString("fr-FR")} {currentPavillon.devise}</strong></p>}<button className="dashboard-button" type="submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle size={16} className="animate-spin" /> : <><Ticket size={16} /> Envoyer la réservation</>}</button></form><section className="dashboard-card booking-list"><div className="dashboard-card-title"><span><AnchorIcon /></span><div><p>Mes réservations</p><small>Statut et paiement</small></div></div>{reservations.length === 0 ? <p className="booking-empty">Aucune réservation pour le moment.</p> : reservations.map((reservation) => <article className="booking-item" key={reservation.id}><div><strong>#{reservation.id} · {reservation.voyage?.code_voyage || "Voyage"}</strong><small>{new Date(reservation.date_embarquement).toLocaleString("fr-FR")} · {reservation.pavillon?.nom || "Pavillon"}</small></div><span className={`status status-${reservation.statut}`}>{paidReservationIds.includes(reservation.id) ? "payé" : reservation.statut}</span>{reservation.statut === "en_attente" && <button className="payment-button" type="button" onClick={() => cancelReservation(reservation)}><X size={14} /> Annuler</button>}{reservation.statut === "confirme" && !paidReservationIds.includes(reservation.id) && <button className="payment-button" type="button" onClick={() => simulatePayment(reservation)}><CircleDollarSign size={14} /> Payer</button>}</article>)}</section></div></section></main>;
}

function AnchorIcon() { return <Ship size={18} />; }