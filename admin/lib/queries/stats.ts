import type { SupabaseClient } from "@supabase/supabase-js";

// Home dashboard stats.
// Owner: Database + API. Consumer: UI (Home page).
//
// All four cards are served by a single `get_dashboard_stats()` RPC
// (supabase/migrations/0006_dashboard_stats.sql) rather than by counting from
// the client: each card needs a total, a 7-day count and a last-updated
// timestamp, which as separate supabase-js calls is 13 round trips to render
// one page.
//
// The RPC is SECURITY INVOKER, so the RLS policies from 0003 apply to it the
// same way they apply to a plain select — a signed-in admin gets counts across
// all rows, anyone else gets published rows only. Nothing here re-checks
// permissions, because nothing here should.

export interface CardStats {
  total: number;
  updatedLast7Days: number;
  lastUpdatedAt: string | null;
}

export interface EventStats extends CardStats {
  upcoming: number;
}

export interface DashboardStats {
  teamMembers: CardStats;
  events: EventStats;
  startups: CardStats;
  media: CardStats;
}

/**
 * Every dashboard stat in one round trip. Prefer this on the Home page.
 */
export async function getDashboardStats(
  supabase: SupabaseClient,
): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc("get_dashboard_stats");

  if (error) throw error;
  if (!data) throw new Error("get_dashboard_stats returned no data");

  // The RPC builds this object with json_build_object, so its shape is fixed by
  // the migration rather than inferable from the generated Supabase types.
  return data as DashboardStats;
}

// Per-card accessors, kept for the original call signatures. Each one is a
// full round trip, so calling all four to render the dashboard defeats the
// point — use getDashboardStats() and destructure it instead.

export async function getTeamMemberStats(
  supabase: SupabaseClient,
): Promise<CardStats> {
  return (await getDashboardStats(supabase)).teamMembers;
}

export async function getEventStats(
  supabase: SupabaseClient,
): Promise<EventStats> {
  return (await getDashboardStats(supabase)).events;
}

export async function getStartupStats(
  supabase: SupabaseClient,
): Promise<CardStats> {
  return (await getDashboardStats(supabase)).startups;
}

export async function getMediaStats(
  supabase: SupabaseClient,
): Promise<CardStats> {
  return (await getDashboardStats(supabase)).media;
}
