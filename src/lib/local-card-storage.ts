import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { CardIdentity } from "@/lib/card-schema";
import {
  insertLocalCardRecord,
  type LocalCardRecord,
} from "@/lib/local-card-db";

const storageRoot = path.join(process.cwd(), ".booth-storage");
const cardsDir = path.join(storageRoot, "cards");
const pngDataUrlPrefix = "data:image/png;base64,";
const maxPngBytes = 12 * 1024 * 1024;

function decodePngDataUrl(dataUrl: string) {
  const base64 = dataUrl.slice(pngDataUrlPrefix.length);
  const buffer = Buffer.from(base64, "base64");
  const hasPngSignature =
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  if (!hasPngSignature) {
    throw new Error("Saved card output must be a PNG image.");
  }

  if (buffer.length > maxPngBytes) {
    throw new Error("Saved card output is too large.");
  }

  return buffer;
}

function getTraitScores(card: CardIdentity) {
  return Object.fromEntries(
    Object.entries(card.stats).filter(([label]) => label !== "Campus Power"),
  );
}

function getKnownFor(card: CardIdentity) {
  return card.description
    .replace(/^known for\s+/i, "")
    .replace(/\.$/, "");
}

export async function saveLocalCard(params: {
  id: string;
  card: CardIdentity;
  imageDataUrl: string;
}) {
  await mkdir(cardsDir, { recursive: true });

  const pngBuffer = decodePngDataUrl(params.imageDataUrl);

  const cardPngPath = `cards/${params.id}.png`;
  const absolutePngPath = path.join(storageRoot, cardPngPath);

  await writeFile(absolutePngPath, pngBuffer);

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

  const record: LocalCardRecord = {
    id: params.id,
    displayName: params.card.displayName,
    rarity: params.card.rarity,
    traitScores: getTraitScores(params.card),
    campusPower: params.card.stats["Campus Power"],
    knownFor: getKnownFor(params.card),
    specialAbility: params.card.specialAbility,
    cardPngPath,
    cardUrl: `/local-cards/${params.id}`,
    printStatus: "not_requested",
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  insertLocalCardRecord(record);

  return record;
}
