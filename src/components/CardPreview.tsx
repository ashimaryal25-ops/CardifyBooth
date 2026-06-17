"use client";

/* eslint-disable @next/next/no-img-element -- Card photos and QR codes are generated data URLs. */

import type { CardIdentity } from "@/lib/card-schema";
import { gettysburgTheme } from "@/lib/themes";

interface CardPreviewProps {
  card: CardIdentity;
  photo: string;
  qrCode?: string;
}

const rarityStyles: Record<CardIdentity["rarity"], string> = {
  Common: "bg-[#747474] text-white",
  Rare: "bg-[var(--gc-blue)] text-white",
  Epic: "bg-[#4b2e83] text-white",
  Legendary: "bg-[var(--gc-orange)] text-white",
  "Campus Myth": "bg-[var(--gc-black)] text-[var(--gc-sky)]",
};

export function CardPreview({ card, photo, qrCode }: CardPreviewProps) {
  const traitScores = Object.entries(card.stats).filter(([label]) => label !== "Campus Power").slice(0, 3);
  const campusPower = card.stats["Campus Power"];
  const knownFor = card.description
    .replace(/^known for\s+/i, "")
    .replace(/\.$/, "");

  return (
    <article className="w-full max-w-[420px] rounded-[8px] border-[10px] border-[var(--gc-black)] bg-[var(--gc-black)]">
      <div className="rounded-[5px] bg-[#ffffff] p-3">
        <div className="flex items-center justify-between gap-3 border-b-2 border-[var(--gc-black)] pb-2">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--gc-orange)]">
              {gettysburgTheme.eyebrow}
            </p>
            <h2 className="truncate text-3xl font-black uppercase leading-none text-[var(--gc-black)]">
              {card.displayName}
            </h2>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${rarityStyles[card.rarity]}`}>
            {card.rarity}
          </span>
        </div>

        <div className="mt-3 overflow-hidden rounded-[6px] border-4 border-[var(--gc-black)] bg-[#2c2923]">
          <div className="relative aspect-[4/3]">
            <img src={photo} alt={`${card.displayName} card portrait`} className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          {traitScores.map(([label, value]) => (
            <div key={label} className="rounded-[6px] border border-[var(--gc-black)]/20 bg-white/75 p-2">
              <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                <span className="truncate text-xs font-black uppercase tracking-[0.08em] text-[var(--gc-gray)]">
                  {label}
                </span>
                <span className="font-mono text-lg font-black leading-none text-[var(--gc-black)]">{value}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#d8d8d8]">
                <div className="h-full rounded-full bg-[var(--gc-blue)]" style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-[6px] border-2 border-[var(--gc-black)] bg-[var(--gc-sky)] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[var(--gc-blue)]">
              Campus Power
            </p>
            <p className="font-mono text-3xl font-black leading-none text-[var(--gc-black)]">{campusPower}</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#7f4b18]/25">
            <div className="h-full rounded-full bg-[var(--gc-orange)]" style={{ width: `${campusPower}%` }} />
          </div>
        </div>

        <div className="mt-3 rounded-[6px] border border-[var(--gc-black)]/20 bg-white/75 p-3">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[var(--gc-blue)]">
            {card.cardTitle}
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug text-[var(--gc-gray)]">
            {knownFor}.
          </p>
        </div>

        <div className="mt-3 rounded-[6px] border-2 border-[var(--gc-black)] bg-[var(--gc-sky)] p-3">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[var(--gc-blue)]">
            Special Ability
          </p>
          <p className="text-lg font-black text-[var(--gc-black)]">{card.specialAbility}</p>
        </div>

        <div className="mt-3 flex items-end justify-end">
          {qrCode ? (
            <img src={qrCode} alt="QR code for this generated card" className="h-16 w-16 rounded-[4px] bg-white p-1" />
          ) : (
            <div className="h-16 w-16 rounded-[4px] border border-[var(--gc-black)]/20 bg-white/60" />
          )}
        </div>
      </div>
    </article>
  );
}
