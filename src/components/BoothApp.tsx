"use client";

import { ArrowLeft, BadgeCheck, ImageUp, ScanLine, Sparkles } from "lucide-react";
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
  name: "Aryan",
  theme: "gettysburg",
  traits: ["Builder", "Creative", "Clutch"],
  knownFor: "turning unfinished ideas into working demos before the deadline",
});

const samplePhoto =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
    <rect width="800" height="600" fill="#26231f"/>
    <circle cx="400" cy="210" r="92" fill="#d8b98d"/>
    <path d="M240 540c25-130 97-205 160-205s135 75 160 205" fill="#185c54"/>
    <rect x="0" y="455" width="800" height="145" fill="#3a312a"/>
    <path d="M80 120h180l-36 160H44z" fill="#b2392b" opacity=".78"/>
    <path d="M540 90h180l36 160H576z" fill="#f2c15f" opacity=".76"/>
  </svg>`);

export function BoothApp() {
  const [step, setStep] = useState<Step>("choose");
  const [photo, setPhoto] = useState<string | null>(null);
  const [card, setCard] = useState<CardIdentity | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>("");

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
  }, []);

  const resetToChooser = useCallback(() => {
    setStep("choose");
    setPhoto(null);
    setCard(null);
    setCardId(null);
    setQrCode("");
  }, []);

  const handleGenerate = useCallback(
    async (request: CardRequest) => {
      if (!photo) {
        return;
      }

      setStep("generating");
      const generated = await generateCardIdentity(request);
      setCard(generated.card);
      setCardId(generated.cardId);

      const qrPayload = generated.cardId
        ? `${window.location.origin}/cards/${generated.cardId}`
        : [
            "CardifyBooth Gettysburg Edition",
            generated.card.displayName,
            generated.card.cardTitle,
            generated.card.rarity,
          ].join(" | ");

      const qr = await QRCode.toDataURL(qrPayload, {
        margin: 1,
        width: 180,
        color: {
          dark: "#171512",
          light: "#fffaf1",
        },
      });

      setQrCode(qr);
      setStep("reveal");
    },
    [photo],
  );

  return (
    <main className="min-h-screen px-4 py-5 text-[#171512] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-[#2a2925]/10 bg-[#fffaf1]/70 px-4 py-3 shadow-sm backdrop-blur">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#8a372c]">
              CardifyBooth
            </p>
            <h1 className="text-2xl font-black tracking-normal text-[#171512]">
              Gettysburg Edition
            </h1>
          </div>

          {progress ? (
            <div className="flex items-center gap-2 text-sm font-bold text-[#5f574d]">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#185c54] text-white">
                {progress}
              </span>
              <span>of 3</span>
            </div>
          ) : (
            <span className="rounded-full bg-[#185c54]/10 px-3 py-1.5 text-sm font-black text-[#185c54]">
              Choose mode
            </span>
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
            className="inline-flex w-fit items-center gap-2 rounded-[8px] border border-[#2a2925]/15 bg-white/65 px-3 py-2 text-sm font-bold text-[#2a2925] hover:bg-white"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}

        {step === "choose" && (
          <section className="grid gap-7 py-6 lg:grid-cols-[1fr_1fr]">
            <button
              type="button"
              onClick={() => setStep("cardSetup")}
              className="group min-h-[360px] rounded-[8px] border border-[#2a2925]/10 bg-[#fffaf1]/75 p-6 text-left shadow-sm transition hover:-translate-y-1 hover:bg-[#fffaf1] hover:shadow-xl"
            >
              <div className="grid h-14 w-14 place-items-center rounded-[8px] bg-[#b2392b] text-white">
                <ImageUp size={28} />
              </div>
              <p className="mt-8 font-mono text-sm font-black uppercase tracking-[0.22em] text-[#8a372c]">
                Trading card mode
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-normal text-[#171512] sm:text-5xl">
                Card Booth
              </h2>
              <p className="mt-4 max-w-xl text-lg font-medium leading-8 text-[#5f574d]">
                Upload a photo, enter traits, generate a Gettysburg trading-card identity,
                render the card, then save the print-ready PNG.
              </p>
              <span className="mt-8 inline-flex rounded-[8px] bg-[#b2392b] px-5 py-3 font-black text-white transition group-hover:bg-[#982f24]">
                Open card generator
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStep("collage")}
              className="group min-h-[360px] rounded-[8px] border border-[#2a2925]/10 bg-[#fffaf1]/75 p-6 text-left shadow-sm transition hover:-translate-y-1 hover:bg-[#fffaf1] hover:shadow-xl"
            >
              <div className="grid h-14 w-14 place-items-center rounded-[8px] bg-[#185c54] text-white">
                <BadgeCheck size={28} />
              </div>
              <p className="mt-8 font-mono text-sm font-black uppercase tracking-[0.22em] text-[#185c54]">
                Collage side
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-normal text-[#171512] sm:text-5xl">
                Photo Collage
              </h2>
              <p className="mt-4 max-w-xl text-lg font-medium leading-8 text-[#5f574d]">
                Placeholder for the other team&apos;s collage flow. This button proves
                the app can route to both experiences from one kiosk entry point.
              </p>
              <span className="mt-8 inline-flex rounded-[8px] border border-[#185c54]/25 bg-[#185c54]/10 px-5 py-3 font-black text-[#185c54]">
                Placeholder only
              </span>
            </button>
          </section>
        )}

        {step === "collage" && (
          <section className="grid min-h-[60vh] place-items-center rounded-[8px] border border-[#2a2925]/10 bg-[#fffaf1]/75 p-8 text-center">
            <div className="max-w-2xl">
              <p className="font-mono text-sm font-black uppercase tracking-[0.22em] text-[#185c54]">
                Photo Collage
              </p>
              <h2 className="mt-4 text-5xl font-black tracking-normal text-[#171512]">
                Collage placeholder
              </h2>
              <p className="mt-4 text-lg font-medium leading-8 text-[#5f574d]">
                This section intentionally does nothing yet. The card generator is the
                active build area, and the collage team can plug their flow in here later.
              </p>
            </div>
          </section>
        )}

        {step === "cardSetup" && (
          <section className="grid gap-7 lg:grid-cols-[minmax(320px,560px)_1fr]">
            <div className="grid gap-5">
              <div>
                <p className="font-mono text-sm font-black uppercase tracking-[0.24em] text-[#8a372c]">
                  Card generator
                </p>
                <h2 className="mt-2 text-4xl font-black tracking-normal text-[#171512]">
                  Upload photo, then fill the card details.
                </h2>
              </div>
              <ImageUpload
                photo={photo}
                onUpload={setPhoto}
                onChooseAnother={() => setPhoto(null)}
              />
            </div>

            {photo ? (
              <div className="rounded-[8px] border border-[#2a2925]/10 bg-[#fffaf1]/70 p-5 shadow-sm">
                <CardForm isGenerating={false} onSubmit={handleGenerate} />
              </div>
            ) : (
              <aside className="rounded-[8px] border border-[#2a2925]/10 bg-[#fffaf1]/70 p-5">
                <ScanLine className="text-[#185c54]" size={28} />
                <h2 className="mt-4 text-3xl font-black tracking-normal">Image first.</h2>
                <p className="mt-3 text-base font-medium leading-7 text-[#5f574d]">
                  Once the image is uploaded, the name, traits, and known-for form will
                  appear on this same page.
                </p>
                <div className="mt-5">
                  <CardPreview card={sampleCard} photo={samplePhoto} />
                </div>
              </aside>
            )}
          </section>
        )}

        {step === "generating" && (
          <section className="grid min-h-[60vh] place-items-center text-center">
            <div className="max-w-lg">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#185c54] text-white shadow-xl shadow-[#185c54]/20">
                <Sparkles className="animate-pulse" size={34} />
              </div>
              <h2 className="mt-5 text-4xl font-black tracking-normal">Building the card</h2>
              <p className="mt-3 text-lg font-medium leading-8 text-[#5f574d]">
                Validating the identity, assigning stats, and preparing the QR marker.
              </p>
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
