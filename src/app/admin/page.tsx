import {
  AlertTriangle,
  Archive,
  BarChart3,
  CircleCheck,
  Database,
  ExternalLink,
  FileImage,
  Home,
  ListChecks,
  Printer,
  Search,
  Settings,
} from "lucide-react";
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

type AdminView = "overview" | "cards" | "print" | "storage" | "system";

function normalizeView(value: string | string[] | undefined): AdminView {
  const view = Array.isArray(value) ? value[0] : value;

  if (view === "cards" || view === "print" || view === "storage" || view === "system") {
    return view;
  }

  return "overview";
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

function ViewIcon({ view }: { view: AdminView }) {
  const className = "h-5 w-5";

  if (view === "cards") {
    return <Archive className={className} />;
  }

  if (view === "print") {
    return <Printer className={className} />;
  }

  if (view === "storage") {
    return <FileImage className={className} />;
  }

  if (view === "system") {
    return <Settings className={className} />;
  }

  return <Home className={className} />;
}

function SidebarLink({
  view,
  activeView,
  label,
  count,
}: {
  view: AdminView;
  activeView: AdminView;
  label: string;
  count?: number;
}) {
  const active = view === activeView;

  return (
    <Link
      href={view === "overview" ? "/admin" : `/admin?view=${view}`}
      className={`flex h-11 items-center gap-3 rounded-[6px] px-3 text-sm font-bold transition ${
        active
          ? "bg-white text-[#0f172a] shadow-sm"
          : "text-[#dbeafe] hover:bg-white/10 hover:text-white"
      }`}
    >
      <ViewIcon view={view} />
      <span className="flex-1">{label}</span>
      {typeof count === "number" && (
        <span
          className={`rounded-[999px] px-2 py-0.5 text-xs ${
            active ? "bg-[#e2e8f0] text-[#334155]" : "bg-white/15 text-white"
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

function PngBadge({ card }: { card: AdminCardRow }) {
  return card.card_png_path ? (
    <span className="inline-flex rounded-[999px] border border-[#16a34a]/25 bg-[#f0fdf4] px-2 py-1 text-xs font-bold text-[#166534]">
      Saved
    </span>
  ) : (
    <span className="inline-flex rounded-[999px] border border-[#dc2626]/25 bg-[#fef2f2] px-2 py-1 text-xs font-bold text-[#991b1b]">
      Missing
    </span>
  );
}

function PrintStatusForm({
  cardId,
  status,
  label,
}: {
  cardId: string;
  status: string;
  label: string;
}) {
  return (
    <form action={updatePrintStatusAction}>
      <input type="hidden" name="cardId" value={cardId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className="rounded-[6px] border border-[#cfd6e2] bg-white px-2 py-1 text-xs font-bold text-[#334155] hover:bg-[#f8fafc]"
      >
        {label}
      </button>
    </form>
  );
}

function CardActions({ card, context }: { card: AdminCardRow; context: AdminView }) {
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
      {context === "print" && card.print_status !== "printed" && (
        <PrintStatusForm cardId={card.id} status="printed" label="Mark printed" />
      )}
      {context === "cards" && card.print_status !== "requested" && (
        <PrintStatusForm cardId={card.id} status="requested" label="Request print" />
      )}
      {context === "cards" && card.print_status !== "not_requested" && (
        <PrintStatusForm cardId={card.id} status="not_requested" label="Reset" />
      )}
      <DeleteCardButton cardId={card.id} action={deleteCardGenerationAction} compact />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-[999px] border px-2 py-1 text-xs font-bold ${statusClass(status)}`}>
      {status}
    </span>
  );
}

function CardRecordTable({
  cards,
  context,
  empty,
}: {
  cards: AdminCardRow[];
  context: AdminView;
  empty: string;
}) {
  if (!cards.length) {
    return (
      <div className="rounded-[8px] border border-dashed border-[#cbd5e1] bg-white p-10 text-center text-sm font-semibold text-[#64748b]">
        {empty}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[8px] border border-[#d9dee7] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-[#f8fafc] text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">Created</th>
              <th className="whitespace-nowrap px-4 py-3">Card</th>
              <th className="whitespace-nowrap px-4 py-3">Traits</th>
              <th className="whitespace-nowrap px-4 py-3">Output</th>
              <th className="whitespace-nowrap px-4 py-3">Print</th>
              <th className="whitespace-nowrap px-4 py-3">Duration</th>
              <th className="min-w-72 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef2f7]">
            {cards.map((card) => (
              <tr key={card.id} className="align-top hover:bg-[#f9fafb]">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-[#4b5563]">
                  {formatDateTime(card.created_at)}
                </td>
                <td className="min-w-64 px-4 py-3">
                  <div className="font-black text-[#111827]">{card.display_name}</div>
                  <div className="mt-1 font-semibold text-[#374151]">{card.card_title}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-[999px] border px-2 py-1 text-xs font-bold ${rarityClass(card.rarity)}`}>
                      {card.rarity}
                    </span>
                    <span className="rounded-[999px] border border-[#cbd5e1] bg-[#f8fafc] px-2 py-1 text-xs font-bold text-[#475569]">
                      {card.events?.name ?? "Individual"}
                    </span>
                  </div>
                </td>
                <td className="min-w-44 px-4 py-3 text-xs font-semibold leading-5 text-[#475569]">
                  {card.traits?.length ? card.traits.join(", ") : "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="grid gap-2">
                    <PngBadge card={card} />
                    <span className="font-mono text-xs text-[#64748b]">{card.generation_source}</span>
                    <span className="text-xs font-semibold text-[#64748b]">
                      {formatNumber(tokenTotal(card))} tokens
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge status={card.print_status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-[#4b5563]">
                  {formatDuration(card.duration_ms)}
                </td>
                <td className="px-4 py-3">
                  <CardActions card={card} context={context} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "default" | "warn" | "good";
}) {
  const toneClass =
    tone === "warn"
      ? "border-[#f59e0b]/30 bg-[#fffbeb] text-[#92400e]"
      : tone === "good"
        ? "border-[#16a34a]/25 bg-[#f0fdf4] text-[#166534]"
        : "border-[#d9dee7] bg-white text-[#334155]";

  return (
    <div className="rounded-[8px] border border-[#d9dee7] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6b7280]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black tracking-normal text-[#111827]">{value}</p>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-[8px] border ${toneClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-black tracking-normal text-[#111827]">{title}</h2>
        <p className="mt-1 text-sm font-semibold leading-6 text-[#64748b]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Overview({
  cards,
  printQueue,
  storageIssues,
  metrics,
}: {
  cards: AdminCardRow[];
  printQueue: AdminCardRow[];
  storageIssues: AdminCardRow[];
  metrics: {
    totalCards: number;
    cardsToday: number;
    cardsThisWeek: number;
    savedPngs: number;
    missingPngs: number;
    printRequested: number;
    printed: number;
    needsAttention: number;
    estimatedTotalTokens: number;
    averageDurationMs: number;
  };
}) {
  return (
    <div className="grid gap-5">
      <SectionHeader
        title="Operations Overview"
        description="Start here. This view only shows the booth status and the work that needs attention."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Generated Today" value={formatNumber(metrics.cardsToday)} icon={<BarChart3 size={20} />} />
        <StatTile label="This Week" value={formatNumber(metrics.cardsThisWeek)} icon={<ListChecks size={20} />} />
        <StatTile label="Print Queue" value={formatNumber(metrics.printRequested)} icon={<Printer size={20} />} tone="warn" />
        <StatTile label="Storage Issues" value={formatNumber(metrics.missingPngs)} icon={<AlertTriangle size={20} />} tone={metrics.missingPngs ? "warn" : "good"} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[8px] border border-[#d9dee7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-[#e5e7eb] pb-3">
            <div>
              <h3 className="text-base font-black text-[#111827]">Recent Activity</h3>
              <p className="mt-1 text-sm font-medium text-[#64748b]">Latest generated cards.</p>
            </div>
            <Link href="/admin?view=cards" className="text-sm font-black text-[#2563eb] underline underline-offset-4">
              View all
            </Link>
          </div>
          <div className="mt-3 grid gap-2">
            {cards.slice(0, 6).map((card) => (
              <Link
                key={card.id}
                href={`/admin/cards/${card.id}`}
                className="flex items-center justify-between gap-3 rounded-[8px] border border-[#e5e7eb] bg-[#f8fafc] p-3 hover:bg-white"
              >
                <div>
                  <p className="font-black text-[#111827]">{card.display_name}</p>
                  <p className="mt-1 text-sm font-semibold text-[#64748b]">{card.card_title}</p>
                </div>
                <ExternalLink size={16} className="text-[#64748b]" />
              </Link>
            ))}
            {!cards.length && (
              <p className="rounded-[8px] border border-dashed border-[#cbd5e1] p-6 text-center text-sm font-semibold text-[#64748b]">
                No recent cards yet.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-[8px] border border-[#d9dee7] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[#e5e7eb] pb-3">
              <div>
                <h3 className="text-base font-black text-[#111827]">Next Print Jobs</h3>
                <p className="mt-1 text-sm font-medium text-[#64748b]">Cards waiting to be printed.</p>
              </div>
              <Link href="/admin?view=print" className="text-sm font-black text-[#2563eb] underline underline-offset-4">
                Queue
              </Link>
            </div>
            <div className="mt-3 grid gap-2">
              {printQueue.slice(0, 4).map((card) => (
                <div key={card.id} className="rounded-[8px] border border-[#e5e7eb] bg-[#fffbeb] p-3">
                  <p className="font-black text-[#111827]">{card.display_name}</p>
                  <p className="mt-1 text-sm font-semibold text-[#92400e]">{card.card_png_path ? "Ready PNG" : "Missing PNG"}</p>
                </div>
              ))}
              {!printQueue.length && (
                <p className="rounded-[8px] border border-dashed border-[#cbd5e1] p-6 text-center text-sm font-semibold text-[#64748b]">
                  No print jobs waiting.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[8px] border border-[#d9dee7] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[#e5e7eb] pb-3">
              <div>
                <h3 className="text-base font-black text-[#111827]">Storage Health</h3>
                <p className="mt-1 text-sm font-medium text-[#64748b]">Rows without final PNGs.</p>
              </div>
              <Link href="/admin?view=storage" className="text-sm font-black text-[#2563eb] underline underline-offset-4">
                Review
              </Link>
            </div>
            <div className="mt-3 grid gap-2">
              {storageIssues.slice(0, 3).map((card) => (
                <div key={card.id} className="rounded-[8px] border border-[#fecaca] bg-[#fef2f2] p-3">
                  <p className="font-black text-[#111827]">{card.display_name}</p>
                  <p className="mt-1 text-sm font-semibold text-[#991b1b]">PNG missing</p>
                </div>
              ))}
              {!storageIssues.length && (
                <p className="rounded-[8px] border border-[#bbf7d0] bg-[#f0fdf4] p-6 text-center text-sm font-semibold text-[#166534]">
                  All generated cards have stored PNGs.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CardsFilters({
  filters,
  rarityOptions,
  sourceOptions,
}: {
  filters: ReturnType<typeof parseAdminFilters>;
  rarityOptions: string[];
  sourceOptions: string[];
}) {
  return (
    <form className="rounded-[8px] border border-[#d9dee7] bg-white p-4 shadow-sm">
      <input type="hidden" name="view" value="cards" />
      <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_repeat(5,max-content)_max-content] lg:items-end">
        <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">
          Search records
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              name="q"
              defaultValue={filters.search}
              placeholder="Name or card title"
              className="h-10 w-full rounded-[6px] border border-[#cfd6e2] bg-white pl-9 pr-3 text-sm font-semibold normal-case tracking-normal text-[#111827]"
            />
          </div>
        </label>

        <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">
          Print
          <select name="print_status" defaultValue={filters.printStatus} className="h-10 rounded-[6px] border border-[#cfd6e2] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#111827]">
            <option value="">All</option>
            {printStatusValues.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">
          PNG
          <select name="png" defaultValue={filters.png} className="h-10 rounded-[6px] border border-[#cfd6e2] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#111827]">
            <option value="all">All</option>
            <option value="saved">Saved</option>
            <option value="missing">Missing</option>
          </select>
        </label>

        <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">
          Range
          <select name="range" defaultValue={filters.dateRange} className="h-10 rounded-[6px] border border-[#cfd6e2] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#111827]">
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
          </select>
        </label>

        <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">
          Rarity
          <select name="rarity" defaultValue={filters.rarity} className="h-10 rounded-[6px] border border-[#cfd6e2] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#111827]">
            <option value="">All</option>
            {rarityOptions.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">
          Source
          <select name="source" defaultValue={filters.source} className="h-10 rounded-[6px] border border-[#cfd6e2] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#111827]">
            <option value="">All</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <button type="submit" className="h-10 rounded-[6px] bg-[#111827] px-4 text-sm font-black text-white hover:bg-[#1f2937]">
            Apply
          </button>
          <Link href="/admin?view=cards" className="grid h-10 place-items-center rounded-[6px] border border-[#cfd6e2] bg-white px-4 text-sm font-bold text-[#334155] hover:bg-[#f8fafc]">
            Clear
          </Link>
        </div>
      </div>
    </form>
  );
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  await requireAdminSession();
  const rawSearchParams = await searchParams;
  const activeView = normalizeView(rawSearchParams.view);
  const filters = parseAdminFilters(rawSearchParams);
  const dashboard = await getAdminDashboardData(filters);

  return (
    <main className="min-h-screen bg-[#eef2f7] text-[#111827] lg:grid lg:grid-cols-[288px_1fr]">
      <aside className="bg-[#1769a6] text-white lg:min-h-screen">
        <div className="flex items-center justify-between border-b border-white/15 px-5 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#bfdbfe]">CardifyBooth</p>
            <h1 className="mt-1 text-xl font-black tracking-normal">Admin</h1>
          </div>
          <Database className="h-6 w-6 text-[#bfdbfe]" />
        </div>

        <nav className="grid gap-1 px-3 py-4">
          <SidebarLink view="overview" activeView={activeView} label="Overview" />
          <SidebarLink view="cards" activeView={activeView} label="Card Records" count={dashboard.metrics.totalCards} />
          <SidebarLink view="print" activeView={activeView} label="Print Queue" count={dashboard.metrics.printRequested} />
          <SidebarLink view="storage" activeView={activeView} label="Storage Issues" count={dashboard.metrics.missingPngs} />
          <SidebarLink view="system" activeView={activeView} label="System" />
        </nav>

        <div className="mt-auto border-t border-white/15 px-5 py-4">
          <div className="rounded-[8px] bg-white/10 p-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#bfdbfe]">Environment</p>
            <p className="mt-1 font-black">Production</p>
            <p className="mt-1 text-xs font-semibold text-[#dbeafe]">
              Refreshed {formatDateTime(dashboard.lastRefreshed)}
            </p>
          </div>
        </div>
      </aside>

      <section className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d9dee7] bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64748b]">Operations Console</p>
            <h2 className="mt-1 text-2xl font-black tracking-normal">
              {activeView === "overview" && "Overview"}
              {activeView === "cards" && "Card Records"}
              {activeView === "print" && "Print Queue"}
              {activeView === "storage" && "Storage Issues"}
              {activeView === "system" && "System"}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-[999px] border border-[#16a34a]/25 bg-[#f0fdf4] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#166534]">
              <CircleCheck size={14} />
              Live
            </span>
            <Link href="/" className="rounded-[6px] border border-[#cfd6e2] bg-white px-3 py-2 text-sm font-bold text-[#334155] hover:bg-[#f8fafc]">
              Booth
            </Link>
            <form action="/admin/logout" method="post">
              <button type="submit" className="rounded-[6px] bg-[#111827] px-3 py-2 text-sm font-bold text-white hover:bg-[#1f2937]">
                Logout
              </button>
            </form>
          </div>
        </header>

        <div className="grid gap-5 px-4 py-5 sm:px-6 lg:px-8">
          {activeView === "overview" && (
            <Overview
              cards={dashboard.recentCards}
              printQueue={dashboard.printQueue}
              storageIssues={dashboard.storageIssues}
              metrics={dashboard.metrics}
            />
          )}

          {activeView === "cards" && (
            <div className="grid gap-5">
              <SectionHeader
                title="Card Records"
                description="Search and manage generated cards. Rarity/source filters are secondary tools here, not the main dashboard."
              />
              <CardsFilters
                filters={filters}
                rarityOptions={dashboard.rarityOptions}
                sourceOptions={dashboard.sourceOptions}
              />
              <CardRecordTable cards={dashboard.recentCards} context="cards" empty="No card records match these filters." />
            </div>
          )}

          {activeView === "print" && (
            <div className="grid gap-5">
              <SectionHeader
                title="Print Queue"
                description="Only cards marked requested appear here. This is the operational queue for physical output."
              />
              <CardRecordTable cards={dashboard.printQueue} context="print" empty="No print jobs are waiting." />
            </div>
          )}

          {activeView === "storage" && (
            <div className="grid gap-5">
              <SectionHeader
                title="Storage Issues"
                description="Cards listed here have metadata but no saved final PNG, so QR/printing may be incomplete."
              />
              <CardRecordTable cards={dashboard.storageIssues} context="storage" empty="No storage issues found." />
            </div>
          )}

          {activeView === "system" && (
            <div className="grid gap-5">
              <SectionHeader
                title="System"
                description="Deployment, data, and workflow summary for the booth admin."
              />
              <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[8px] border border-[#d9dee7] bg-white p-4 shadow-sm">
                  <h3 className="text-base font-black">Data Pipeline</h3>
                  <div className="mt-4 grid gap-3 text-sm font-semibold text-[#475569]">
                    <p>User upload → card generation API → Supabase row → PNG autosave → QR saved-card page.</p>
                    <p>Rows live in card_generations. Final images live in Supabase Storage bucket card-prints.</p>
                  </div>
                </div>
                <div className="rounded-[8px] border border-[#d9dee7] bg-white p-4 shadow-sm">
                  <h3 className="text-base font-black">Print Workflow</h3>
                  <div className="mt-4 grid gap-3 text-sm font-semibold text-[#475569]">
                    <p>not_requested means generated but not queued.</p>
                    <p>requested means waiting for physical print.</p>
                    <p>printed means completed output.</p>
                  </div>
                </div>
                <div className="rounded-[8px] border border-[#d9dee7] bg-white p-4 shadow-sm">
                  <h3 className="text-base font-black">Current Totals</h3>
                  <dl className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between gap-3"><dt className="font-semibold text-[#64748b]">Total cards</dt><dd className="font-black">{formatNumber(dashboard.metrics.totalCards)}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="font-semibold text-[#64748b]">PNGs saved</dt><dd className="font-black">{formatNumber(dashboard.metrics.savedPngs)}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="font-semibold text-[#64748b]">Token estimate</dt><dd className="font-black">{formatNumber(dashboard.metrics.estimatedTotalTokens)}</dd></div>
                  </dl>
                </div>
              </section>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
