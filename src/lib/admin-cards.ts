import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const printStatusValues = ["not_requested", "requested", "printed"] as const;

export type PrintStatus = (typeof printStatusValues)[number];
export type AdminDateRange = "today" | "7d" | "30d" | "all";
export type AdminPngFilter = "all" | "saved" | "missing";
export type AdminSort = "newest" | "oldest" | "duration" | "tokens";

export interface AdminFilters {
  search: string;
  rarity: string;
  printStatus: string;
  png: AdminPngFilter;
  source: string;
  dateRange: AdminDateRange;
  sort: AdminSort;
}

export interface AdminCardRow {
  id: string;
  event_id: string | null;
  display_name: string;
  card_title: string;
  rarity: string;
  traits: string[];
  stats: Record<string, number>;
  special_ability: string;
  description: string;
  tagline: string | null;
  generation_source: string;
  model: string | null;
  estimated_input_tokens: number | null;
  estimated_output_tokens: number | null;
  duration_ms: number | null;
  print_status: string;
  card_png_path: string | null;
  created_at: string;
  events: {
    id: string;
    name: string;
    theme: string;
  } | null;
}

export interface AdminCardDetail extends AdminCardRow {
  photo_path: string | null;
  cardPngUrl: string | null;
  publicCardUrl: string;
}

export interface AdminMetrics {
  totalCards: number;
  cardsToday: number;
  cardsThisWeek: number;
  savedPngs: number;
  missingPngs: number;
  printRequested: number;
  printed: number;
  needsAttention: number;
  estimatedTotalTokens: number;
  averageDurationMs: number;
}

export interface AdminDashboardData {
  metrics: AdminMetrics;
  recentCards: AdminCardRow[];
  printQueue: AdminCardRow[];
  storageIssues: AdminCardRow[];
  rarityOptions: string[];
  sourceOptions: string[];
  lastRefreshed: string;
}

const cardSelect = [
  "id",
  "event_id",
  "display_name",
  "card_title",
  "rarity",
  "traits",
  "stats",
  "special_ability",
  "description",
  "tagline",
  "generation_source",
  "model",
  "estimated_input_tokens",
  "estimated_output_tokens",
  "duration_ms",
  "print_status",
  "card_png_path",
  "created_at",
  "events(id, name, theme)",
].join(", ");

const detailSelect = `${cardSelect}, photo_path`;

function getDayStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDateRangeStart(range: AdminDateRange) {
  const now = new Date();

  if (range === "today") {
    return getDayStart(now).toISOString();
  }

  if (range === "7d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return start.toISOString();
  }

  if (range === "30d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return start.toISOString();
  }

  return null;
}

function countOrZero(count: number | null) {
  return count ?? 0;
}

function numberOrZero(value: number | null | undefined) {
  return value ?? 0;
}

