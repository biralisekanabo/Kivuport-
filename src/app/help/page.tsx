"use client";

import Link from "next/link";
import {
  ArrowLeft,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  Ship,
} from "lucide-react";

const faq = [
  { q: "Comment réserver une traversée ?", a: "Connectez-vous, choisissez votre destination puis suivez les étapes de paiement." },
  { q: "Comment payer ma réservation ?", a: "Le paiement s'effectue en ligne de manière sécurisée depuis votre espace." },
  { q: "Puis-je annuler une réservation ?", a: "Oui, depuis l'espace réservations avant le départ prévu." },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-[#182238]">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white"><Ship size={18} /></span>
            KivuPort
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#537bd1] hover:underline">
            <ArrowLeft size={16} /> Retour au tableau de bord
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><HelpCircle size={20} /></div>
          <div>
            <h1 className="text-2xl font-bold">Aide &amp; support</h1>
            <p className="text-sm text-gray-500">Comment pouvons-nous vous aider ?</p>
          </div>
        </div>

        <div className="mb-8 space-y-4">
          {faq.map((item, index) => (
            <div key={index} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="font-semibold">{item.q}</p>
              <p className="mt-1 text-sm text-gray-500">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white shadow-lg">
          <h2 className="mb-4 text-lg font-semibold">Contactez-nous</h2>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2"><Phone size={15} /> +243 995 910 469</p>
            <p className="flex items-center gap-2"><Mail size={15} /> kivuport@gmail.com</p>
            <p className="flex items-center gap-2"><MapPin size={15} /> Goma, RDC</p>
          </div>
        </div>
      </div>
    </main>
  );
}
