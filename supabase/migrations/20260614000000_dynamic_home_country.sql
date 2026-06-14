-- Remove hardcoded Brazil from trigger, use home country from signup metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_username text;
  v_home_code text;
  v_home_name text;
  v_home_flag text;
  v_home_continent text;
begin
  v_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  v_home_code     := new.raw_user_meta_data->>'home_code';
  v_home_name     := coalesce(new.raw_user_meta_data->>'home_name', v_home_code);
  v_home_flag     := coalesce(new.raw_user_meta_data->>'home_flag', '🌍');
  v_home_continent := coalesce(new.raw_user_meta_data->>'home_continent', '');

  insert into public.users (id, username)
  values (new.id, v_username)
  on conflict (id) do nothing;

  if v_home_code is not null and v_home_code != '' then
    insert into public.countries (user_id, code, name, flag_emoji, continent, visited, visited_at)
    values (new.id, v_home_code, v_home_name, v_home_flag, v_home_continent, true, now()::date)
    on conflict (user_id, code) do nothing;

    insert into public.pins (user_id, country_code, type, name, lat, lng, note)
    values (new.id, v_home_code, 'home', 'Minha Casa', 0, 0, 'País natal')
    on conflict do nothing;
  end if;

  insert into public.challenges (user_id, title, description, type, difficulty, icon, progress, total, xp_reward, coin_reward)
  values
    (new.id, 'Primeiro Passo',       'Visite 5 países diferentes',  'explore', 'easy',      '🌍', 0, 5,  500,  100),
    (new.id, 'Explorador',           'Adicione 20 pins no mapa',    'pin',     'medium',    '📍', 0, 20, 800,  200),
    (new.id, 'Social Nomad',         'Adicione 5 amigos',           'social',  'easy',      '👥', 0, 5,  300,  50),
    (new.id, 'Contador de Histórias','Poste 3 stories de viagem',   'story',   'easy',      '📸', 0, 3,  400,  80),
    (new.id, 'Mochileiro',           'Visite 3 continentes',        'explore', 'hard',      '🎒', 0, 3,  1500, 500),
    (new.id, 'Lendário',             'Visite 20 países',            'explore', 'legendary', '👑', 0, 20, 5000, 2000);

  return new;
end;
$$;
