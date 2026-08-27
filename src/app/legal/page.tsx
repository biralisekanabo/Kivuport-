import { Metadata } from "next";
import { Scale } from "lucide-react";
import { PublicLayout } from "@/app/components/public-layout";
import { LegalSection } from "@/app/components/legal-section";

export const metadata: Metadata = {
  title: "Mentions légales | KivuPort",
  description: "Mentions légales du site KivuPort, port de Goma.",
};

export default function LegalPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm text-blue-100 mb-6">
            <Scale size={16} />
            Informations légales
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Mentions légales</h1>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <LegalSection title="Éditeur du site">
          <p>
            Le site KivuPort est édité et exploité par la société KivuPort, dont le siège est situé au
            port de Goma, République Démocratique du Congo. Contact : kivuport@gmail.com ·
            +243 995 910 469.
          </p>
        </LegalSection>
        <LegalSection title="Hébergement">
          <p>
            Le site est hébergé par des prestataires tiers sécurisés. Les informations d&apos;hébergement
            sont disponibles sur demande auprès de notre équipe.
          </p>
        </LegalSection>
        <LegalSection title="Propriété intellectuelle">
          <p>
            L&apos;ensemble des contenus présents sur le site (textes, logos, graphismes, données) est protégé
            par les lois relatives à la propriété intellectuelle. Toute reproduction ou représentation
            totale ou partielle, sans autorisation préalable, est interdite.
          </p>
        </LegalSection>
        <LegalSection title="Responsabilité">
          <p>
            KivuPort s&apos;efforce d&apos;assurer l&apos;exactitude des informations publiées, mais ne saurait être
            tenu responsable des erreurs, omissions ou indisponibilités temporaires du site.
          </p>
        </LegalSection>
      </div>
    </PublicLayout>
  );
}
