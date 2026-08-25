"use client";

import { useEffect, useState } from "react";
import { Ship } from "lucide-react";
import { useParams } from "next/navigation";

export default function PublicReservationPage() {
  const { token } = useParams<{ token: string }>();
  const [reservation, setReservation] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { fetch(`/api/reservations/token?token=${encodeURIComponent(token)}`).then(async (response) => { const result = await response.json(); if (!response.ok) setError(result.error || "Réservation introuvable."); else setReservation(result.reservation); }); }, [token]);
  if (error) return <main className="dashboard-loading"><p>{error}</p></main>;
  if (!reservation) return <main className="dashboard-loading"><Ship className="animate-pulse" size={28} /><p>Chargement de la réservation...</p></main>;
  const voyage = reservation.voyage as { code_voyage?: string } | null;
  const client = reservation.client as { prenom?: string; nom?: string } | null;
  return <main className="dashboard-loading"><Ship size={28} /><h1>Réservation #{String(reservation.id)}</h1><p>Client : {[client?.prenom, client?.nom].filter(Boolean).join(" ") || "-"}</p><p>Voyage : {voyage?.code_voyage || "-"}</p><p>Départ : {new Date(String(reservation.date_embarquement)).toLocaleString("fr-FR")}</p><p>Montant : {Number(reservation.prix_total || 0).toLocaleString("fr-FR")} CDF</p><p>Statut : {String(reservation.statut)}</p></main>;
}