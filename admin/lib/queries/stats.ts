import type { SupabaseClient } from "@supabase/supabase-js";

// Home dashboard stats — one function per stat card.
// Owner: Database + API. Consumer: UI (Home page).
//
// Each card needs: total count, the most recent updated_at, and how many
// rows were updated/created in the last 7 days. Events additionally needs
// an "upcoming" count (is_published and event_date >= today).
//
// Implement using supabase-js `.select('*', { count: 'exact', head: true })`
// for counts, `.order('updated_at', { ascending: false }).limit(1)` for the
// most recent timestamp, and `.gte('updated_at', <7 days ago ISO string>)`
// for the recent-activity count. See docs/SCHEMA.md for table/column names.

export interface CardStats {
  total: number;
  updatedLast7Days: number;
  lastUpdatedAt: string | null;
}

export interface EventStats extends CardStats {
  upcoming: number;
}

export async function getTeamMemberStats(
  supabase: SupabaseClient,
): Promise<CardStats> {
  throw new Error("TODO: implement (see comment above)");
}

export async function getEventStats(
  supabase: SupabaseClient,
): Promise<EventStats> {
  throw new Error("TODO: implement (see comment above)");
}

export async function getStartupStats(
  supabase: SupabaseClient,
): Promise<CardStats> {
  throw new Error("TODO: implement (see comment above)");
}

export async function getMediaStats(
  supabase: SupabaseClient,
): Promise<CardStats> {
  throw new Error("TODO: implement (see comment above)");
}
