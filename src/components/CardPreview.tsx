"use client";

/* eslint-disable @next/next/no-img-element -- Card photos and QR codes are generated data URLs. */

import { gettysburgTheme } from "@/lib/themes";
import type { CardIdentity } from "@/lib/card-schema";

interface CardPreviewProps {
  card: CardIdentity;
  photo: string;
  qrCode?: string;
}

const rarityStyles: Record<CardIdentity["rarity"], string> = {
  Common: "bg-[#6e7563] text-white",
  Rare: "bg-[#185c54] text-white",
  Epic: "bg-[#6d3b8f] text-white",
  Legendary: "bg-[#b2392b] text-white",
  "Campus Myth": "bg-[#171512] text-[#f2c15f]",
};

export function CardPreview({ card, photo, qrCode }: CardPreviewProps) {
  const stats = Object.entries(card.stats).slice(0, 4);

  return (
    <article className="w-full max-w-[420px] rounded-[8px] border-[10px] border-[#171512] bg-[#171512] shadow-2xl">
      <div className="rounded-[5px] bg-[#f8efe0] p-3">
        <div className="flex items-center justify-between gap-3 border-b-2 border-[#171512] pb-2">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a372c]">
              {gettysburgTheme.eyebrow}
            </p>
            <h2 className="truncate text-3xl font-black uppercase leading-none text-[#171512]">
              {card.displayName}
            </h2>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${rarityStyles[card.rarity]}`}>
            {card.rarity}
          </span>
        </div>

        <div className="mt-3 overflow-hidden rounded-[6px] border-4 border-[#171512] bg-[#2c2923]">
          <div className="relative aspect-[4/3]">
            <img src={photo} alt={`${card.displayName} card portrait`} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-14">
              <p className="text-xl font-black text-white">{card.cardTitle}</p>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f2c15f]">
                {card.type.join(" / ")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-[6px] border border-[#171512]/20 bg-white/70 p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-bold uppercase text-[#5f574d]">{label}</span>
                <span className="font-mono text-lg font-black text-[#171512]">{value}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#d8cbb7]">
                <div className="h-full rounded-full bg-[#185c54]" style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-[6px] border-2 border-[#171512] bg-[#f2c15f] p-3">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#6d3129]">
            Special Ability
          </p>
          <p className="text-lg font-black text-[#171512]">{card.specialAbility}</p>
          <p className="mt-1 text-sm font-semibold leading-snug text-[#3f382f]">{card.description}</p>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="max-w-[240px] text-sm font-black uppercase leading-tight text-[#171512]">
            {card.tagline}
          </p>
          {qrCode ? (
            <img src={qrCode} alt="QR code for this generated card" className="h-16 w-16 rounded-[4px] bg-white p-1" />
          ) : (
            <div className="h-16 w-16 rounded-[4px] border border-[#171512]/20 bg-white/60" />
          )}
        </div>
      </div>
    </article>
  );
}
