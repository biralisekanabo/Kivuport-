import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Toaster } from "sonner";
import { Chatbot } from "@/app/components/chatbot";

export const metadata: Metadata = {
  title: "KivuPort | Gestion maritime",
  description: "Réservez et pilotez vos traversées maritimes.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Chatbot />
        <Toaster position="top-right" closeButton richColors duration={4500} />
      </body>
    </html>
  );
}
