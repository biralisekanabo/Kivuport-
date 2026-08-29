"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Anchor, Home, RefreshCw, Ship } from "lucide-react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-lg w-full">
        <div className="inline-flex p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl text-white shadow-lg shadow-amber-500/30 mb-8">
          <Anchor size={28} />
        </div>

        <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
          <span className="w-8 h-px bg-amber-300" />
          Oups
          <span className="w-8 h-px bg-amber-300" />
        </p>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
          Une vague nous a secoués
        </h1>

        <p className="mt-4 text-gray-600 leading-relaxed">
          Un incident technique est survenu sur cette page. Notre équipe a été
          informée. En attendant, vous pouvez réessayer ou retourner à
          l&apos;accueil.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
          >
            <RefreshCw size={16} />
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-200 transition-all shadow-sm hover:shadow-md"
          >
            <Home size={16} />
            Retour à l&apos;accueil
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-gray-400">
            Référence de l&apos;incident : {error.digest}
          </p>
        )}

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Ship size={14} className="text-blue-400" />
          <span>KivuPort · Port de Goma, RDC</span>
        </div>
      </div>
    </main>
  );
}