function normalizeFilter(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function asDateRange(value: string): AdminDateRange {
  if (value === "today" || value === "7d" || value === "30d" || value === "all") {
    return value;
  }

  return "all";
}

function asPngFilter(value: string): AdminPngFilter {
  if (value === "saved" || value === "missing") {
    return value;
  }

  return "all";
}

function asSort(value: string): AdminSort {
  if (value === "oldest" || value === "duration" || value === "tokens") {
    return value;
  }

  return "newest";
}

export function parseAdminFilters(searchParams: Record<string, string | string[] | undefined>): AdminFilters {
  return {
    search: normalizeFilter(searchParams.q).trim(),
    rarity: normalizeFilter(searchParams.rarity),
    printStatus: normalizeFilter(searchParams.print_status),
    png: asPngFilter(normalizeFilter(searchParams.png)),
    source: normalizeFilter(searchParams.source),
    dateRange: asDateRange(normalizeFilter(searchParams.range)),
    sort: asSort(normalizeFilter(searchParams.sort)),
  };
}

function applyCardFilters<T>(query: T, filters: AdminFilters) {
  let nextQuery = query as {
    or: (filter: string) => typeof nextQuery;
    eq: (column: string, value: string) => typeof nextQuery;
    gte: (column: string, value: string) => typeof nextQuery;
    not: (column: string, operator: string, value: null) => typeof nextQuery;
    is: (column: string, value: null) => typeof nextQuery;
  };

  if (filters.search) {
    const escapedSearch = filters.search.replaceAll("%", "\\%").replaceAll(",", " ");
    nextQuery = nextQuery.or(`display_name.ilike.%${escapedSearch}%,card_title.ilike.%${escapedSearch}%`);
  }

  if (filters.rarity) {
    nextQuery = nextQuery.eq("rarity", filters.rarity);
  }

  if (filters.printStatus) {
    nextQuery = nextQuery.eq("print_status", filters.printStatus);
  }

  if (filters.source) {
    nextQuery = nextQuery.eq("generation_source", filters.source);
  }

  if (filters.png === "saved") {
    nextQuery = nextQuery.not("card_png_path", "is", null);
  }

  if (filters.png === "missing") {
    nextQuery = nextQuery.is("card_png_path", null);
  }

  const dateStart = getDateRangeStart(filters.dateRange);
  if (dateStart) {
    nextQuery = nextQuery.gte("created_at", dateStart);
  }

  return nextQuery as T;
}

function applySort<T>(query: T, sort: AdminSort) {
  const nextQuery = query as {
    order: (column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) => typeof nextQuery;
  };

  if (sort === "oldest") {
    return nextQuery.order("created_at", { ascending: true }) as T;
  }

  if (sort === "duration") {
    return nextQuery.order("duration_ms", { ascending: false, nullsFirst: false }) as T;
  }

  if (sort === "tokens") {
    return nextQuery.order("estimated_output_tokens", { ascending: false, nullsFirst: false }) as T;
  }

  return nextQuery.order("created_at", { ascending: false }) as T;
}

export function getPublicCardUrl(cardPngPath: string | null) {
  if (!cardPngPath) {
    return null;
  }

  const [bucketName, ...pathParts] = cardPngPath.split("/");
  const filePath = pathParts.join("/");

  if (!bucketName || !filePath) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

  return data.publicUrl;
}

function getSiteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://cardifybooth.vercel.app";
}

async function countCards(filters?: {
  gteCreatedAt?: string;
  printStatus?: string;
  png?: "saved" | "missing";
}) {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("card_generations").select("id", { count: "exact", head: true });

  if (filters?.gteCreatedAt) {
    query = query.gte("created_at", filters.gteCreatedAt);
  }

  if (filters?.printStatus) {
    query = query.eq("print_status", filters.printStatus);
  }

  if (filters?.png === "saved") {
    query = query.not("card_png_path", "is", null);
  }

  if (filters?.png === "missing") {
    query = query.is("card_png_path", null);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Could not count cards: ${error.message}`);
  }

  return countOrZero(count);
}

async function getDistinctOptions(column: "rarity" | "generation_source") {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("card_generations")
    .select(column)
    .not(column, "is", null)
    .order(column, { ascending: true });

  if (error) {
    throw new Error(`Could not load ${column} options: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as Record<string, string | null>[];
  return Array.from(new Set(rows.map((row) => String(row[column] ?? "")).filter(Boolean)));
}

async function getTokenAndDurationMetrics() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("card_generations")
    .select("estimated_input_tokens, estimated_output_tokens, duration_ms");

  if (error) {
    throw new Error(`Could not load usage metrics: ${error.message}`);
  }

  const rows = data ?? [];
  const estimatedTotalTokens = rows.reduce(
    (total, row) =>
      total +
      numberOrZero(row.estimated_input_tokens) +
      numberOrZero(row.estimated_output_tokens),
    0,
  );
  const durationRows = rows.filter((row) => numberOrZero(row.duration_ms) > 0);
  const averageDurationMs = durationRows.length
    ? Math.round(
        durationRows.reduce((total, row) => total + numberOrZero(row.duration_ms), 0) /
          durationRows.length,
      )
    : 0;

  return { estimatedTotalTokens, averageDurationMs };
}

