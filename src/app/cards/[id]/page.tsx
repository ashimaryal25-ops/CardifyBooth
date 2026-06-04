/* eslint-disable @next/next/no-img-element -- Saved card PNGs are Supabase Storage URLs. */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-server";

interface SavedCardPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface CardGenerationRow {
  id: string;
  display_name: string;
  card_title: string;
  rarity: string;
  description: string;
  card_png_path: string | null;
  created_at: string;
}

function getPublicCardUrl(cardPngPath: string) {
  const [bucketName, ...pathParts] = cardPngPath.split("/");
  const filePath = pathParts.join("/");

  if (!bucketName || !filePath) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

  return data.publicUrl;
}

export default async function SavedCardPage({ params }: SavedCardPageProps) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("card_generations")
    .select("id, display_name, card_title, rarity, description, card_png_path, created_at")
    .eq("id", id)
    .single<CardGenerationRow>();

  if (error || !data) {
    notFound();
  }

  const cardImageUrl = data.card_png_path ? getPublicCardUrl(data.card_png_path) : null;

  return (
    <main className="min-h-screen px-4 py-6 text-[#171512] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-[#2a2925]/10 bg-[#fffaf1]/75 px-4 py-3 shadow-sm">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#8a372c]">
              CardifyBooth
            </p>
            <h1 className="text-2xl font-black tracking-normal text-[#171512]">
              Saved Card
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-[8px] border border-[#2a2925]/15 bg-white/70 px-4 py-2 text-sm font-black text-[#2a2925] hover:bg-white"
          >
            Create another
          </Link>
        </header>

        <section className="grid gap-7 lg:grid-cols-[minmax(280px,460px)_1fr] lg:items-start">
          <div className="rounded-[8px] border border-[#2a2925]/10 bg-[#fffaf1]/75 p-4 shadow-sm">
            {cardImageUrl ? (
              <img
                src={cardImageUrl}
                alt={`${data.display_name} generated CardifyBooth card`}
                className="w-full rounded-[8px] border border-[#2a2925]/10 bg-white"
              />
            ) : (
              <div className="grid min-h-[420px] place-items-center rounded-[8px] border border-dashed border-[#2a2925]/20 bg-white/60 p-6 text-center">
                <div>
                  <h2 className="text-2xl font-black text-[#171512]">Card image not saved yet</h2>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#5f574d]">
                    The metadata exists, but `card_png_path` is empty. Generate a new card
                    after the PNG autosave fix, then scan that QR.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[8px] border border-[#2a2925]/10 bg-[#fffaf1]/75 p-5 shadow-sm">
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#8a372c]">
              {data.rarity}
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-normal text-[#171512]">
              {data.display_name}
            </h2>
            <p className="mt-2 text-2xl font-black text-[#185c54]">{data.card_title}</p>
            <p className="mt-4 text-base font-semibold leading-7 text-[#5f574d]">
              {data.description}
            </p>
            <dl className="mt-6 grid gap-3 text-sm">
              <div className="rounded-[8px] bg-white/65 p-3">
                <dt className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#8a372c]">
                  Card ID
                </dt>
                <dd className="mt-1 break-all font-semibold text-[#171512]">{data.id}</dd>
              </div>
              <div className="rounded-[8px] bg-white/65 p-3">
                <dt className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#8a372c]">
                  Created
                </dt>
                <dd className="mt-1 font-semibold text-[#171512]">
                  {new Date(data.created_at).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </main>
  );
}
