import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "KivuPort | Gestion maritime",
  description: "Réservez et pilotez vos traversées maritimes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-right" closeButton richColors duration={4500} />
      </body>
    </html>
  );
}
