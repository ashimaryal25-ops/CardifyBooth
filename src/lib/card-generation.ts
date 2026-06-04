import { cardSchema, type CardIdentity, type CardRequest } from "@/lib/card-schema";
import { createFallbackCard } from "@/lib/fallback-card";
import { gettysburgTheme } from "@/lib/themes";

type GenerationSource = "openai" | "fallback";

export interface CardGenerationResult {
  card: CardIdentity;
  source: GenerationSource;
  model: string;
  durationMs: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  error?: string;
}

const CARD_IDENTITY_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "displayName",
    "cardTitle",
    "type",
    "rarity",
    "stats",
    "specialAbility",
    "description",
    "tagline",
    "colorTheme",
  ],
  properties: {
    displayName: { type: "string" },
    cardTitle: { type: "string" },
    type: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: { type: "string" },
    },
    rarity: {
      type: "string",
      enum: ["Common", "Rare", "Epic", "Legendary", "Campus Myth"],
    },
    stats: {
      type: "object",
      additionalProperties: { type: "integer", minimum: 45, maximum: 99 },
    },
    specialAbility: { type: "string" },
    description: { type: "string" },
    tagline: { type: "string" },
    colorTheme: { type: "string" },
  },
} as const;

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

function buildSystemPrompt() {
  return [
    "You generate collectible campus trading-card identities for CardifyBooth.",
    "Return strict JSON only. Do not include markdown, prose, comments, or code fences.",
    "The app controls card layout, so you only generate the card identity/content.",
    "Use a playful but printable Gettysburg College campus tone.",
    "Avoid insults, sensitive personal attributes, stereotypes, and private information.",
    `Allowed rarities: ${gettysburgTheme.rarities.join(", ")}.`,
    `Good title inspiration: ${gettysburgTheme.titles.join(", ")}.`,
    `Good stat names: ${gettysburgTheme.stats.join(", ")}.`,
    "Stats should be integers from 45 to 99. Include exactly four stats.",
    "Description should be one sentence and start with 'Known for'.",
  ].join("\n");
}

function buildUserPrompt(input: CardRequest) {
  return JSON.stringify({
    task: "Create one Gettysburg Edition CardifyBooth identity.",
    userInput: {
      name: input.name,
      traits: input.traits,
      knownFor: input.knownFor || "campus energy and getting things done",
      theme: input.theme,
    },
    outputRules: {
      displayName: "Use the provided name or nickname exactly, with normal capitalization.",
      cardTitle: "Make it punchy, specific, and under 42 characters.",
      type: "Use 1 to 3 short type labels based on traits.",
      stats: "Exactly four stat fields. Pick from the theme stats when possible.",
      specialAbility: "Short ability name, not a sentence.",
      tagline: "Short memorable line under 44 characters.",
    },
  });
}

function extractOutputText(responseBody: unknown) {
  if (
    responseBody &&
    typeof responseBody === "object" &&
    "output_text" in responseBody &&
    typeof responseBody.output_text === "string"
  ) {
    return responseBody.output_text;
  }

  return null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown generation error.";
}

function createFallbackResult(
  input: CardRequest,
  startedAt: number,
  model: string,
  error?: string,
): CardGenerationResult {
  const card = createFallbackCard(input);
  const outputText = JSON.stringify(card);

  return {
    card,
    source: "fallback",
    model,
    durationMs: Date.now() - startedAt,
    estimatedInputTokens: estimateTokens(JSON.stringify(input)),
    estimatedOutputTokens: estimateTokens(outputText),
    error,
  };
}

export async function generateCard(input: CardRequest): Promise<CardGenerationResult> {
  const startedAt = Date.now();
  const model = process.env.OPENAI_MODEL ?? "gpt-5-mini";
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return createFallbackResult(input, startedAt, "local-fallback", "OPENAI_API_KEY is not configured.");
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(input);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "card_identity",
            schema: CARD_IDENTITY_JSON_SCHEMA,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}.`);
    }

    const data: unknown = await response.json();
    const outputText = extractOutputText(data);

    if (!outputText) {
      throw new Error("OpenAI response did not include output_text.");
    }

    const generated: unknown = JSON.parse(outputText);
    const card = cardSchema.parse(generated);

    return {
      card,
      source: "openai",
      model,
      durationMs: Date.now() - startedAt,
      estimatedInputTokens: estimateTokens(`${systemPrompt}\n${userPrompt}`),
      estimatedOutputTokens: estimateTokens(outputText),
    };
  } catch (error) {
    return createFallbackResult(input, startedAt, model, getErrorMessage(error));
  }
}
