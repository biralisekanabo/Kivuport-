"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Ship,
  UserRound,
  Users,
} from "lucide-react";

const users = [
  { name: "Jean Mukendi", email: "jean@exemple.com", role: "Client", color: "bg-blue-100 text-blue-700" },
  { name: "Aline Kabuo", email: "aline@exemple.com", role: "Client", color: "bg-blue-100 text-blue-700" },
  { name: "Patrick Bisimwa", email: "patrick@exemple.com", role: "Admin", color: "bg-purple-100 text-purple-700" },
];

export default function AdminUsersPage() {
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
          <div className="grid size-11 place-items-center rounded-xl bg-purple-50 text-purple-600"><Users size={20} /></div>
          <div>
            <h1 className="text-2xl font-bold">Utilisateurs</h1>
            <p className="text-sm text-gray-500">Gestion des comptes utilisateurs</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-5 py-3">Utilisateur</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Rôle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.email} className="hover:bg-gray-50">
                    <td className="flex items-center gap-3 px-5 py-4 font-semibold">
                      <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white"><UserRound size={15} /></span>
                      {u.name}
                    </td>
                    <td className="flex items-center gap-2 px-5 py-4 text-gray-500"><Mail size={14} className="text-gray-400" /> {u.email}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.color}`}>{u.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
          <Users size={16} /> {users.length} utilisateur(s)
        </div>
      </div>
    </main>
  );
}
