"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Ship,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function ProfilePage() {
  const [name, setName] = useState("Utilisateur");
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (u) {
        setName(u.user_metadata?.name || u.email?.split("@")[0] || "Utilisateur");
        setEmail(u.email || "");
      }
    });
  }, []);

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
        <div className="mb-8 flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-2xl font-bold text-white">
            {name[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{name}</h1>
            <p className="flex items-center gap-1.5 text-sm text-gray-500"><Mail size={14} /> {email || "Non connecté"}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Mon profil</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
              <UserRound size={18} className="text-blue-500" />
              <div>
                <p className="text-xs text-gray-400">Nom complet</p>
                <p className="text-sm font-medium">{name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
              <Mail size={18} className="text-blue-500" />
              <div>
                <p className="text-xs text-gray-400">Adresse email</p>
                <p className="text-sm font-medium">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
              <MapPin size={18} className="text-blue-500" />
              <div>
                <p className="text-xs text-gray-400">Localisation</p>
                <p className="text-sm font-medium">Port de Goma, RDC</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
