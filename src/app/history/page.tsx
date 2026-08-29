"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Ship,
  Ticket,
} from "lucide-react";

type HistoryItem = {
  id: string;
  title: string;
  date: string;
  status: string;
  statusColor: string;
};

const historyItems: HistoryItem[] = [
  {
    id: "RES-001",
    title: "Goma → Bukavu",
    date: "25 août 2026 · 08:00",
    status: "Terminée",
    statusColor: "bg-gray-100 text-gray-600",
  },
  {
    id: "RES-002",
    title: "Goma → Minova",
    date: "12 août 2026 · 09:30",
    status: "Terminée",
    statusColor: "bg-gray-100 text-gray-600",
  },
];

export default function HistoryPage() {
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
          <div className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><Ticket size={20} /></div>
          <div>
            <h1 className="text-2xl font-bold">Historique</h1>
            <p className="text-sm text-gray-500">Vos précédentes réservations</p>
          </div>
        </div>

        <div className="space-y-4">
          {historyItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><CalendarDays size={18} /></div>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="flex items-center gap-1.5 text-sm text-gray-500"><Clock size={13} /> {item.date}</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.statusColor}`}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
