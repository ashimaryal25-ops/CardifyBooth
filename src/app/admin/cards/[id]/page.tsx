/* eslint-disable @next/next/no-img-element -- Admin previews Supabase Storage PNG URLs. */

import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCardGenerationAction, updatePrintStatusAction } from "@/app/admin/actions";
import { DeleteCardButton } from "@/app/admin/DeleteCardButton";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminCardById, printStatusValues } from "@/lib/admin-cards";

interface AdminCardDetailPageProps {
  params: Promise<{
    id: string;
  }>;
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

function formatNumber(value: number | null) {
  return new Intl.NumberFormat("en").format(value ?? 0);
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-[8px] border border-[#e5e7eb] bg-white p-3">
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#64748b]">{label}</dt>
      <dd className={`mt-1 break-words text-sm font-semibold text-[#111827] ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function StatusButton({
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
        className="rounded-[6px] border border-[#cfd6e2] bg-white px-3 py-2 text-sm font-bold text-[#334155] hover:bg-[#f8fafc]"
      >
        {label}
      </button>
    </form>
  );
}

export default async function AdminCardDetailPage({ params }: AdminCardDetailPageProps) {
  await requireAdminSession();
  const { id } = await params;
  const card = await getAdminCardById(id);

  if (!card) {
    notFound();
  }

  const tokenTotal = (card.estimated_input_tokens ?? 0) + (card.estimated_output_tokens ?? 0);

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#111827]">
      <header className="border-b border-[#d9dee7] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link href="/admin" className="text-sm font-bold text-[#2563eb] underline underline-offset-4">
              Back to admin
            </Link>
            <h1 className="mt-2 text-2xl font-black tracking-normal text-[#111827]">
              {card.display_name}
            </h1>
            <p className="mt-1 text-sm font-semibold text-[#64748b]">{card.card_title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={card.publicCardUrl}
              className="rounded-[6px] border border-[#cfd6e2] bg-white px-3 py-2 text-sm font-bold text-[#334155] hover:bg-[#f8fafc]"
            >
              Public page
            </Link>
            {card.cardPngUrl && (
              <a
                href={card.cardPngUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-[6px] bg-[#111827] px-3 py-2 text-sm font-bold text-white hover:bg-[#1f2937]"
              >
                Open PNG
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(300px,420px)_1fr] lg:px-8">
        <section className="grid gap-4">
          <div className="overflow-hidden rounded-[8px] border border-[#d9dee7] bg-white shadow-sm">
            <div className="border-b border-[#e5e7eb] px-4 py-3">
              <h2 className="text-base font-black">Stored PNG</h2>
              <p className="mt-1 text-sm font-medium text-[#64748b]">
                Final image used by QR page and future print queue.
              </p>
            </div>
            <div className="p-4">
              {card.cardPngUrl ? (
                <img
                  src={card.cardPngUrl}
                  alt={`${card.display_name} generated card`}
                  className="w-full rounded-[8px] border border-[#e5e7eb] bg-white"
                />
              ) : (
                <div className="grid min-h-[360px] place-items-center rounded-[8px] border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-6 text-center">
                  <div>
                    <h3 className="text-lg font-black text-[#991b1b]">PNG missing</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#64748b]">
                      Metadata exists, but card_png_path is empty. This card cannot be printed
                      until a generated PNG is saved.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[8px] border border-[#d9dee7] bg-white p-4 shadow-sm">
            <h2 className="text-base font-black">Admin Actions</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {printStatusValues.map((status) => (
                <StatusButton
                  key={status}
                  cardId={card.id}
                  status={status}
                  label={status === "not_requested" ? "Reset print" : `Mark ${status}`}
                />
              ))}
              <DeleteCardButton cardId={card.id} action={deleteCardGenerationAction} />
            </div>
          </div>
        </section>

        <section className="grid gap-5">
          <div className="rounded-[8px] border border-[#d9dee7] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e5e7eb] pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#64748b]">
                  {card.rarity}
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-normal text-[#111827]">
                  {card.card_title}
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#475569]">
                  {card.description}
                </p>
              </div>
              <span className="rounded-[999px] border border-[#cfd6e2] bg-[#f8fafc] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#475569]">
                {card.print_status}
              </span>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailItem label="Card ID" value={card.id} mono />
              <DetailItem label="Created" value={formatDateTime(card.created_at)} />
              <DetailItem label="Display Name" value={card.display_name} />
              <DetailItem label="Tagline" value={card.tagline ?? "-"} />
              <DetailItem label="Special Ability" value={card.special_ability} />
              <DetailItem label="Traits" value={card.traits?.length ? card.traits.join(", ") : "-"} />
              <DetailItem label="Event" value={card.events?.name ?? "Individual"} />
              <DetailItem label="Event Theme" value={card.events?.theme ?? "-"} />
              <DetailItem label="Generation Source" value={card.generation_source} />
              <DetailItem label="Model" value={card.model ?? "-"} />
              <DetailItem label="Input Tokens" value={formatNumber(card.estimated_input_tokens)} />
              <DetailItem label="Output Tokens" value={formatNumber(card.estimated_output_tokens)} />
              <DetailItem label="Total Tokens" value={formatNumber(tokenTotal)} />
              <DetailItem label="Duration" value={formatDuration(card.duration_ms)} />
              <DetailItem label="Photo Path" value={card.photo_path ?? "-"} mono />
              <DetailItem label="PNG Path" value={card.card_png_path ?? "Missing"} mono />
            </dl>
          </div>

          <div className="rounded-[8px] border border-[#d9dee7] bg-white p-4 shadow-sm">
            <h2 className="text-base font-black">Stats JSON</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {Object.entries(card.stats ?? {}).map(([label, value]) => (
                <div key={label} className="rounded-[8px] border border-[#e5e7eb] bg-[#f8fafc] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-[#334155]">{label}</span>
                    <span className="font-mono text-sm font-black text-[#111827]">{value}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
                    <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[8px] border border-[#d9dee7] bg-white p-4 shadow-sm">
            <h2 className="text-base font-black">URLs</h2>
            <dl className="mt-3 grid gap-3">
              <DetailItem
                label="Public Saved Card"
                value={
                  <Link href={card.publicCardUrl} className="text-[#2563eb] underline underline-offset-4">
                    {card.publicCardUrl}
                  </Link>
                }
              />
              <DetailItem
                label="Stored PNG URL"
                value={
                  card.cardPngUrl ? (
                    <a
                      href={card.cardPngUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#2563eb] underline underline-offset-4"
                    >
                      {card.cardPngUrl}
                    </a>
                  ) : (
                    "Missing"
                  )
                }
              />
            </dl>
          </div>
        </section>
      </div>
    </main>
  );
}
