export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-3">{title}</h2>
      <div className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
