import { cardSchema, type CardIdentity, type CardRequest } from "@/lib/card-schema";

const titles = [
  "The Midnight Builder",
  "The Campus Catalyst",
  "The Deadline Sprinter",
  "The Battlefield Scholar",
  "The Event Architect",
  "The Servo Survivor",
] as const;

const abilities = [
  "Last-Minute Launch",
  "Room-Read Rally",
  "Prototype Burst",
  "Focus Lock",
  "Chaos Control",
  "Campus Signal",
] as const;

const rarities = ["Rare", "Epic", "Legendary", "Campus Myth"] as const;

function score(seed: string, offset: number) {
  const total = [...seed].reduce((sum, char, index) => {
    return sum + char.charCodeAt(0) * (index + 3 + offset);
  }, 0);

  return 68 + (total % 29);
}

export function createFallbackCard(input: CardRequest): CardIdentity {
  const seed = `${input.name}-${input.traits.join("-")}-${input.knownFor ?? ""}`;
  const title = titles[score(seed, 1) % titles.length];
  const ability = abilities[score(seed, 2) % abilities.length];
  const rarity = rarities[score(seed, 3) % rarities.length];
  const primaryTrait = input.traits[0] ?? "Builder";
  const secondaryTrait = input.traits[1] ?? "Campus Energy";

  const card = {
    displayName: input.name,
    cardTitle: title,
    type: [primaryTrait, secondaryTrait],
    rarity,
    stats: {
      Creativity: score(seed, 4),
      Leadership: score(seed, 5),
      Focus: score(seed, 6),
      "Chaos Control": score(seed, 7),
    },
    specialAbility: ability,
    description:
      input.knownFor && input.knownFor.length > 0
        ? `Known for ${input.knownFor.replace(/\.$/, "")}.`
        : `Known for turning ${primaryTrait.toLowerCase()} energy into campus-ready results.`,
    tagline: "Build first. Explain cleanly.",
    colorTheme: "burgundy-teal",
  };

  return cardSchema.parse(card);
}
