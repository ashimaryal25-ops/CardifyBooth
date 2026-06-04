"use client";

import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { gettysburgTheme } from "@/lib/themes";
import type { CardRequest } from "@/lib/card-schema";

interface CardFormProps {
  isGenerating: boolean;
  onSubmit: (request: CardRequest) => void;
}

export function CardForm({ isGenerating, onSubmit }: CardFormProps) {
  const [name, setName] = useState("");
  const [traits, setTraits] = useState<string[]>(["Builder", "Creative"]);
  const [knownFor, setKnownFor] = useState("");

  const canSubmit = useMemo(() => name.trim().length > 0 && traits.length > 0, [name, traits]);

  function toggleTrait(trait: string) {
    setTraits((current) => {
      if (current.includes(trait)) {
        return current.filter((item) => item !== trait);
      }

      if (current.length >= 3) {
        return [current[1], current[2], trait].filter(Boolean);
      }

      return [...current, trait];
    });
  }

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) {
          return;
        }

        onSubmit({
          name,
          theme: gettysburgTheme.id,
          traits,
          knownFor,
        });
      }}
    >
      <div className="grid gap-2">
        <label htmlFor="name" className="text-sm font-bold uppercase tracking-[0.18em] text-[#6d3129]">
          Name or nickname
        </label>
        <input
          id="name"
          value={name}
          maxLength={28}
          onChange={(event) => setName(event.target.value)}
          placeholder="Aryan"
          className="h-13 rounded-[8px] border border-[#2a2925]/15 bg-white/75 px-4 text-lg font-semibold text-[#1b1a17] shadow-inner placeholder:text-[#827869]"
        />
      </div>

      <div className="grid gap-2">
        <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#6d3129]">
          Theme
        </span>
        <div className="rounded-[8px] border border-[#2a2925]/15 bg-[#fffaf1]/80 p-4">
          <p className="font-bold text-[#1b1a17]">{gettysburgTheme.name}</p>
          <p className="mt-1 text-sm text-[#5f574d]">Campus chaos, builder energy, and battlefield lore.</p>
        </div>
      </div>

      <div className="grid gap-3">
        <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#6d3129]">
          Pick 2-3 traits
        </span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {gettysburgTheme.traits.map((trait) => {
            const selected = traits.includes(trait);

            return (
              <button
                type="button"
                key={trait}
                onClick={() => toggleTrait(trait)}
                className={`min-h-11 rounded-[8px] border px-3 text-sm font-semibold transition ${
                  selected
                    ? "border-[#185c54] bg-[#185c54] text-white"
                    : "border-[#2a2925]/15 bg-white/65 text-[#2a2925] hover:bg-white"
                }`}
              >
                {trait}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="known-for" className="text-sm font-bold uppercase tracking-[0.18em] text-[#6d3129]">
          Known for
        </label>
        <textarea
          id="known-for"
          value={knownFor}
          maxLength={120}
          onChange={(event) => setKnownFor(event.target.value)}
          placeholder="turning unfinished ideas into working demos before the deadline"
          className="min-h-24 resize-none rounded-[8px] border border-[#2a2925]/15 bg-white/75 px-4 py-3 text-base font-medium text-[#1b1a17] shadow-inner placeholder:text-[#827869]"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit || isGenerating}
        className="inline-flex h-13 items-center justify-center gap-2 rounded-[8px] bg-[#b2392b] px-5 font-bold text-white shadow-lg shadow-[#b2392b]/20 transition hover:bg-[#982f24] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Sparkles size={18} />
        {isGenerating ? "Generating card" : "Generate card"}
      </button>
    </form>
  );
}
