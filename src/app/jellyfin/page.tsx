type StatusType = "online" | "warning" | "error";

function getJellyfinStatus() {
  const syncDelayMinutes = 1;
  const serviceHealthy = false

  let type: StatusType = "online";
  let statusText = "Online";

  if (!serviceHealthy) {
    type = "error";
    statusText = "Error";
  } else if (syncDelayMinutes >= 5) {
    type = "warning";
    statusText = "Warning";
  }

  return {
    type,
    statusText,
    syncDelayMinutes,
    serviceHealthy,
  };
}

export default function JellyfinPage() {
  const jellyfin = getJellyfinStatus();

  const badgeStyle =
    jellyfin.type === "online"
      ? {
          backgroundColor: "rgba(52, 211, 153, 0.12)",
          color: "#86efac",
          borderColor: "rgba(52, 211, 153, 0.35)",
        }
      : jellyfin.type === "warning"
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
              Jellyfin Detail Page
            </h1>

            <p className="mt-3 text-sm text-slate-400 md:text-base">
              This page shows detailed Jellyfin health and media sync monitoring values.
            </p>
          </div>

          <span
            className="rounded-full border px-4 py-2 text-sm font-semibold"
            style={badgeStyle}
          >
            {jellyfin.statusText.toUpperCase()}
          </span>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Service Health</h2>
            <p className="mt-2 text-sm text-slate-400">
              Jellyfin service health is calculated from sample service conditions.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-slate-400">Current Status</p>
                <p className="mt-1 text-2xl font-semibold">
                  {jellyfin.statusText}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-slate-400">Service Healthy</p>
                <p className="mt-1 text-2xl font-semibold">
                  {jellyfin.serviceHealthy ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Library Sync</h2>
            <p className="mt-2 text-sm text-slate-400">
              Media sync delay is calculated from sample sync conditions.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-slate-400">Sync Delay</p>
                <p className="mt-1 text-2xl font-semibold">
                  {jellyfin.syncDelayMinutes} min
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-slate-400">Rule Summary</p>
                <p className="mt-1 text-sm text-slate-300">
                  Warning when sync delay is 5 minutes or more, and Error when service health fails.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}