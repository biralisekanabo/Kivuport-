export default function Loading() {
  return (
    <main className="min-h-screen grid place-items-center bg-[#f7faf5] px-6">
      <div className="flex items-center gap-3 text-sm font-medium text-[#527367]" role="status" aria-live="polite">
        <span className="h-3 w-3 animate-pulse rounded-full bg-[#789a3a]" />
        Chargement de KivuPort...
      </div>
    </main>
  );
}
