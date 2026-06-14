-- Seed trigger: create user profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_username text;
begin
  v_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );

  insert into public.users (id, username)
  values (new.id, v_username)
  on conflict (id) do nothing;

  return new;
end;
$$;
