type StatusType = "online" | "warning" | "error";

function getNasStatus() {
  const storageUsedPercent = 80;
  const networkResponseMs = 22;

  let type: StatusType = "online";
  let statusText = "Online";

  if (storageUsedPercent >= 90 || networkResponseMs >= 1000) {
    type = "error";
    statusText = "Error";
  } else if (storageUsedPercent >= 75 || networkResponseMs >= 300) {
    type = "warning";
    statusText = "Warning";
  }

  return {
    type,
    statusText,
    storageUsedPercent,
    networkResponseMs,
  };
}

export default function NasPage() {
  const nas = getNasStatus();

  const badgeStyle =
    nas.type === "online"
      ? {
          backgroundColor: "rgba(52, 211, 153, 0.12)",
          color: "#86efac",
          borderColor: "rgba(52, 211, 153, 0.35)",
        }
      : nas.type === "warning"
      ? {
          backgroundColor: "rgba(250, 204, 21, 0.12)",
          color: "#fde047",
          borderColor: "rgba(250, 204, 21, 0.35)",
        }
      : {
          backgroundColor: "rgba(248, 113, 113, 0.12)",
          color: "#fca5a5",
          borderColor: "rgba(248, 113, 113, 0.35)",
        };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-300/80">
          Suenify Admin Server
        </p>

        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold md:text-4xl">
              NAS Detail Page
            </h1>

            <p className="mt-3 text-sm text-slate-400 md:text-base">
              This page shows detailed NAS storage and network monitoring values.
            </p>
          </div>

          <span
            className="rounded-full border px-4 py-2 text-sm font-semibold"
            style={badgeStyle}
          >
            {nas.statusText.toUpperCase()}
          </span>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Storage Status</h2>
            <p className="mt-2 text-sm text-slate-400">
              Current storage usage is calculated from sample monitoring values.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-slate-400">Storage Used</p>
                <p className="mt-1 text-2xl font-semibold">
                  {nas.storageUsedPercent}%
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-slate-400">Current Status</p>
                <p className="mt-1 text-2xl font-semibold">{nas.statusText}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Network Health</h2>
            <p className="mt-2 text-sm text-slate-400">
              Network status is calculated from sample response conditions.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-slate-400">Response Time</p>
                <p className="mt-1 text-2xl font-semibold">
                  {nas.networkResponseMs}ms
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-slate-400">Rule Summary</p>
                <p className="mt-1 text-sm text-slate-300">
                  Warning when storage is 75% or more, and Error when storage is
                  90% or more.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}