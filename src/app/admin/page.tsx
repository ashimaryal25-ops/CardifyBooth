import Link from "next/link";
import { deleteCardGenerationAction, updatePrintStatusAction } from "@/app/admin/actions";
import { DeleteCardButton } from "@/app/admin/DeleteCardButton";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  type AdminCardRow,
  getAdminDashboardData,
  getPublicCardUrl,
  parseAdminFilters,
  printStatusValues,
} from "@/lib/admin-cards";

interface AdminDashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

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

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function tokenTotal(card: AdminCardRow) {
  return (card.estimated_input_tokens ?? 0) + (card.estimated_output_tokens ?? 0);
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

  if (normalized.includes("legend") || normalized.includes("myth")) {
    return "border-[#f59e0b]/30 bg-[#fffbeb] text-[#92400e]";
  }

  if (normalized.includes("epic")) {
    return "border-[#7c3aed]/25 bg-[#f5f3ff] text-[#6d28d9]";
  }

  if (normalized.includes("rare")) {
    return "border-[#2563eb]/25 bg-[#eff6ff] text-[#1d4ed8]";
  }

  return "border-[#cbd5e1] bg-[#f8fafc] text-[#475569]";
}

function pngBadge(card: AdminCardRow) {
  return card.card_png_path ? (
    <span className="rounded-[999px] border border-[#16a34a]/25 bg-[#f0fdf4] px-2 py-1 text-xs font-bold text-[#166534]">
      Saved
    </span>
  ) : (
    <span className="rounded-[999px] border border-[#dc2626]/25 bg-[#fef2f2] px-2 py-1 text-xs font-bold text-[#991b1b]">
      Missing
    </span>
  );
}

function SelectField({
  label,
  name,
  value,
  children,
}: {
  label: string;
  name: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">
      {label}
      <select
        name={name}
        defaultValue={value}
        className="h-10 min-w-36 rounded-[6px] border border-[#cfd6e2] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#111827]"
      >
        {children}
      </select>
    </label>
  );
}

