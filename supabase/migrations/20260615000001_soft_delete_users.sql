-- Soft delete for users

alter table public.users add column if not exists deleted_at timestamptz;
