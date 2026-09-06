import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Toaster } from "sonner";
import { Chatbot } from "@/app/components/chatbot";
import { SystemTheme } from "@/app/components/system-theme";
import { PaymentRefreshListener } from "@/app/components/payment-refresh-listener";

export const metadata: Metadata = {
  title: "KivuPort | Gestion maritime",
  description: "Réservez et pilotez vos traversées maritimes.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <SystemTheme />
        <PaymentRefreshListener />
        {children}
        <Chatbot />
        <Toaster position="top-right" closeButton richColors duration={4500} />
      </body>
    </html>
  );
}
