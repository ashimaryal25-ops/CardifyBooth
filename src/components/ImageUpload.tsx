"use client";

/* eslint-disable @next/next/no-img-element -- Uploaded images are data URLs, not static Next images. */

import { ImageUp, RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useRef } from "react";

interface ImageUploadProps {
  photo: string | null;
  onUpload: (photo: string) => void;
  onChooseAnother: () => void;
}

function createSamplePortrait() {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;

  const context = canvas.getContext("2d");
  if (!context) {
    return "";
  }

  context.fillStyle = "#201f1d";
  context.fillRect(0, 0, 800, 600);
  context.fillStyle = "#3b332b";
  context.fillRect(0, 410, 800, 190);
  context.fillStyle = "#b2392b";
  context.globalAlpha = 0.78;
  context.fillRect(60, 108, 168, 146);
  context.fillStyle = "#f2c15f";
  context.fillRect(560, 86, 174, 152);
  context.globalAlpha = 1;

  context.fillStyle = "#d6ad7c";
  context.beginPath();
  context.arc(400, 205, 90, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#171512";
  context.beginPath();
  context.ellipse(400, 155, 104, 62, -0.1, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#185c54";
  context.beginPath();
  context.moveTo(252, 560);
  context.bezierCurveTo(274, 423, 338, 342, 400, 342);
  context.bezierCurveTo(462, 342, 526, 423, 548, 560);
  context.closePath();
  context.fill();

  context.fillStyle = "#f8efe0";
  context.font = "700 34px Arial";
  context.textAlign = "center";
  context.fillText("GETTYSBURG", 400, 82);

  return canvas.toDataURL("image/png");
}

export function ImageUpload({ photo, onUpload, onChooseAnother }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          onUpload(reader.result);
        }
      };
      reader.readAsDataURL(file);
      event.target.value = "";
    },
    [onUpload],
  );

  if (photo) {
    return (
      <section className="grid gap-5">
        <div className="overflow-hidden rounded-[8px] border border-[#2a2925]/15 bg-[#151414] shadow-2xl">
          <img
            src={photo}
            alt="Uploaded booth portrait"
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
        <button
          type="button"
          onClick={onChooseAnother}
          className="inline-flex h-12 w-fit items-center gap-2 rounded-[8px] border border-[#2a2925]/20 bg-white/70 px-5 font-semibold text-[#2a2925] transition hover:bg-white"
        >
          <RefreshCw size={18} />
          Choose another
        </button>
      </section>
    );
  }

  return (
    <section className="grid gap-5">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group grid min-h-[360px] place-items-center rounded-[8px] border-2 border-dashed border-[#2a2925]/20 bg-[#fffaf1]/75 p-8 text-center shadow-sm transition hover:border-[#185c54]/45 hover:bg-[#fffaf1]"
      >
        <span className="grid justify-items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-[8px] bg-[#185c54] text-white shadow-lg shadow-[#185c54]/20 transition group-hover:bg-[#124940]">
            <ImageUp size={30} />
          </span>
          <span className="text-2xl font-black text-[#171512]">Upload a photo</span>
          <span className="max-w-sm text-base font-medium leading-7 text-[#5f574d]">
            Choose a portrait from your device. This image becomes the main card photo.
          </span>
        </span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => {
          const portrait = createSamplePortrait();
          if (portrait) {
            onUpload(portrait);
          }
        }}
        className="inline-flex h-12 w-fit items-center gap-2 rounded-[8px] border border-[#2a2925]/20 bg-white/70 px-5 font-semibold text-[#2a2925] transition hover:bg-white"
      >
        <Sparkles size={18} />
        Use sample photo
      </button>
    </section>
  );
}
