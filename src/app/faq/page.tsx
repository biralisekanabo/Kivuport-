import { Metadata } from "next";
import { HelpCircle } from "lucide-react";
import { PublicLayout } from "@/app/components/public-layout";
import { FaqAccordion } from "@/app/components/faq-accordion";

export const metadata: Metadata = {
  title: "FAQ | KivuPort",
  description: "Les réponses aux questions les plus fréquentes sur les réservations et traversées KivuPort.",
};

const faqs = [
  {
    question: "Comment réserver un billet de traversée ?",
    answer:
      "Créez un compte, sélectionnez votre date et votre destination, choisissez votre pavillon puis validez le paiement. Vous recevrez immédiatement votre billet numérique.",
  },
  {
    question: "Quels sont les modes de paiement acceptés ?",
    answer:
      "Nous acceptons les paiements en ligne sécurisés ainsi que le paiement sur place au port. La monnaie utilisée est le Franc Congolais (FC), avec option USD selon la disponibilité.",
  },
  {
    question: "Puis-je annuler ou modifier ma réservation ?",
    answer:
      "Oui. Les réservations en attente peuvent être annulées directement depuis votre espace. Selon les conditions, des frais peuvent s'appliquer pour les réservations confirmées.",
  },
  {
    question: "Comment obtenir mon billet ?",
    answer:
      "Votre billet numérique est disponible dans votre compte et vous est envoyé par email. Présentez-le à l'embarquement, sur téléphone ou imprimé.",
  },
  {
    question: "Quels horaires de départ proposez-vous ?",
    answer:
      "Les départs sont réguliers de 6h à 18h. Consultez la page des départs pour les horaires exacts et les destinations disponibles.",
  },
  {
    question: "Puis-je transporter des marchandises ?",
    answer:
      "Oui, nous proposons le transport de fret et de marchandises. Contactez-nous ou sélectionnez l'option marchandises lors de votre réservation pour connaitre les tarifs.",
  },
  {
    question: "Que faire en cas de problème pendant ma traversée ?",
    answer:
      "Notre équipe est disponible pour vous accompagner. En cas d'urgence, contactez le personnel du port ou notre support 24/7.",
  },
];

export default function FaqPage() {
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
            <HelpCircle size={16} />
            Questions fréquentes
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Nous répondons à vos questions</h1>
          <p className="mt-5 max-w-3xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed">
            Retrouvez ici les réponses aux questions les plus posées sur nos services.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <FaqAccordion items={faqs} />
      </section>
    </PublicLayout>
  );
}
