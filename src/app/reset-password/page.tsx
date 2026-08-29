"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { ArrowRight, KeyRound, LoaderCircle, LockKeyhole, Ship } from "lucide-react";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    toast.success("Mot de passe mis à jour.");
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 px-4 py-10 text-[#182238]">
      <div className="mx-auto w-full max-w-md">
        <div className="overflow-hidden rounded-[2rem] bg-white p-10 shadow-[0_24px_70px_rgba(42,61,102,0.16)]">
          <Link href="/" className="mx-auto mb-8 flex w-fit items-center gap-2 font-bold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white"><Ship size={18} /></span>
            KivuPort
          </Link>

          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-blue-50 text-blue-600">
            <KeyRound size={28} />
          </div>

          <h1 className="text-center text-2xl font-bold tracking-tight">Nouveau mot de passe</h1>
          <p className="mt-2 text-center text-sm text-[#8992a1]">Choisissez un nouveau mot de passe pour votre compte.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#182238]">Nouveau mot de passe</span>
              <span className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-blue-400">
                <LockKeyhole size={17} className="text-blue-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 caractères minimum"
                  autoComplete="new-password"
                  required
                  className="w-full bg-transparent text-sm outline-none"
                />
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#182238]">Confirmer le mot de passe</span>
              <span className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-blue-400">
                <LockKeyhole size={17} className="text-blue-500" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirmez votre mot de passe"
                  autoComplete="new-password"
                  required
                  className="w-full bg-transparent text-sm outline-none"
                />
              </span>
            </label>

            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting || !ready}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : <><span>Mettre à jour</span><ArrowRight size={17} /></>}
            </button>
            {!ready && <p className="text-center text-xs text-[#8992a1]">Vérification du lien de réinitialisation...</p>}
          </form>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-[#182238]">Chargement...</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
