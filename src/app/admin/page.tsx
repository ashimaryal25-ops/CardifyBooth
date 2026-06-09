import {
  Archive,
  CheckCircle2,
  ExternalLink,
  FileWarning,
  Home,
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

type AdminView = "control" | "print" | "records" | "issues" | "system";

const navItems: Array<{
  view: AdminView;
  label: string;
  description: string;
}> = [
  { view: "control", label: "Control Center", description: "Current event status" },
  { view: "print", label: "Print Queue", description: "Cards waiting for output" },
  { view: "records", label: "Card Records", description: "Search generated cards" },
  { view: "issues", label: "Output Issues", description: "Missing saved PNGs" },
  { view: "system", label: "System", description: "Pipeline and setup" },
];

function normalizeView(value: string | string[] | undefined): AdminView {
  const view = Array.isArray(value) ? value[0] : value;

  if (view === "print" || view === "records" || view === "issues" || view === "system") {
    return view;
  }

  return "control";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
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

function ViewIcon({ view }: { view: AdminView }) {
  const className = "h-4 w-4";

  if (view === "print") {
    return <Printer className={className} />;
  }

  if (view === "records") {
    return <Archive className={className} />;
  }

  if (view === "issues") {
    return <FileWarning className={className} />;
  }

  if (view === "system") {
    return <Settings className={className} />;
  }

  return <Home className={className} />;
}

function SidebarNav({
  activeView,
  printCount,
  issueCount,
  totalRecords,
}: {
  activeView: AdminView;
  printCount: number;
  issueCount: number;
  totalRecords: number;
}) {
  function countFor(view: AdminView) {
    if (view === "print") {
      return printCount;
    }

    if (view === "issues") {
      return issueCount;
    }

    if (view === "records") {
      return totalRecords;
    }

    return null;
  }

  return (
    <aside className="border-r border-[#d9dee7] bg-[#0f172a] text-white lg:min-h-screen">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#94a3b8]">
          CardifyBooth
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-normal">Operations</h1>
      </div>

      <nav className="grid gap-1 px-3 py-4">
        {navItems.map((item) => {
          const active = activeView === item.view;
          const count = countFor(item.view);

          return (
            <Link
              key={item.view}
              href={item.view === "control" ? "/admin" : `/admin?view=${item.view}`}
              className={`grid grid-cols-[20px_1fr_auto] items-center gap-3 rounded-[6px] px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-white text-[#0f172a]"
                  : "text-[#cbd5e1] hover:bg-white/10 hover:text-white"
              }`}
            >
              <ViewIcon view={item.view} />
              <span>
                <span className="block font-semibold">{item.label}</span>
                <span className={`block text-xs ${active ? "text-[#475569]" : "text-[#94a3b8]"}`}>
                  {item.description}
                </span>
              </span>
              {count !== null && (
                <span
                  className={`rounded-[999px] px-2 py-0.5 text-xs font-semibold ${
                    active ? "bg-[#e2e8f0] text-[#334155]" : "bg-white/10 text-[#e2e8f0]"
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function PageHeader({
  title,
  description,
  lastRefreshed,
}: {
  title: string;
  description: string;
  lastRefreshed: string;
}) {
  return (
    <header className="border-b border-[#d9dee7] bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64748b]">
            Admin Console
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-[#0f172a]">{title}</h2>
          <p className="mt-1 text-sm font-medium text-[#64748b]">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-[6px] border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-xs font-semibold text-[#166534]">
            <CheckCircle2 size={14} />
            Production
          </span>
          <span className="rounded-[6px] border border-[#d9dee7] bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-[#475569]">
            Refreshed {formatTime(lastRefreshed)}
          </span>
          <Link
            href="/"
            className="rounded-[6px] border border-[#cfd6e2] bg-white px-3 py-2 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc]"
          >
            Booth
          </Link>
          <form action="/admin/logout" method="post">
            <button
              type="submit"
              className="rounded-[6px] bg-[#0f172a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1e293b]"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function SummaryStrip({
  label,
  value,
  detail,
  state = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  state?: "neutral" | "warning" | "good";
}) {
  const stateClass =
    state === "warning"
      ? "border-[#f59e0b] bg-[#fffbeb]"
      : state === "good"
        ? "border-[#16a34a] bg-[#f0fdf4]"
        : "border-[#d9dee7] bg-white";

  return (
    <div className={`border-l-4 ${stateClass} p-4 shadow-sm`}>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#64748b]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal text-[#0f172a]">{value}</p>
      <p className="mt-1 text-sm font-medium text-[#64748b]">{detail}</p>
    </div>
  );
}

function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warning" | "danger" | "good" }) {
  const toneClass =
    tone === "danger"
      ? "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]"
      : tone === "warning"
        ? "border-[#fde68a] bg-[#fffbeb] text-[#92400e]"
        : tone === "good"
          ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]"
          : "border-[#cbd5e1] bg-[#f8fafc] text-[#475569]";

  return (
    <span className={`inline-flex rounded-[999px] border px-2 py-1 text-xs font-semibold ${toneClass}`}>
      {children}
    </span>
  );
}

function printTone(status: string) {
  if (status === "requested") {
    return "warning" as const;
  }

  if (status === "printed") {
    return "good" as const;
  }

  return "neutral" as const;
}

function PngStatus({ card }: { card: AdminCardRow }) {
  return card.card_png_path ? (
    <StatusPill tone="good">PNG saved</StatusPill>
  ) : (
    <StatusPill tone="danger">PNG missing</StatusPill>
  );
}

function PrintStatusForm({
  cardId,
  currentStatus,
}: {
  cardId: string;
  currentStatus: string;
}) {
  return (
    <form action={updatePrintStatusAction} className="flex items-center gap-1">
      <input type="hidden" name="cardId" value={cardId} />
      <select
        name="status"
        defaultValue={currentStatus}
        className="h-8 rounded-[6px] border border-[#cfd6e2] bg-white px-2 text-xs font-semibold text-[#334155]"
      >
        {printStatusValues.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="h-8 rounded-[6px] bg-[#0f172a] px-2.5 text-xs font-semibold text-white hover:bg-[#1e293b]"
      >
        Update
      </button>
    </form>
  );
}

function RowActions({ card, mode }: { card: AdminCardRow; mode: AdminView }) {
  const pngUrl = getPublicCardUrl(card.card_png_path);

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/cards/${card.id}`}
          className="rounded-[6px] border border-[#cfd6e2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#334155] hover:bg-[#f8fafc]"
        >
          Details
        </Link>
        <Link
          href={`/cards/${card.id}`}
          className="rounded-[6px] border border-[#cfd6e2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#334155] hover:bg-[#f8fafc]"
        >
          Public
        </Link>
        {pngUrl && (
          <a
            href={pngUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-[6px] border border-[#cfd6e2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#334155] hover:bg-[#f8fafc]"
          >
            PNG
          </a>
        )}
        <DeleteCardButton cardId={card.id} action={deleteCardGenerationAction} compact />
      </div>
      {(mode === "records" || mode === "print") && (
        <PrintStatusForm cardId={card.id} currentStatus={card.print_status} />
      )}
    </div>
  );
}

function WorkTable({
  cards,
  mode,
  empty,
}: {
  cards: AdminCardRow[];
  mode: AdminView;
  empty: string;
}) {
  if (!cards.length) {
    return (
      <div className="border border-dashed border-[#cbd5e1] bg-white p-10 text-center">
        <p className="text-sm font-semibold text-[#64748b]">{empty}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-[#d9dee7] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="border-b border-[#d9dee7] bg-[#f8fafc] text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">Created</th>
              <th className="whitespace-nowrap px-4 py-3">Card</th>
              <th className="whitespace-nowrap px-4 py-3">Output</th>
              <th className="whitespace-nowrap px-4 py-3">Print</th>
              <th className="min-w-72 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef2f7]">
            {cards.map((card) => (
              <tr key={card.id} className="align-top hover:bg-[#f8fafc]">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-[#475569]">
                  {formatDateTime(card.created_at)}
                </td>
                <td className="min-w-72 px-4 py-3">
                  <p className="font-semibold text-[#0f172a]">{card.display_name}</p>
                  <p className="mt-1 font-medium text-[#334155]">{card.card_title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusPill>{card.rarity}</StatusPill>
                    <StatusPill>{card.events?.name ?? "Individual"}</StatusPill>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="grid gap-2">
                    <PngStatus card={card} />
                    <span className="font-mono text-xs text-[#64748b]">{card.generation_source}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusPill tone={printTone(card.print_status)}>{card.print_status}</StatusPill>
                </td>
                <td className="px-4 py-3">
                  <RowActions card={card} mode={mode} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="border border-[#d9dee7] bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e5e7eb] px-4 py-3">
        <div>
          <h3 className="text-base font-semibold text-[#0f172a]">{title}</h3>
          <p className="mt-1 text-sm font-medium text-[#64748b]">{description}</p>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function ControlCenter({
  cards,
  printQueue,
  issues,
  metrics,
}: {
  cards: AdminCardRow[];
  printQueue: AdminCardRow[];
  issues: AdminCardRow[];
  metrics: {
    totalCards: number;
    cardsToday: number;
    cardsThisWeek: number;
    savedPngs: number;
    missingPngs: number;
    printRequested: number;
    printed: number;
    estimatedTotalTokens: number;
    averageDurationMs: number;
  };
}) {
  return (
    <div className="grid gap-5">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryStrip
          label="Cards Today"
          value={formatNumber(metrics.cardsToday)}
          detail={`${formatNumber(metrics.cardsThisWeek)} in the last 7 days`}
        />
        <SummaryStrip
          label="Waiting To Print"
          value={formatNumber(metrics.printRequested)}
          detail="Cards requested by admin"
          state={metrics.printRequested ? "warning" : "good"}
        />
        <SummaryStrip
          label="Output Problems"
          value={formatNumber(metrics.missingPngs)}
          detail="Rows missing final PNG"
          state={metrics.missingPngs ? "warning" : "good"}
        />
        <SummaryStrip
          label="Printed"
          value={formatNumber(metrics.printed)}
          detail={`${formatNumber(metrics.totalCards)} total records`}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Panel
          title="Work Requiring Attention"
          description="This is the admin's real to-do list: print jobs first, broken output second."
          action={<Link href="/admin?view=print" className="text-sm font-semibold text-[#1d4ed8] underline underline-offset-4">Open queue</Link>}
        >
          <div className="grid gap-3">
            {printQueue.slice(0, 4).map((card) => (
              <div key={card.id} className="grid gap-3 border border-[#fde68a] bg-[#fffbeb] p-3 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="font-semibold text-[#0f172a]">{card.display_name}</p>
                  <p className="mt-1 text-sm font-medium text-[#92400e]">
                    Print requested · {card.card_png_path ? "PNG ready" : "PNG missing"}
                  </p>
                </div>
                <RowActions card={card} mode="print" />
              </div>
            ))}
            {issues.slice(0, 3).map((card) => (
              <div key={card.id} className="grid gap-3 border border-[#fecaca] bg-[#fef2f2] p-3 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="font-semibold text-[#0f172a]">{card.display_name}</p>
                  <p className="mt-1 text-sm font-medium text-[#991b1b]">
                    Final PNG missing. QR and print output may be incomplete.
                  </p>
                </div>
                <RowActions card={card} mode="issues" />
              </div>
            ))}
            {!printQueue.length && !issues.length && (
              <div className="border border-[#bbf7d0] bg-[#f0fdf4] p-6 text-center">
                <p className="text-sm font-semibold text-[#166534]">No urgent work right now.</p>
              </div>
            )}
          </div>
        </Panel>

        <div className="grid gap-5">
          <Panel title="Recent Generations" description="Latest cards created by booth users.">
            <div className="grid gap-2">
              {cards.slice(0, 6).map((card) => (
                <Link
                  key={card.id}
                  href={`/admin/cards/${card.id}`}
                  className="flex items-center justify-between gap-3 border border-[#e5e7eb] bg-[#f8fafc] p-3 hover:bg-white"
                >
                  <span>
                    <span className="block font-semibold text-[#0f172a]">{card.display_name}</span>
                    <span className="mt-1 block text-xs font-medium text-[#64748b]">{formatTime(card.created_at)}</span>
                  </span>
                  <ExternalLink size={16} className="text-[#64748b]" />
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Run Metrics" description="Useful totals, not the main work queue.">
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="font-medium text-[#64748b]">PNGs saved</dt>
                <dd className="font-semibold text-[#0f172a]">{formatNumber(metrics.savedPngs)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-medium text-[#64748b]">Token estimate</dt>
                <dd className="font-semibold text-[#0f172a]">{formatNumber(metrics.estimatedTotalTokens)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-medium text-[#64748b]">Average duration</dt>
                <dd className="font-semibold text-[#0f172a]">{formatDuration(metrics.averageDurationMs)}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function RecordsToolbar({
  filters,
}: {
  filters: ReturnType<typeof parseAdminFilters>;
}) {
  return (
    <form className="border border-[#d9dee7] bg-white p-4 shadow-sm">
      <input type="hidden" name="view" value="records" />
      <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_repeat(3,max-content)_max-content] lg:items-end">
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
          Search
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              name="q"
              defaultValue={filters.search}
              placeholder="Name or card title"
              className="h-10 w-full rounded-[6px] border border-[#cfd6e2] bg-white pl-9 pr-3 text-sm font-medium normal-case tracking-normal text-[#111827]"
            />
          </div>
        </label>

        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
          Print status
          <select name="print_status" defaultValue={filters.printStatus} className="h-10 rounded-[6px] border border-[#cfd6e2] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#111827]">
            <option value="">Any</option>
            {printStatusValues.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
          Output file
          <select name="png" defaultValue={filters.png} className="h-10 rounded-[6px] border border-[#cfd6e2] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#111827]">
            <option value="all">Any</option>
            <option value="saved">Saved</option>
            <option value="missing">Missing</option>
          </select>
        </label>

        <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
          Time range
          <select name="range" defaultValue={filters.dateRange} className="h-10 rounded-[6px] border border-[#cfd6e2] bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#111827]">
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
          </select>
        </label>

        <div className="flex gap-2">
          <button type="submit" className="h-10 rounded-[6px] bg-[#0f172a] px-4 text-sm font-semibold text-white hover:bg-[#1e293b]">
            Apply
          </button>
          <Link href="/admin?view=records" className="grid h-10 place-items-center rounded-[6px] border border-[#cfd6e2] bg-white px-4 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc]">
            Clear
          </Link>
        </div>
      </div>
    </form>
  );
}

function SystemView({
  metrics,
}: {
  metrics: {
    totalCards: number;
    savedPngs: number;
    estimatedTotalTokens: number;
    averageDurationMs: number;
  };
}) {
  return (
    <div className="grid gap-5">
      <Panel title="Pipeline" description="How data moves through CardifyBooth.">
        <ol className="grid gap-3 text-sm font-medium text-[#475569]">
          <li>1. User uploads photo and submits card details.</li>
          <li>2. API validates/generates the card identity.</li>
          <li>3. Supabase saves a card_generations row.</li>
          <li>4. Browser renders the final card PNG.</li>
          <li>5. Supabase Storage saves the print-ready PNG.</li>
          <li>6. QR opens the saved card page.</li>
        </ol>
      </Panel>

      <Panel title="Current System Totals" description="Technical totals for debugging and reporting.">
        <dl className="grid gap-3 text-sm">
          <div className="flex justify-between gap-3 border-b border-[#eef2f7] pb-2">
            <dt className="font-medium text-[#64748b]">Total card rows</dt>
            <dd className="font-semibold text-[#0f172a]">{formatNumber(metrics.totalCards)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-[#eef2f7] pb-2">
            <dt className="font-medium text-[#64748b]">Stored PNG files</dt>
            <dd className="font-semibold text-[#0f172a]">{formatNumber(metrics.savedPngs)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-[#eef2f7] pb-2">
            <dt className="font-medium text-[#64748b]">Estimated tokens</dt>
            <dd className="font-semibold text-[#0f172a]">{formatNumber(metrics.estimatedTotalTokens)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-medium text-[#64748b]">Average generation duration</dt>
            <dd className="font-semibold text-[#0f172a]">{formatDuration(metrics.averageDurationMs)}</dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}

function titleFor(view: AdminView) {
  if (view === "print") {
    return "Print Queue";
  }

  if (view === "records") {
    return "Card Records";
  }

  if (view === "issues") {
    return "Output Issues";
  }

  if (view === "system") {
    return "System";
  }

  return "Control Center";
}

function descriptionFor(view: AdminView) {
  if (view === "print") {
    return "Cards an operator has approved for physical output.";
  }

  if (view === "records") {
    return "Lookup and maintain generated card records.";
  }

  if (view === "issues") {
    return "Cards with missing final output files.";
  }

  if (view === "system") {
    return "Pipeline summary and technical health.";
  }

  return "The first screen for event staff: status, queue, and problems.";
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  await requireAdminSession();
  const rawSearchParams = await searchParams;
  const activeView = normalizeView(rawSearchParams.view);
  const filters = parseAdminFilters(rawSearchParams);
  const dashboard = await getAdminDashboardData(filters);

  return (
    <main className="min-h-screen bg-[#eef2f7] text-[#0f172a] lg:grid lg:grid-cols-[280px_1fr]">
      <SidebarNav
        activeView={activeView}
        printCount={dashboard.metrics.printRequested}
        issueCount={dashboard.metrics.missingPngs}
        totalRecords={dashboard.metrics.totalCards}
      />

      <section className="min-w-0">
        <PageHeader
          title={titleFor(activeView)}
          description={descriptionFor(activeView)}
          lastRefreshed={dashboard.lastRefreshed}
        />

        <div className="grid gap-5 px-4 py-5 sm:px-6 lg:px-8">
          {activeView === "control" && (
            <ControlCenter
              cards={dashboard.recentCards}
              printQueue={dashboard.printQueue}
              issues={dashboard.storageIssues}
              metrics={dashboard.metrics}
            />
          )}

          {activeView === "print" && (
            <WorkTable
              cards={dashboard.printQueue}
              mode="print"
              empty="No cards are waiting to print."
            />
          )}

          {activeView === "records" && (
            <div className="grid gap-4">
              <RecordsToolbar filters={filters} />
              <WorkTable
                cards={dashboard.recentCards}
                mode="records"
                empty="No generated cards match this search."
              />
            </div>
          )}

          {activeView === "issues" && (
            <WorkTable
              cards={dashboard.storageIssues}
              mode="issues"
              empty="No missing output files found."
            />
          )}

          {activeView === "system" && <SystemView metrics={dashboard.metrics} />}
        </div>
      </section>
    </main>
  );
}
