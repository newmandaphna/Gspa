/** Sits inside the admin layout's light band, so only the content column needs a stand-in. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="min-h-[60vh]">
      <p className="sr-only">Loading the desk</p>
      <div aria-hidden="true">
        <div className="h-3 w-24 animate-pulse rounded-full bg-ink/8" />
        <div className="mt-5 h-9 w-[min(420px,70%)] animate-pulse rounded-full bg-ink/8" />
        <div className="mt-8 h-24 animate-pulse rounded-card bg-white/70" />
        <div className="mt-3 h-24 animate-pulse rounded-card bg-white/70" />
      </div>
    </div>
  );
}
