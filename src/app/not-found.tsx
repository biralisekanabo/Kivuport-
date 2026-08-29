import Link from "next/link";
import { Anchor, ArrowLeft, Home, Compass, Ship } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-lg w-full">
        <div className="inline-flex p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/30 mb-8">
          <Anchor size={28} />
        </div>

        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
          <span className="w-8 h-px bg-blue-300" />
          Erreur 404
          <span className="w-8 h-px bg-blue-300" />
        </p>

        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Aucune traversée ici
        </h1>

        <p className="mt-4 text-gray-600 leading-relaxed">
          La page que vous recherchez a peut-être changé de quai ou a pris le
          large. Vérifiez l&apos;adresse ou revenez au port principal.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
          >
            <Home size={16} />
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/voyages"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-200 transition-all shadow-sm hover:shadow-md"
          >
            <Compass size={16} />
            Consulter les traversées
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-4 py-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft size={14} />
            Signaler un problème
          </Link>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Ship size={14} className="text-blue-400" />
          <span>KivuPort · Port de Goma, RDC</span>
        </div>
      </div>
    </main>
  );
}