function PrintStatusForm({
  cardId,
  status,
  label,
  compact = false,
}: {
  cardId: string;
  status: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <form action={updatePrintStatusAction}>
      <input type="hidden" name="cardId" value={cardId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={`rounded-[6px] border border-[#cfd6e2] bg-white font-bold text-[#334155] hover:bg-[#f8fafc] ${
          compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
        }`}
      >
        {label}
      </button>
    </form>
  );
}

function CardActions({ card }: { card: AdminCardRow }) {
  const pngUrl = getPublicCardUrl(card.card_png_path);

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/admin/cards/${card.id}`}
        className="rounded-[6px] border border-[#cfd6e2] bg-white px-2 py-1 text-xs font-bold text-[#334155] hover:bg-[#f8fafc]"
      >
        Details
      </Link>
      <Link
        href={`/cards/${card.id}`}
        className="rounded-[6px] border border-[#cfd6e2] bg-white px-2 py-1 text-xs font-bold text-[#334155] hover:bg-[#f8fafc]"
      >
        Public
      </Link>
      {pngUrl && (
        <a
          href={pngUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-[6px] border border-[#cfd6e2] bg-white px-2 py-1 text-xs font-bold text-[#334155] hover:bg-[#f8fafc]"
        >
          PNG
        </a>
      )}
      {card.print_status !== "requested" && (
        <PrintStatusForm cardId={card.id} status="requested" label="Request" compact />
      )}
      {card.print_status !== "printed" && (
        <PrintStatusForm cardId={card.id} status="printed" label="Printed" compact />
      )}
      {card.print_status !== "not_requested" && (
        <PrintStatusForm cardId={card.id} status="not_requested" label="Reset" compact />
      )}
      <DeleteCardButton cardId={card.id} action={deleteCardGenerationAction} compact />
    </div>
  );
}

function CardsTable({ cards }: { cards: AdminCardRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-[#f8fafc] text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">
          <tr>
            <th className="whitespace-nowrap px-4 py-3">Created</th>
            <th className="whitespace-nowrap px-4 py-3">Name</th>
            <th className="whitespace-nowrap px-4 py-3">Card Title</th>
            <th className="whitespace-nowrap px-4 py-3">Rarity</th>
            <th className="whitespace-nowrap px-4 py-3">Traits</th>
            <th className="whitespace-nowrap px-4 py-3">Source</th>
            <th className="whitespace-nowrap px-4 py-3">Model</th>
            <th className="whitespace-nowrap px-4 py-3">Tokens</th>
            <th className="whitespace-nowrap px-4 py-3">Duration</th>
            <th className="whitespace-nowrap px-4 py-3">PNG</th>
            <th className="whitespace-nowrap px-4 py-3">Print</th>
            <th className="whitespace-nowrap px-4 py-3">Event</th>
            <th className="min-w-72 px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eef2f7]">
          {cards.map((card) => (
            <tr key={card.id} className="align-top hover:bg-[#f9fafb]">
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
              <td className="min-w-44 px-4 py-3 text-xs font-semibold text-[#475569]">
                {card.traits?.length ? card.traits.join(", ") : "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[#475569]">
                {card.generation_source}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-[#475569]">
                {card.model ?? "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-[#4b5563]">
                {formatNumber(tokenTotal(card))}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-[#4b5563]">
                {formatDuration(card.duration_ms)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">{pngBadge(card)}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <span className={`rounded-[999px] border px-2 py-1 text-xs font-bold ${statusClass(card.print_status)}`}>
                  {card.print_status}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-[#475569]">
                {card.events?.name ?? "Individual"}
              </td>
              <td className="px-4 py-3">
                <CardActions card={card} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  await requireAdminSession();
  const filters = parseAdminFilters(await searchParams);
  const dashboard = await getAdminDashboardData(filters);

  const metrics = [
    { label: "Total Cards", value: formatNumber(dashboard.metrics.totalCards) },
    { label: "Generated Today", value: formatNumber(dashboard.metrics.cardsToday) },
    { label: "This Week", value: formatNumber(dashboard.metrics.cardsThisWeek) },
    { label: "PNGs Saved", value: formatNumber(dashboard.metrics.savedPngs) },
    { label: "PNGs Missing", value: formatNumber(dashboard.metrics.missingPngs) },
    { label: "Print Requested", value: formatNumber(dashboard.metrics.printRequested) },
    { label: "Printed", value: formatNumber(dashboard.metrics.printed) },
    { label: "Needs Attention", value: formatNumber(dashboard.metrics.needsAttention) },
    { label: "Token Estimate", value: formatNumber(dashboard.metrics.estimatedTotalTokens) },
    { label: "Avg Duration", value: formatDuration(dashboard.metrics.averageDurationMs) },
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
            <p className="mt-1 text-xs font-semibold text-[#64748b]">
              Production · Refreshed {formatDateTime(dashboard.lastRefreshed)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-[999px] border border-[#16a34a]/25 bg-[#f0fdf4] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#166534]">
              Live
            </span>
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
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[8px] border border-[#d9dee7] bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                {metric.label}
              </p>
              <p className="mt-2 text-2xl font-black tracking-normal text-[#111827]">
                {metric.value}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-[8px] border border-[#d9dee7] bg-white p-4 shadow-sm">
          <form className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_repeat(6,max-content)_max-content] lg:items-end">
            <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">
              Search
              <input
                name="q"
                defaultValue={filters.search}
                placeholder="Name or card title"
                className="h-10 rounded-[6px] border border-[#cfd6e2] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#111827]"
              />
            </label>

            <SelectField label="Rarity" name="rarity" value={filters.rarity}>
              <option value="">All rarity</option>
              {dashboard.rarityOptions.map((rarity) => (
                <option key={rarity} value={rarity}>
                  {rarity}
                </option>
              ))}
            </SelectField>

            <SelectField label="Print" name="print_status" value={filters.printStatus}>
              <option value="">All print</option>
              {printStatusValues.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectField>

            <SelectField label="PNG" name="png" value={filters.png}>
              <option value="all">All PNG</option>
              <option value="saved">Saved</option>
              <option value="missing">Missing</option>
            </SelectField>

            <SelectField label="Source" name="source" value={filters.source}>
              <option value="">All source</option>
              {dashboard.sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </SelectField>

            <SelectField label="Range" name="range" value={filters.dateRange}>
              <option value="today">Today</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="all">All</option>
            </SelectField>

            <SelectField label="Sort" name="sort" value={filters.sort}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="duration">Duration</option>
              <option value="tokens">Tokens</option>
            </SelectField>

            <div className="flex gap-2">
              <button
                type="submit"
                className="h-10 rounded-[6px] bg-[#111827] px-4 text-sm font-black text-white hover:bg-[#1f2937]"
              >
                Apply
              </button>
              <Link
                href="/admin"
                className="grid h-10 place-items-center rounded-[6px] border border-[#cfd6e2] bg-white px-4 text-sm font-bold text-[#334155] hover:bg-[#f8fafc]"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-[8px] border border-[#d9dee7] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-4 py-3">
            <div>
              <h2 className="text-base font-black text-[#111827]">Recent Card Generations</h2>
              <p className="mt-1 text-sm font-medium text-[#6b7280]">
                Filtered latest 50 rows from Supabase card_generations.
              </p>
            </div>
            <span className="rounded-[999px] border border-[#cfd6e2] bg-[#f8fafc] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#475569]">
              {dashboard.recentCards.length} rows
            </span>
          </div>

          {dashboard.recentCards.length ? (
            <CardsTable cards={dashboard.recentCards} />
          ) : (
            <div className="px-4 py-10 text-center text-sm font-semibold text-[#6b7280]">
              No cards match these filters.
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-[8px] border border-[#d9dee7] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-4 py-3">
            <div>
              <h2 className="text-base font-black text-[#111827]">Print Queue</h2>
              <p className="mt-1 text-sm font-medium text-[#6b7280]">
                Cards marked requested and waiting for physical output.
              </p>
            </div>
            <span className="rounded-[999px] border border-[#f59e0b]/30 bg-[#fffbeb] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#92400e]">
              {dashboard.printQueue.length} waiting
            </span>
          </div>

          {dashboard.printQueue.length ? (
            <CardsTable cards={dashboard.printQueue} />
          ) : (
            <div className="px-4 py-10 text-center text-sm font-semibold text-[#6b7280]">
              No print jobs are waiting.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
