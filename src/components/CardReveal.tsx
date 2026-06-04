"use client";

/* eslint-disable @next/next/no-img-element -- Export preview is a generated PNG data URL. */

import { Download, Printer, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { downloadPng, makeCardFilename, renderCardAsPng } from "@/lib/export-card";
import type { CardIdentity } from "@/lib/card-schema";
import { CardPreview } from "@/components/CardPreview";
import { uploadCardPrint } from "@/lib/upload-card-print";

interface CardRevealProps {
  card: CardIdentity;
  cardId: string | null;
  photo: string;
  qrCode?: string;
  onRestart: () => void;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function CardReveal({ card, cardId, photo, qrCode, onRestart }: CardRevealProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hasAutoSavedRef = useRef(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [exportedPng, setExportedPng] = useState<string | null>(null);
  const [savedPrintUrl, setSavedPrintUrl] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const filename = makeCardFilename(card.displayName);

  useEffect(() => {
    if (!cardId || !cardRef.current || hasAutoSavedRef.current) {
      return;
    }

    setSaveStatus("saving");

    const timer = window.setTimeout(async () => {
      if (hasAutoSavedRef.current) {
        return;
      }

      hasAutoSavedRef.current = true;

      if (!cardRef.current) {
        setSaveStatus("error");
        return;
      }

      try {
        const dataUrl = await renderCardAsPng(cardRef.current);
        setExportedPng(dataUrl);
        const upload = await uploadCardPrint(cardId, dataUrl);
        setSavedPrintUrl(upload.publicUrl);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [cardId]);

  async function downloadCard() {
    if (!cardRef.current) {
      return;
    }

    setIsExporting(true);
    setExportError(false);

    try {
      const dataUrl = await renderCardAsPng(cardRef.current);
      setExportedPng(dataUrl);
      downloadPng(dataUrl, filename);
    } catch {
      setExportError(true);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(300px,420px)_1fr] lg:items-center">
      <div ref={cardRef}>
        <CardPreview card={card} photo={photo} qrCode={qrCode} />
      </div>

      <div className="grid gap-5">
        <div>
          <p className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-[#8a372c]">
            Card generated
          </p>
          <h2 className="mt-2 text-4xl font-black tracking-normal text-[#171512] sm:text-5xl">
            {card.cardTitle}
          </h2>
          <p className="mt-3 max-w-xl text-lg font-medium leading-8 text-[#4e473d]">
            This is ready for a demo: deterministic card layout, validated identity data,
            uploaded photo input, QR marker, and saved print-ready PNG.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              window.alert("Print queue is coming next. The final card PNG is being saved for printing now.");
            }}
            className="inline-flex h-12 items-center gap-2 rounded-[8px] bg-[#b2392b] px-5 font-bold text-white shadow-lg shadow-[#b2392b]/20 transition hover:bg-[#982f24]"
          >
            <Printer size={18} />
            Print card
          </button>
          <button
            type="button"
            onClick={downloadCard}
            disabled={isExporting}
            className="inline-flex h-12 items-center gap-2 rounded-[8px] bg-[#b2392b] px-5 font-bold text-white shadow-lg shadow-[#b2392b]/20 transition hover:bg-[#982f24] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={18} />
            {isExporting ? "Preparing PNG" : "Download PNG"}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex h-12 items-center gap-2 rounded-[8px] border border-[#2a2925]/20 bg-white/70 px-5 font-bold text-[#2a2925] transition hover:bg-white"
          >
            <RotateCcw size={18} />
            New card
          </button>
        </div>

        <div className="rounded-[8px] border border-[#2a2925]/10 bg-[#fffaf1]/70 p-3 text-sm font-bold text-[#5f574d]">
          {saveStatus === "idle" && "Preparing card print file."}
          {saveStatus === "saving" && "Saving final card PNG to Supabase Storage..."}
          {saveStatus === "saved" && "Final card PNG saved for admin gallery and future print queue."}
          {saveStatus === "error" && "Card generated, but PNG storage failed. Try downloading as backup."}
        </div>

        {exportError && (
          <p className="rounded-[8px] border border-[#b2392b]/30 bg-[#fff3ef] p-3 text-sm font-semibold text-[#8a372c]">
            PNG export hit a browser rendering issue. Try again after the card finishes loading.
          </p>
        )}

        {exportedPng && (
          <div className="rounded-[8px] border border-[#185c54]/20 bg-[#effaf7] p-3">
            <p className="text-sm font-bold text-[#185c54]">
              PNG is ready: {filename}
            </p>
            <a
              href={savedPrintUrl ?? exportedPng}
              download={filename}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-sm font-black text-[#8a372c] underline underline-offset-4"
            >
              Open or save PNG
            </a>
            <img
              src={exportedPng}
              alt="Exported card PNG preview"
              className="mt-3 w-28 rounded-[6px] border border-[#185c54]/20"
            />
          </div>
        )}
      </div>
    </section>
  );
}
