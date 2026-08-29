"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  CalendarDays,
  Ship,
  Ticket,
} from "lucide-react";

const bookings = [
  { id: "RES-001", route: "Goma → Bukavu", client: "Jean Mukendi", date: "28 août 2026 · 08:00", status: "Confirmée", color: "bg-emerald-100 text-emerald-700" },
  { id: "RES-002", route: "Goma → Minova", client: "Aline Kabuo", date: "28 août 2026 · 09:30", status: "En attente", color: "bg-amber-100 text-amber-700" },
  { id: "RES-003", route: "Goma → Kalehe", client: "Patrick Bisimwa", date: "27 août 2026 · 14:00", status: "Confirmée", color: "bg-emerald-100 text-emerald-700" },
];

export default function AdminBookingsPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-[#182238]">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white"><Ship size={18} /></span>
            Admin
          </Link>
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#537bd1] hover:underline">
            <ArrowLeft size={16} /> Tableau de bord
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-purple-50 text-purple-600"><Ticket size={20} /></div>
          <div>
            <h1 className="text-2xl font-bold">Réservations</h1>
            <p className="text-sm text-gray-500">Gestion des réservations</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-5 py-3">Réservation</th>
                  <th className="px-5 py-3">Trajet</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="flex items-center gap-2 px-5 py-4 font-semibold"><CalendarDays size={15} className="text-gray-400" /> {b.id}</td>
                    <td className="px-5 py-4">{b.route}</td>
                    <td className="px-5 py-4">{b.client}</td>
                    <td className="px-5 py-4 text-gray-500">{b.date}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${b.color}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
          <Boxes size={16} /> {bookings.length} réservation(s) affichée(s)
        </div>
      </div>
    </main>
  );
}
