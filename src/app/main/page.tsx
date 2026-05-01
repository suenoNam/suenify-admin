export default function MainPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300/80">
          Suenify Admin Server
        </p>

        <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
          Main Domain Detail Page
        </h1>

        <p className="mt-3 text-sm text-slate-400 md:text-base">
          This page is reserved for main domain status, traffic overview, and external access checks.
        </p>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Domain Status</h2>
            <p className="mt-2 text-sm text-slate-400">
              Main domain reachability, SSL state, and public access status will be displayed here.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Traffic Overview</h2>
            <p className="mt-2 text-sm text-slate-400">
              Visitor counts, request trends, and service usage metrics will be displayed here.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}