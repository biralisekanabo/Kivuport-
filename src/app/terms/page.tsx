import { Metadata } from "next";
import { FileCheck } from "lucide-react";
import { PublicLayout } from "@/app/components/public-layout";
import { LegalSection } from "@/app/components/legal-section";

export const metadata: Metadata = {
  title: "Conditions d'utilisation | KivuPort",
  description: "Les conditions générales d'utilisation des services KivuPort.",
};

export default function TermsPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm text-blue-100 mb-6">
            <FileCheck size={16} />
            Conditions générales
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Conditions d&apos;utilisation</h1>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <LegalSection title="Objet">
          <p>
            Les présentes conditions régissent l&apos;utilisation de la plateforme KivuPort et des services de
            réservation de traversées maritimes sur le lac Kivu. En utilisant le site, vous acceptez ces
            conditions.
          </p>
        </LegalSection>
        <LegalSection title="Réservations et paiements">
          <p>
            Toute réservation est confirmée après validation du paiement. Les tarifs affichés sont en Franc
            Congolais (FC) et peuvent évoluer. Un billet ne peut être utilisé que pour la traversée et la
            date indiquées.
          </p>
        </LegalSection>
        <LegalSection title="Annulations et remboursements">
          <p>
            Les réservations en attente peuvent être annulées. Selon le statut de la réservation et les
            conditions en vigueur, des frais ou des remboursements partiels peuvent s&apos;appliquer.
          </p>
        </LegalSection>
        <LegalSection title="Obligations de l'utilisateur">
          <p>
            L&apos;utilisateur s&apos;engage à fournir des informations exactes et complètes, à se présenter à
            l&apos;heure à l&apos;embarquement et à respecter la réglementation applicable à la navigation.
          </p>
        </LegalSection>
        <LegalSection title="Limitation de responsabilité">
          <p>
            KivuPort ne saurait être tenu responsable des retards ou annulations dus à des circonstances
            indépendantes de sa volonté (intempéries, force majeure, décisions des autorités).
          </p>
        </LegalSection>
      </div>
    </PublicLayout>
  );
}
