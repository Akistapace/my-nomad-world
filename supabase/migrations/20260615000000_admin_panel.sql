-- Admin panel: add is_admin and is_banned flags to users

alter table public.users add column if not exists is_admin boolean not null default false;
alter table public.users add column if not exists is_banned boolean not null default false;
