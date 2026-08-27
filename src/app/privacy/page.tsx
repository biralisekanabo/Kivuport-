import { Metadata } from "next";
import { Lock } from "lucide-react";
import { PublicLayout } from "@/app/components/public-layout";
import { LegalSection } from "@/app/components/legal-section";

export const metadata: Metadata = {
  title: "Politique de confidentialité | KivuPort",
  description: "Comment KivuPort collecte, utilise et protège vos données personnelles.",
};

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm text-blue-100 mb-6">
            <Lock size={16} />
            Confidentialité
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Politique de confidentialité</h1>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <LegalSection title="Collecte des données">
          <p>
            Nous collectons les informations que vous nous fournissez lors de la création de votre compte
            et de vos réservations : nom, prénom, email, téléphone, adresse et informations de paiement.
            Ces données nous permettent de gérer vos traversées et de vous offrir un service personnalisé.
          </p>
        </LegalSection>
        <LegalSection title="Utilisation des données">
          <p>
            Vos données sont utilisées pour traiter vos réservations, émettre vos billets, assurer le
            suivi de vos paiements et vous informer des actualités de KivuPort. Elles ne sont jamais
            vendues à des tiers.
          </p>
        </LegalSection>
        <LegalSection title="Sécurité">
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger
            vos données contre l&apos;accès non autorisé, la perte ou l&apos;altération.
          </p>
        </LegalSection>
        <LegalSection title="Vos droits">
          <p>
            Vous pouvez à tout moment demander l&apos;accès, la rectification ou la suppression de vos données
            personnelles en nous contactant à kivuport@gmail.com.
          </p>
        </LegalSection>
      </div>
    </PublicLayout>
  );
}
