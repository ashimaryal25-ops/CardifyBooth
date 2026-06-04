import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminDashboardData } from "@/lib/admin-cards";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(value: number | null) {
  if (!value) {
    return "-";
  }

  if (value < 1000) {
    return `${value} ms`;
  }

  return `${(value / 1000).toFixed(1)} s`;
}

function statusClass(status: string) {
  if (status === "requested") {
    return "border-[#f59e0b]/30 bg-[#fffbeb] text-[#92400e]";
  }

  if (status === "printed") {
    return "border-[#16a34a]/25 bg-[#f0fdf4] text-[#166534]";
  }

  return "border-[#cbd5e1] bg-[#f8fafc] text-[#475569]";
}

function rarityClass(rarity: string) {
  const normalized = rarity.toLowerCase();

  if (normalized.includes("legend")) {
    return "border-[#f59e0b]/30 bg-[#fffbeb] text-[#92400e]";
  }

  if (normalized.includes("rare")) {
    return "border-[#2563eb]/25 bg-[#eff6ff] text-[#1d4ed8]";
  }

  return "border-[#cbd5e1] bg-[#f8fafc] text-[#475569]";
}

export default async function AdminDashboardPage() {
  await requireAdminSession();
  const dashboard = await getAdminDashboardData();

  const metrics = [
    { label: "Total Cards", value: dashboard.totalCards },
    { label: "Generated Today", value: dashboard.cardsToday },
    { label: "PNGs Saved", value: dashboard.savedPngs },
    { label: "Print Requested", value: dashboard.printRequested },
  ];

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#111827]">
      <header className="border-b border-[#d9dee7] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#6b7280]">
              CardifyBooth
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-normal text-[#111827]">
              Admin Operations
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-[6px] border border-[#cfd6e2] bg-white px-3 py-2 text-sm font-bold text-[#374151] hover:bg-[#f9fafb]"
            >
              Booth
            </Link>
            <form action="/admin/logout" method="post">
              <button
                type="submit"
                className="rounded-[6px] bg-[#111827] px-3 py-2 text-sm font-bold text-white hover:bg-[#1f2937]"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[8px] border border-[#d9dee7] bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b7280]">
                {metric.label}
              </p>
              <p className="mt-2 text-3xl font-black tracking-normal text-[#111827]">
                {metric.value}
              </p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-[8px] border border-[#d9dee7] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-4 py-3">
            <div>
              <h2 className="text-base font-black text-[#111827]">Recent Card Generations</h2>
              <p className="mt-1 text-sm font-medium text-[#6b7280]">
                Latest 50 generated cards from Supabase.
              </p>
            </div>
            <span className="rounded-[999px] border border-[#cfd6e2] bg-[#f8fafc] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#475569]">
              Read only V1
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-[#f8fafc] text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Created</th>
                  <th className="whitespace-nowrap px-4 py-3">Name</th>
                  <th className="whitespace-nowrap px-4 py-3">Card Title</th>
                  <th className="whitespace-nowrap px-4 py-3">Rarity</th>
                  <th className="whitespace-nowrap px-4 py-3">Source</th>
                  <th className="whitespace-nowrap px-4 py-3">PNG</th>
                  <th className="whitespace-nowrap px-4 py-3">Print</th>
                  <th className="whitespace-nowrap px-4 py-3">Duration</th>
                  <th className="whitespace-nowrap px-4 py-3">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f7]">
                {dashboard.recentCards.map((card) => (
                  <tr key={card.id} className="hover:bg-[#f9fafb]">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-[#4b5563]">
                      {formatDateTime(card.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-black text-[#111827]">
                      {card.display_name}
                    </td>
                    <td className="min-w-56 px-4 py-3 font-semibold text-[#374151]">
                      {card.card_title}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`rounded-[999px] border px-2 py-1 text-xs font-bold ${rarityClass(card.rarity)}`}>
                        {card.rarity}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[#475569]">
                      {card.generation_source}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`rounded-[999px] border px-2 py-1 text-xs font-bold ${
                        card.card_png_path
                          ? "border-[#16a34a]/25 bg-[#f0fdf4] text-[#166534]"
                          : "border-[#dc2626]/25 bg-[#fef2f2] text-[#991b1b]"
                      }`}>
                        {card.card_png_path ? "Saved" : "Missing"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`rounded-[999px] border px-2 py-1 text-xs font-bold ${statusClass(card.print_status)}`}>
                        {card.print_status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-[#4b5563]">
                      {formatDuration(card.duration_ms)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href={`/cards/${card.id}`}
                        className="font-black text-[#1d4ed8] underline underline-offset-4"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {dashboard.recentCards.length === 0 && (
            <div className="px-4 py-10 text-center text-sm font-semibold text-[#6b7280]">
              No generated cards yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
