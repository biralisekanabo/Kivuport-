import { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, MessageSquare } from "lucide-react";
import { PublicLayout } from "@/app/components/public-layout";
import { ContactForm } from "@/app/components/contact-form";

export const metadata: Metadata = {
  title: "Contact | KivuPort",
  description: "Contactez l'équipe de KivuPort pour toute question sur vos traversées maritimes.",
};

export default function ContactPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm text-blue-100 mb-6">
            <MessageSquare size={16} />
            Contactez-nous
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Nous sommes là pour vous aider</h1>
          <p className="mt-5 max-w-3xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed">
            Une question sur une réservation, un paiement ou une traversée ? Notre équipe vous répond.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Coordonnées */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-2.5 bg-blue-100 rounded-xl"><Phone size={20} className="text-blue-600" /></div>
              <div>
                <h3 className="font-semibold text-gray-900">Téléphone</h3>
                <a href="tel:+243995910469" className="text-sm text-gray-600 hover:text-blue-600">+243 995 910 469</a>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-2.5 bg-emerald-100 rounded-xl"><Mail size={20} className="text-emerald-600" /></div>
              <div>
                <h3 className="font-semibold text-gray-900">Email</h3>
                <a href="mailto:kivuport@gmail.com" className="text-sm text-gray-600 hover:text-blue-600 break-all">kivuport@gmail.com</a>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-2.5 bg-purple-100 rounded-xl"><MapPin size={20} className="text-purple-600" /></div>
              <div>
                <h3 className="font-semibold text-gray-900">Adresse</h3>
                <p className="text-sm text-gray-600">Port de Goma, République Démocratique du Congo</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-2.5 bg-amber-100 rounded-xl"><Clock size={20} className="text-amber-600" /></div>
              <div>
                <h3 className="font-semibold text-gray-900">Horaires</h3>
                <p className="text-sm text-gray-600">Lun - Dim : 6h - 18h</p>
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