export async function getAdminDashboardData(filters: AdminFilters): Promise<AdminDashboardData> {
  const supabase = getSupabaseAdmin();
  const todayStart = getDayStart().toISOString();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  let recentCardsQuery = supabase.from("card_generations").select(cardSelect);
  recentCardsQuery = applyCardFilters(recentCardsQuery, filters);
  recentCardsQuery = applySort(recentCardsQuery, filters.sort).limit(50);

  const [
    totalCards,
    cardsToday,
    cardsThisWeek,
    savedPngs,
    missingPngs,
    printRequested,
    printed,
    usageMetrics,
    recentCardsResult,
    printQueueResult,
    storageIssuesResult,
    rarityOptions,
    sourceOptions,
  ] = await Promise.all([
    countCards(),
    countCards({ gteCreatedAt: todayStart }),
    countCards({ gteCreatedAt: weekStart.toISOString() }),
    countCards({ png: "saved" }),
    countCards({ png: "missing" }),
    countCards({ printStatus: "requested" }),
    countCards({ printStatus: "printed" }),
    getTokenAndDurationMetrics(),
    recentCardsQuery,
    supabase
      .from("card_generations")
      .select(cardSelect)
      .eq("print_status", "requested")
      .order("created_at", { ascending: true })
      .limit(20),
    supabase
      .from("card_generations")
      .select(cardSelect)
      .is("card_png_path", null)
      .order("created_at", { ascending: false })
      .limit(20),
    getDistinctOptions("rarity"),
    getDistinctOptions("generation_source"),
  ]);

  if (recentCardsResult.error) {
    throw new Error(`Could not load recent cards: ${recentCardsResult.error.message}`);
  }

  if (printQueueResult.error) {
    throw new Error(`Could not load print queue: ${printQueueResult.error.message}`);
  }

  if (storageIssuesResult.error) {
    throw new Error(`Could not load storage issues: ${storageIssuesResult.error.message}`);
  }

  return {
    metrics: {
      totalCards,
      cardsToday,
      cardsThisWeek,
      savedPngs,
      missingPngs,
      printRequested,
      printed,
      needsAttention: missingPngs,
      estimatedTotalTokens: usageMetrics.estimatedTotalTokens,
      averageDurationMs: usageMetrics.averageDurationMs,
    },
    recentCards: (recentCardsResult.data ?? []) as unknown as AdminCardRow[],
    printQueue: (printQueueResult.data ?? []) as unknown as AdminCardRow[],
    storageIssues: (storageIssuesResult.data ?? []) as unknown as AdminCardRow[],
    rarityOptions,
    sourceOptions,
    lastRefreshed: new Date().toISOString(),
  };
}

export async function getAdminCardById(id: string): Promise<AdminCardDetail | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("card_generations")
    .select(detailSelect)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(`Could not load card: ${error.message}`);
  }

  const card = data as unknown as AdminCardRow & { photo_path: string | null };

  return {
    ...card,
    cardPngUrl: getPublicCardUrl(card.card_png_path),
    publicCardUrl: `${getSiteOrigin()}/cards/${card.id}`,
  };
}

export async function updateCardPrintStatus(cardId: string, status: PrintStatus) {
  await requireAdminSession();

  if (!printStatusValues.includes(status)) {
    throw new Error("Invalid print status.");
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("card_generations")
    .update({ print_status: status })
    .eq("id", cardId);

  if (error) {
    throw new Error(`Could not update print status: ${error.message}`);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/cards/${cardId}`);
  revalidatePath(`/cards/${cardId}`);
}

export async function deleteCardGeneration(cardId: string) {
  await requireAdminSession();

  const supabase = getSupabaseAdmin();
  const { data, error: lookupError } = await supabase
    .from("card_generations")
    .select("card_png_path")
    .eq("id", cardId)
    .single<{ card_png_path: string | null }>();

  if (lookupError) {
    throw new Error(`Could not find card before delete: ${lookupError.message}`);
  }

  if (data.card_png_path) {
    const [bucketName, ...pathParts] = data.card_png_path.split("/");
    const filePath = pathParts.join("/");

    if (bucketName && filePath) {
      const { error: storageError } = await supabase.storage.from(bucketName).remove([filePath]);

      if (storageError) {
        throw new Error(`Could not delete card PNG: ${storageError.message}`);
      }
    }
  }

  const { error: deleteError } = await supabase.from("card_generations").delete().eq("id", cardId);

  if (deleteError) {
    throw new Error(`Could not delete card row: ${deleteError.message}`);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/cards/${cardId}`);
  redirect("/admin");
}
