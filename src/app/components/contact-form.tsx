"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle } from "lucide-react";

export function ContactForm() {
  const [form, setForm] = useState({ nom: "", email: "", sujet: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const set = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.nom.trim()) newErrors.nom = "Veuillez indiquer votre nom";
    if (!form.email.trim()) newErrors.email = "Veuillez indiquer votre email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Email invalide";
    if (!form.message.trim()) newErrors.message = "Veuillez écrire votre message";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setStatus("sending");
    const body = `Nom : ${form.nom}\nEmail : ${form.email}\nSujet : ${form.sujet}\n\n${form.message}`;
    window.location.href = `mailto:kivuport@gmail.com?subject=${encodeURIComponent(form.sujet || "Contact KivuPort")}&body=${encodeURIComponent(body)}`;
    setTimeout(() => setStatus("sent"), 300);
  };

  const inputClass = (key: string) =>
    `w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm ${
      errors[key] ? "border-red-400" : "border-gray-200"
    }`;

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="p-6 sm:p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-xl font-bold text-gray-900">Envoyez-nous un message</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
          <input value={form.nom} onChange={(e) => set("nom", e.target.value)} placeholder="Votre nom" className={inputClass("nom")} />
          {errors.nom && <p className="mt-1 text-xs text-red-500">{errors.nom}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="vous@exemple.com" className={inputClass("email")} />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Sujet</label>
        <input value={form.sujet} onChange={(e) => set("sujet", e.target.value)} placeholder="Objet de votre demande" className={inputClass("sujet")} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
        <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={5} placeholder="Votre message..." className={inputClass("message")} />
        {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-60"
      >
        {status === "sending" ? (
          <Loader2 size={18} className="animate-spin" />
        ) : status === "sent" ? (
          <CheckCircle size={18} />
        ) : (
          <Send size={18} />
        )}
        {status === "sending" ? "Envoi..." : status === "sent" ? "Message prêt" : "Envoyer le message"}
      </button>
      {status === "sent" && (
        <p className="text-sm text-emerald-600 text-center">
          Votre messagerie s&apos;est ouverte pour finaliser l&apos;envoi. Merci !
        </p>
      )}
    </motion.form>
  );
}
