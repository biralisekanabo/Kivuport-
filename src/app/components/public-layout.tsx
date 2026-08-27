"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/navbar";
import { Footer } from "@/app/components/footer";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        onLogin={() => router.push("/login")}
        onSignup={() => router.push("/signup")}
      />
      <main className="flex-1 pt-[72px]">{children}</main>
      <Footer />
    </div>
  );
}
