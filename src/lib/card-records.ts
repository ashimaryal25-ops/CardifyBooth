import type { CardIdentity, CardRequest } from "@/lib/card-schema";
import type { CardGenerationResult } from "@/lib/card-generation";
import { getSupabaseAdmin } from "@/lib/supabase-server";

interface SaveCardGenerationInput {
  request: CardRequest;
  generation: CardGenerationResult;
}

export async function saveCardGeneration({ request, generation }: SaveCardGenerationInput) {
  const supabase = getSupabaseAdmin();
  const card: CardIdentity = generation.card;

  const { data, error } = await supabase
    .from("card_generations")
    .insert({
      event_id: null,
      display_name: card.displayName,
      card_title: card.cardTitle,
      rarity: card.rarity,
      traits: request.traits,
      stats: card.stats,
      special_ability: card.specialAbility,
      description: card.description,
      tagline: card.tagline,
      photo_path: null,
      card_png_path: null,
      generation_source: generation.source,
      model: generation.model,
      estimated_input_tokens: generation.estimatedInputTokens,
      estimated_output_tokens: generation.estimatedOutputTokens,
      duration_ms: generation.durationMs,
      print_status: "not_requested",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to save card generation: ${error.message}`);
  }

  return data.id as string;
}
