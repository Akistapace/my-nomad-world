-- Grant table-level privileges to authenticated role (required alongside RLS policies)
grant select, insert, update, delete on public.users      to authenticated;
grant select, insert, update, delete on public.countries  to authenticated;
grant select, insert, update, delete on public.pins       to authenticated;
grant select, insert, update, delete on public.friends    to authenticated;
grant select, insert, update, delete on public.stories    to authenticated;
grant select, insert, update, delete on public.challenges to authenticated;

-- Public read for anon (stories feed visible without login)
grant select on public.stories to anon;
