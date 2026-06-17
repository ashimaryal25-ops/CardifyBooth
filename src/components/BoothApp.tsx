"use client";

import { ArrowLeft, ArrowRight, Camera, Landmark } from "lucide-react";
import QRCode from "qrcode";
import { useCallback, useMemo, useState } from "react";
import { CardForm } from "@/components/CardForm";
import { CardPreview } from "@/components/CardPreview";
import { CardReveal } from "@/components/CardReveal";
import { ImageUpload } from "@/components/ImageUpload";
import type { CardIdentity, CardRequest } from "@/lib/card-schema";
import { createFallbackCard } from "@/lib/fallback-card";
import { generateCardIdentity } from "@/lib/generate-card";

type Step = "choose" | "cardSetup" | "generating" | "reveal" | "collage";

const sampleCard = createFallbackCard({
  name: "Ashim",
  theme: "gettysburg",
  selfDescription: "I build quick prototypes and help my team finish under pressure.",
});

const samplePhoto =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
    <rect width="800" height="600" fill="#222222"/>
    <circle cx="400" cy="210" r="92" fill="#d8b98d"/>
    <path d="M240 540c25-130 97-205 160-205s135 75 160 205" fill="#043371"/>
    <rect x="0" y="455" width="800" height="145" fill="#3a312a"/>
    <path d="M80 120h180l-36 160H44z" fill="#cc4e00" opacity=".78"/>
    <path d="M540 90h180l36 160H576z" fill="#8fdbff" opacity=".76"/>
  </svg>`);

export function BoothApp() {
  const [step, setStep] = useState<Step>("choose");
  const [photo, setPhoto] = useState<string | null>(null);
  const [card, setCard] = useState<CardIdentity | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [isSampleCardOpen, setIsSampleCardOpen] = useState(false);

  const progress = useMemo(() => {
    const steps: Step[] = ["cardSetup", "generating", "reveal"];
    const index = steps.indexOf(step);

    return index === -1 ? null : index + 1;
  }, [step]);

  const resetCardFlow = useCallback(() => {
    setStep("cardSetup");
    setPhoto(null);
    setCard(null);
    setCardId(null);
    setQrCode("");
    setIsSampleCardOpen(false);
  }, []);

  const resetToChooser = useCallback(() => {
    setStep("choose");
    setPhoto(null);
    setCard(null);
    setCardId(null);
    setQrCode("");
    setIsSampleCardOpen(false);
  }, []);

  const handleGenerate = useCallback(
    async (request: CardRequest) => {
      if (!photo) {
        return;
      }

      const startedAt = performance.now();
      setStep("generating");
      const generated = await generateCardIdentity(request);
      setCard(generated.card);
      setCardId(generated.cardId);

      const qrPayload = generated.cardId
        ? `${window.location.origin}/local-cards/${generated.cardId}`
        : [
            "CardifyBooth Gettysburg College Edition",
            generated.card.displayName,
            generated.card.cardTitle,
            generated.card.rarity,
          ].join(" | ");

      const qr = await QRCode.toDataURL(qrPayload, {
        margin: 1,
        width: 180,
        color: {
          dark: "#222222",
          light: "#ffffff",
        },
      });

      const elapsed = performance.now() - startedAt;
      if (elapsed < 1200) {
        await new Promise((resolve) => setTimeout(resolve, 1200 - elapsed));
      }

      setQrCode(qr);
      setStep("reveal");
    },
    [photo],
  );

  return (
    <main className={`min-h-screen px-4 py-5 text-[var(--gc-black)] sm:px-6 lg:px-8 ${step === "choose" ? "choice-stage" : "bg-transparent"}`}>
      <div className={`mx-auto grid max-w-6xl gap-4 ${step === "choose" ? "min-h-[calc(100vh-2.5rem)] content-center" : ""}`}>
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-[#d7c9bb] bg-[#fffdf9] px-5 py-4 shadow-[0_2px_8px_rgba(34,34,34,0.06)]">
          <div>
            <h1 className="text-xl font-black tracking-normal text-[var(--gc-black)]">CardifyBooth</h1>
            <p className="text-sm font-semibold text-[var(--gc-gray)]">Gettysburg College photo card station</p>
          </div>

          {progress && (
            <div className="text-sm font-bold text-[var(--gc-gray)]">
              Step {progress} of 3
            </div>
          )}
        </header>

        {step !== "choose" && step !== "reveal" && (
          <button
            type="button"
            onClick={() => {
              if (step === "collage") {
                setStep("choose");
                return;
              }

              resetToChooser();
            }}
            className="inline-flex w-fit items-center gap-2 rounded-[6px] border border-[var(--gc-black)]/18 bg-[#ffffff] px-3 py-2 text-sm font-bold text-[var(--gc-black)] hover:bg-white"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}

        {step === "choose" && (
          <section className="grid gap-4 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setStep("cardSetup")}
                className="grid min-h-[285px] overflow-hidden rounded-[8px] border-2 border-[var(--gc-orange)] bg-white text-left shadow-[0_2px_8px_rgba(34,34,34,0.08)] transition-colors hover:bg-[#fff7f1] focus-visible:outline-[var(--gc-orange)]"
              >
                <span className="grid content-start gap-5 p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[6px] border border-[var(--gc-orange)]/28 bg-[#fff1e7] text-[var(--gc-orange)]">
                    <Camera size={30} strokeWidth={2.2} />
                  </span>
                  <span>
                    <span className="block text-3xl font-black tracking-normal text-[var(--gc-black)]">
                      Trading Card
                    </span>
                    <span className="mt-3 block max-w-md text-base font-semibold leading-7 text-[var(--gc-gray)]">
                      Take a portrait and create a personalized card.
                    </span>
                  </span>
                </span>
                <span className="mt-auto flex items-center justify-between border-t border-[var(--gc-orange)]/30 bg-[var(--gc-orange)] px-6 py-4 text-base font-black text-white">
                  Start card
                  <ArrowRight size={19} />
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStep("collage")}
                className="grid min-h-[285px] overflow-hidden rounded-[8px] border-2 border-[var(--gc-blue)] bg-white text-left shadow-[0_2px_8px_rgba(34,34,34,0.08)] transition-colors hover:bg-[#f2f7fc] focus-visible:outline-[var(--gc-blue)]"
              >
                <span className="grid content-start gap-5 p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[6px] border border-[var(--gc-blue)]/26 bg-[#eef6ff] text-[var(--gc-blue)]">
                    <Landmark size={30} strokeWidth={2.2} />
                  </span>
                  <span>
                    <span className="block text-3xl font-black tracking-normal text-[var(--gc-black)]">
                      Photo Collage
                    </span>
                    <span className="mt-3 block max-w-md text-base font-semibold leading-7 text-[var(--gc-gray)]">
                      Build a multi-photo keepsake print.
                    </span>
                  </span>
                </span>
                <span className="mt-auto flex items-center justify-between border-t border-[var(--gc-blue)]/30 bg-[var(--gc-blue)] px-6 py-4 text-base font-black text-white">
                  Start collage
                  <ArrowRight size={19} />
                </span>
              </button>
            </div>
          </section>
        )}

        {step === "collage" && (
          <section className="grid gap-4">
            <div className="rounded-[8px] border border-[var(--gc-black)]/14 bg-[#ffffff] p-4">
              <h2 className="text-xl font-black tracking-normal text-[var(--gc-black)]">Photo Collage</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--gc-gray)]">
                This option is reserved for the multi-photo printout.
              </p>
            </div>
          </section>
        )}

        {step === "cardSetup" && (
          <section className={photo ? "grid items-start gap-5 lg:grid-cols-[minmax(360px,1fr)_420px]" : "grid gap-5"}>
            <div className="grid gap-5 rounded-[8px] border border-[#d7c9bb] bg-white p-5">
              <div>
                <h2 className="text-2xl font-black tracking-normal text-[var(--gc-black)]">Take a photo</h2>
                <p className="mt-1 text-sm font-semibold text-[var(--gc-gray)]">
                  Capture the portrait, then fill out the card details.
                </p>
              </div>
              <ImageUpload
                photo={photo}
                onUpload={setPhoto}
                onChooseAnother={() => setPhoto(null)}
                onViewSample={() => setIsSampleCardOpen(true)}
              />
            </div>

            {photo && (
              <div className="rounded-[8px] border border-[var(--gc-black)]/14 bg-[#ffffff] p-4">
                <CardForm isGenerating={false} onSubmit={handleGenerate} />
              </div>
            )}
          </section>
        )}

        {isSampleCardOpen && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-[rgba(34,34,34,0.48)] p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Sample card"
          >
            <div className="max-h-[92vh] w-full max-w-md overflow-auto rounded-[8px] border border-[#d7c9bb] bg-white p-4 shadow-[0_8px_24px_rgba(34,34,34,0.18)]">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-lg font-black text-[var(--gc-black)]">Sample card</h2>
                <button
                  type="button"
                  onClick={() => setIsSampleCardOpen(false)}
                  className="rounded-[6px] border border-[var(--gc-black)]/18 bg-white px-3 py-2 text-sm font-bold text-[var(--gc-black)] hover:bg-[var(--gc-alabaster)]"
                >
                  Close
                </button>
              </div>
              <div className="mx-auto max-w-[320px]">
                <CardPreview card={sampleCard} photo={samplePhoto} />
              </div>
            </div>
          </div>
        )}

        {step === "generating" && (
          <section className="grid min-h-[55vh] place-items-center">
            <div className="grid w-full max-w-md gap-5 rounded-[8px] border border-[var(--gc-black)]/14 bg-[#ffffff] p-5 shadow-[0_2px_8px_rgba(34,34,34,0.06)]">
              <div>
                <h2 className="text-2xl font-black tracking-normal">Making your card</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-[var(--gc-gray)]">
                  Hold tight. Your card is being prepared.
                </p>
              </div>

              <div className="card-build-preview" aria-hidden="true">
                <div className="card-build-topline" />
                <div className="card-build-photo">
                  <div className="card-build-scan" />
                </div>
                <div className="grid gap-2">
                  <div className="card-build-bar w-[78%]" />
                  <div className="card-build-bar w-[58%]" />
                  <div className="card-build-bar w-[68%]" />
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[#ded7ce]">
                <div className="card-build-progress h-full w-1/2 rounded-full bg-[var(--gc-orange)]" />
              </div>
            </div>
          </section>
        )}

        {step === "reveal" && card && photo && (
          <CardReveal
            card={card}
            cardId={cardId}
            photo={photo}
            qrCode={qrCode}
            onRestart={resetCardFlow}
          />
        )}
      </div>
    </main>
  );
}
