import { Metadata } from "next";
import { Ticket, Ship, Package, CreditCard, Radar, Users, Anchor, Clock } from "lucide-react";
import { PublicLayout } from "@/app/components/public-layout";

export const metadata: Metadata = {
  title: "Services | KivuPort",
  description: "Découvrez tous les services de KivuPort : réservations, marchandises, paquebots et bien plus.",
};

const services = [
  {
    icon: Ticket,
    title: "Réservation de billets",
    text: "Réservez vos traversées de passagers en quelques clics, avec confirmation immédiate et billets numériques.",
  },
  {
    icon: Ship,
    title: "Traversées passagers",
    text: "Des liaisons régulières et confortables entre les principaux ports du lac Kivu.",
  },
  {
    icon: Package,
    title: "Transport de marchandises",
    text: "Acheminement de cargaisons et de fret avec suivi et manutention professionnelle.",
  },
  {
    icon: Users,
    title: "Pavillons & tarifs",
    text: "Plusieurs classes de confort aux tarifs transparents, adaptés aux voyageurs comme aux professionnels.",
  },
  {
    icon: CreditCard,
    title: "Paiement sécurisé",
    text: "Réglez en toute sécurité, en ligne ou sur place, avec des modes de paiement flexibles.",
  },
  {
    icon: Radar,
    title: "Suivi en temps réel",
    text: "Visualisez vos traversées, les départs et l'état du port pour planifier sereinement.",
  },
];

export default function ServicesPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm text-blue-100 mb-6">
            <Ship size={16} />
            Nos services
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Une gamme complète de services maritimes
          </h1>
          <p className="mt-5 max-w-3xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed">
            De la réservation de billets au transport de fret, KivuPort couvre tous vos besoins de
            navigation sur le lac Kivu, avec des solutions simples et fiables.
          </p>
        </div>
      </section>

      {/* Grille de services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <div key={s.title} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <s.icon size={22} className="text-white" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rassurance */}
      <section className="bg-white border-y border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-emerald-100 rounded-xl"><Anchor size={20} className="text-emerald-600" /></div>
              <div>
                <h4 className="font-semibold text-gray-900">Horaires étendus</h4>
                <p className="text-sm text-gray-600 mt-1">Des départs réguliers tout au long de la semaine.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-amber-100 rounded-xl"><Clock size={20} className="text-amber-600" /></div>
              <div>
                <h4 className="font-semibold text-gray-900">Ponctualité</h4>
                <p className="text-sm text-gray-600 mt-1">Des traversées qui respectent les horaires annoncés.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-blue-100 rounded-xl"><CreditCard size={20} className="text-blue-600" /></div>
              <div>
                <h4 className="font-semibold text-gray-900">Paiement flexible</h4>
                <p className="text-sm text-gray-600 mt-1">Mode de paiement adapté à vos préférences.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
