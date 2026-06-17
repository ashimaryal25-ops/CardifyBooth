"use client";

/* eslint-disable @next/next/no-img-element -- Export preview is a generated PNG data URL. */

import { Download, Printer, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { downloadPng, makeCardFilename, renderCardAsPng } from "@/lib/export-card";
import type { CardIdentity } from "@/lib/card-schema";
import { CardPreview } from "@/components/CardPreview";
import { saveLocalCardPrint } from "@/lib/save-local-card";

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
  const [savedCardUrl, setSavedCardUrl] = useState<string | null>(null);
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
        const saved = await saveLocalCardPrint({
          id: cardId,
          card,
          imageDataUrl: dataUrl,
        });
        setSavedCardUrl(saved.record.cardUrl);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [card, cardId]);

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
    <section className="grid gap-5 lg:grid-cols-[minmax(300px,420px)_1fr] lg:items-start">
      <div ref={cardRef} className="justify-self-center lg:justify-self-start">
        <CardPreview card={card} photo={photo} qrCode={qrCode} />
      </div>

      <div className="grid gap-4 rounded-[8px] border border-[var(--gc-black)]/14 bg-[#ffffff] p-4">
        <div className="border-b border-[var(--gc-black)]/12 pb-3">
          <h2 className="text-xl font-black tracking-normal text-[var(--gc-black)]">
            {card.displayName} card generated
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--gc-gray)]">
            Final PNG is saved locally for printing and QR access.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              window.alert("Print queue is coming next. The final card PNG is being saved for printing now.");
            }}
            className="inline-flex h-10 items-center gap-2 rounded-[6px] bg-[var(--gc-orange)] px-3 text-sm font-bold text-white transition hover:bg-[#a43e00]"
          >
            <Printer size={18} />
            Print card
          </button>
          <button
            type="button"
            onClick={downloadCard}
            disabled={isExporting}
            className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[var(--gc-orange)] bg-white px-3 text-sm font-bold text-[var(--gc-orange)] transition hover:bg-[#fff4ec] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={18} />
            {isExporting ? "Preparing PNG" : "Download PNG"}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[var(--gc-black)]/22 bg-white px-3 text-sm font-bold text-[var(--gc-black)] transition hover:bg-[var(--gc-alabaster)]"
          >
            <RotateCcw size={18} />
            New card
          </button>
        </div>

        <div className="rounded-[6px] border border-[var(--gc-black)]/12 bg-white p-3 text-sm font-semibold text-[var(--gc-gray)]">
          {saveStatus === "idle" && "Preparing card print file."}
          {saveStatus === "saving" && "Saving final card PNG locally..."}
          {saveStatus === "saved" && "Final card PNG saved locally for QR access and printing."}
          {saveStatus === "error" && "Card generated, but local PNG storage failed. Try downloading as backup."}
        </div>

        {exportError && (
          <p className="rounded-[6px] border border-[var(--gc-orange)]/30 bg-[#fff4ec] p-3 text-sm font-semibold text-[var(--gc-orange)]">
            PNG export hit a browser rendering issue. Try again after the card finishes loading.
          </p>
        )}

        {exportedPng && (
          <div className="rounded-[6px] border border-[var(--gc-blue)]/20 bg-[#f0f9ff] p-3">
            <p className="text-sm font-bold text-[var(--gc-blue)]">
              PNG is ready: {filename}
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {savedCardUrl && (
                <a
                  href={savedCardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm font-black text-[var(--gc-blue)] underline underline-offset-4"
                >
                  Open saved card page
                </a>
              )}
              <a
                href={exportedPng}
                download={filename}
                className="inline-flex text-sm font-black text-[var(--gc-orange)] underline underline-offset-4"
              >
                Download PNG
              </a>
            </div>
            <img
              src={exportedPng}
              alt="Exported card PNG preview"
              className="mt-3 w-28 rounded-[6px] border border-[var(--gc-blue)]/20"
            />
          </div>
        )}
      </div>
    </section>
  );
}
