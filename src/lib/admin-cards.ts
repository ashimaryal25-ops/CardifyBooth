import { getSupabaseAdmin } from "@/lib/supabase-server";

export interface AdminCardRow {
  id: string;
  display_name: string;
  card_title: string;
  rarity: string;
  generation_source: string;
  model: string | null;
  estimated_input_tokens: number | null;
  estimated_output_tokens: number | null;
  duration_ms: number | null;
  print_status: string;
  card_png_path: string | null;
  created_at: string;
}

export interface AdminDashboardData {
  totalCards: number;
  cardsToday: number;
  savedPngs: number;
  printRequested: number;
  recentCards: AdminCardRow[];
}

function getTodayStartIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function countOrZero(count: number | null) {
  return count ?? 0;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = getSupabaseAdmin();
  const todayStart = getTodayStartIso();

  const [
    totalResult,
    todayResult,
    savedPngResult,
    printRequestedResult,
    recentCardsResult,
  ] = await Promise.all([
    supabase.from("card_generations").select("id", { count: "exact", head: true }),
    supabase
      .from("card_generations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart),
    supabase
      .from("card_generations")
      .select("id", { count: "exact", head: true })
      .not("card_png_path", "is", null),
    supabase
      .from("card_generations")
      .select("id", { count: "exact", head: true })
      .eq("print_status", "requested"),
    supabase
      .from("card_generations")
      .select(
        [
          "id",
          "display_name",
          "card_title",
          "rarity",
          "generation_source",
          "model",
          "estimated_input_tokens",
          "estimated_output_tokens",
          "duration_ms",
          "print_status",
          "card_png_path",
          "created_at",
        ].join(", "),
      )
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const queryError =
    totalResult.error ??
    todayResult.error ??
    savedPngResult.error ??
    printRequestedResult.error ??
    recentCardsResult.error;

  if (queryError) {
    throw new Error(`Could not load admin dashboard: ${queryError.message}`);
  }

  return {
    totalCards: countOrZero(totalResult.count),
    cardsToday: countOrZero(todayResult.count),
    savedPngs: countOrZero(savedPngResult.count),
    printRequested: countOrZero(printRequestedResult.count),
    recentCards: (recentCardsResult.data ?? []) as unknown as AdminCardRow[],
  };
}
