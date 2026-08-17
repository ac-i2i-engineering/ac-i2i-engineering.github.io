// Mirrors supabase/migrations/0001_init_schema.sql — keep in sync.
// If a column changes in the migration, update it here in the same PR.

export interface TeamDepartment {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  link_url: string | null;
  link_text: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  department_id: string | null;
  name: string;
  role: string | null;
  image_url: string | null;
  alt_text: string | null;
  is_lead: boolean;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string; // date, e.g. "2026-08-15"
  start_time: string | null; // time, e.g. "18:00:00"
  end_time: string | null;
  location: string | null;
  image_url: string | null;
  registration_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Startup {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  image_alt: string | null;
  github_url: string | null;
  github_text: string | null;
  demo_url: string | null;
  demo_text: string | null;
  tags: string[];
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type MediaAttachedToType = "team_member" | "event" | "startup";

export interface Media {
  id: string;
  /** NULL for rows seeded from the repo's images/ directory — those files are
   *  not in a Storage bucket. Set on upload via the Media Manager. */
  storage_path: string | null;
  url: string;
  alt_text: string | null;
  caption: string | null;
  attached_to_type: MediaAttachedToType | null;
  attached_to_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

export type ActivityAction = "create" | "update" | "delete";
export type ActivityEntityType = "team_member" | "event" | "startup" | "media";

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: ActivityAction;
  entity_type: ActivityEntityType;
  entity_id: string | null;
  summary: string | null;
  created_at: string;
}

// Storage buckets — keep names in sync with supabase/migrations/0002_storage_buckets.sql
export const STORAGE_BUCKETS = {
  teamPhotos: "team-photos",
  eventImages: "event-images",
  startupImages: "startup-images",
  mediaGallery: "media-gallery",
} as const;
