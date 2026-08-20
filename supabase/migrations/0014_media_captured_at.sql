-- Photo capture date (from EXIF DateTimeOriginal, read client-side at
-- upload time -- see ImageUploader's onFileSelected in the admin panel).
-- Nullable: most re-encoded/screenshot/web-sourced images carry no EXIF at
-- all, in which case the Media Manager falls back to created_at.
alter table media
  add column captured_at timestamptz;
