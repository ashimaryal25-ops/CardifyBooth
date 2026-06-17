"use client";

import { useMemo, useState } from "react";
import { gettysburgTheme } from "@/lib/themes";
import type { CardRequest } from "@/lib/card-schema";

interface CardFormProps {
  isGenerating: boolean;
  onSubmit: (request: CardRequest) => void;
}

export function CardForm({ isGenerating, onSubmit }: CardFormProps) {
  const [name, setName] = useState("");
  const [selfDescription, setSelfDescription] = useState("");

  const canSubmit = useMemo(
    () => name.trim().length > 0 && selfDescription.trim().length >= 8,
    [name, selfDescription],
  );

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) {
          return;
        }

        onSubmit({
          name,
          theme: gettysburgTheme.id,
          selfDescription,
        });
      }}
    >
      <div className="grid gap-2">
        <label htmlFor="name" className="text-sm font-bold text-[var(--gc-black)]">
          Name or nickname
        </label>
        <input
          id="name"
          value={name}
          maxLength={28}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ashim"
          className="h-12 rounded-[6px] border border-[var(--gc-black)]/20 bg-white px-3 text-base font-semibold text-[#1b1a17] placeholder:text-[var(--gc-gray)]"
        />
      </div>

      <div className="flex items-center justify-between gap-4 border-y border-[var(--gc-black)]/12 py-3">
        <span className="text-sm font-bold text-[var(--gc-black)]">Theme</span>
        <span className="text-sm font-semibold text-[var(--gc-gray)]">{gettysburgTheme.name}</span>
      </div>

      <div className="grid gap-2">
        <label htmlFor="self-description" className="text-sm font-bold text-[var(--gc-black)]">
          Describe yourself in 1-2 sentences
        </label>
        <textarea
          id="self-description"
          value={selfDescription}
          maxLength={220}
          onChange={(event) => setSelfDescription(event.target.value)}
          placeholder="I build quick prototypes and help my team finish under pressure."
          className="min-h-28 resize-none rounded-[6px] border border-[var(--gc-black)]/20 bg-white px-3 py-3 text-base font-medium text-[#1b1a17] placeholder:text-[var(--gc-gray)]"
        />
        <p className="text-sm leading-6 text-[var(--gc-gray)]">
          This text is used for the trait scores, card title, Known For line, and special ability.
        </p>
      </div>

      <button
        type="submit"
        disabled={!canSubmit || isGenerating}
        className="inline-flex h-11 items-center justify-center rounded-[6px] bg-[var(--gc-orange)] px-4 text-sm font-bold text-white transition hover:bg-[#a43e00] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isGenerating ? "Generating card" : "Generate card"}
      </button>
    </form>
  );
}
