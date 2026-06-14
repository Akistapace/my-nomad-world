-- Allow authenticated users to read any public user profile
-- Required for ranking, stories feed, and friend search
create policy "users_select_all" on public.users
  for select using (auth.uid() is not null);
