-- Supports the temp-password invite flow (see docs/AUTH.md): an invited
-- admin is created with a one-time temp password instead of an email link,
-- and must be forced to set a real one on first login before reaching any
-- protected page. true only for the window between invite and that first
-- password change; false for everyone else, including the bootstrapped
-- Owner (who sets a real password directly, never a temp one).
alter table admin_users
  add column must_reset_password boolean not null default false;
