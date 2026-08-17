import type { SupabaseClient } from "@supabase/supabase-js";

export interface CardStats {
  total: number;
  updatedLast7Days: number;
  lastUpdatedAt: string | null;
}

export interface EventStats extends CardStats {
  upcoming: number;
}

async function getGenericTableStats(
  supabase: SupabaseClient,
  tableName: string
): Promise<CardStats> {
  try {
    const { count: totalCount, error: countErr } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true });

    if (countErr) throw countErr;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true })
      .gte("updated_at", sevenDaysAgo);

    const { data: latestRows } = await supabase
      .from(tableName)
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1);

    const lastUpdatedAt = latestRows && latestRows.length > 0 ? latestRows[0].updated_at : null;

    return {
      total: totalCount ?? 0,
      updatedLast7Days: recentCount ?? 0,
      lastUpdatedAt,
    };
  } catch (error) {
    console.warn(`Could not fetch stats for ${tableName}, falling back to defaults`, error);
    return {
      total: 0,
      updatedLast7Days: 0,
      lastUpdatedAt: null,
    };
  }
}

export async function getTeamMemberStats(
  supabase: SupabaseClient
): Promise<CardStats> {
  return getGenericTableStats(supabase, "team_members");
}

export async function getEventStats(
  supabase: SupabaseClient
): Promise<EventStats> {
  const baseStats = await getGenericTableStats(supabase, "events");
  let upcoming = 0;

  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .gte("event_date", todayStr);

    upcoming = count ?? 0;
  } catch (e) {
    console.warn("Could not fetch upcoming event stats", e);
  }

  return {
    ...baseStats,
    upcoming,
  };
}

export async function getStartupStats(
  supabase: SupabaseClient
): Promise<CardStats> {
  return getGenericTableStats(supabase, "startups");
}

export async function getMediaStats(
  supabase: SupabaseClient
): Promise<CardStats> {
  return getGenericTableStats(supabase, "media");
}
