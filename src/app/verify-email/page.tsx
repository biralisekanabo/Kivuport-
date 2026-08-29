"use client";

import Link from "next/link";
import { ArrowRight, MailCheck, Ship } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 px-4 py-10 text-[#182238]">
      <div className="mx-auto w-full max-w-md">
        <div className="overflow-hidden rounded-[2rem] bg-white p-10 text-center shadow-[0_24px_70px_rgba(42,61,102,0.16)]">
          <Link href="/" className="mx-auto mb-8 flex w-fit items-center gap-2 font-bold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white"><Ship size={18} /></span>
            KivuPort
          </Link>

          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <MailCheck size={32} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight">Vérifiez votre boîte mail</h1>
          <p className="mt-3 text-sm leading-6 text-[#8992a1]">
            Un email de confirmation vous a été envoyé. Cliquez sur le lien qu&apos;il contient pour activer votre
            compte KivuPort.
          </p>

          <div className="mt-8 rounded-xl bg-blue-50 px-4 py-3 text-xs text-[#537bd1]">
            <p className="font-semibold">Astuce :</p>
            <p className="mt-1">Pensez à vérifier votre dossier « spam » ou « courrier indésirable ».</p>
          </div>

          <Link
            href="/login"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:-translate-y-0.5"
          >
            Se connecter <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </main>
  );
}
