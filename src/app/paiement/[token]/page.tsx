"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { notifyPaymentValidated } from "@/app/components/payment-refresh-listener";

type PaymentDetails = { id: number; reference: string; amount: number; destination: string; clientName: string; clientPhone: string; merchantPhone: string; alreadyPaid: boolean };

export default function PaymentPage() {
  const { token } = useParams<{ token: string }>();
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("Chargement...");
  const [busy, setBusy] = useState(false);
  const initialized = useRef(false);
  const announcedPayment = useRef(false);
  const receiptDownloaded = useRef(false);

  useEffect(() => {
    let active = true;
    const loadDetails = async () => {
      const response = await fetch(`/api/payments/details?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Lien de paiement invalide.");
      if (!active) return;
      setDetails(data);
      setPhone((currentPhone) => currentPhone || data.clientPhone || "");
      setMessage(data.alreadyPaid ? "Cette réservation est déjà payée." : "");
      if (initialized.current && data.alreadyPaid && !announcedPayment.current) {
        announcedPayment.current = true;
        notifyPaymentValidated(data.reference);
      }
      if (data.alreadyPaid && !receiptDownloaded.current) {
        receiptDownloaded.current = true;
        void downloadReceipt(data.reference);
      }
      initialized.current = true;
    };

    loadDetails().catch((error: Error) => setMessage(error.message));
    const interval = window.setInterval(() => {
      loadDetails().catch((error: Error) => console.error("Payment status refresh failed:", error));
    }, 3000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [token]);

  async function downloadReceipt(reference: string) {
    const response = await fetch(`/api/payments/receipt?token=${encodeURIComponent(reference)}`, { cache: "no-store" });
    if (!response.ok) {
      console.error("Receipt download failed:", await response.text());
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kivuport-recu-${details?.id || "paiement"}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("Paiement confirmé. Votre reçu avec code QR a été téléchargé.");
  }

  async function pay(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("Connexion à MaishaPay...");
    try {
      const response = await fetch("/api/payments/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, phone }),
      });
      const data = await response.json();
      if (!response.ok) {
        const detail = typeof data.details?.message === "string" ? ` ${data.details.message}` : "";
        throw new Error(`${data.error || "Le paiement a échoué."}${detail}`);
      }
      setMessage("Transaction MaishaPay déclenchée. Confirmez avec votre PIN sur votre téléphone. Vérification automatique en cours...");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Le paiement a échoué.");
    } finally {
      setBusy(false);
    }
  }

  if (!details) return <main className="utility-page dashboard-loading"><p>{message}</p></main>;
  return (
    <main className="utility-page min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <form onSubmit={pay} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Paiement MaishaPay</h1>
        <p className="mt-2 text-sm text-slate-500">Référence : {details.reference}</p>
        <p className="mt-5 text-3xl font-bold">{details.amount.toLocaleString("fr-FR")} FC</p>
        <p className="text-sm text-slate-500">{details.destination} · {details.clientName}</p>
        {details.merchantPhone && <p className="mt-2 text-sm text-slate-600">Paiement reçu sur le compte marchand : <strong>{details.merchantPhone}</strong></p>}
        {!details.alreadyPaid && (
          <>
            <label className="mt-6 block text-sm font-medium">Numéro Mobile Money</label>
            <input className="mt-2 w-full rounded-lg border p-3" value={phone} onChange={(event) => setPhone(event.target.value)} required />
            <button className="mt-5 w-full rounded-lg bg-blue-600 p-3 font-semibold text-white disabled:opacity-50" disabled={busy}>
              {busy ? "Traitement..." : "Payer maintenant"}
            </button>
          </>
        )}
        {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
      </form>
    </main>
  );
}
