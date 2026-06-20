-- Merge all challenges: mock (frontend) + DB seed → 11 missions
-- Applies to: existing users (backfill) + new users (trigger update)
--
-- Final merged set:
--  1. Primeiro Passo          – 5 países            – explore – easy      – 🌍 –   500 XP
--  2. Amigo das Estradas      – 3 amigos             – social  – easy      – 👥 –   200 XP
--  3. Social Nomad            – 5 amigos             – social  – easy      – 👥 –   300 XP
--  4. Contador de Histórias   – 3 stories            – story   – easy      – 📸 –   400 XP
--  5. Foodie Global           – 10 pins restaurantes – pin     – medium    – 🍽 –   300 XP
--  6. Explorador              – 20 pins mapa         – pin     – medium    – 📍 –   800 XP
--  7. Conquistador Asiático   – 3 países Ásia        – explore – medium    – 🏯 –   750 XP
--  8. Nômade Fotógrafo        – 5 stories            – story   – medium    – 📸 –   600 XP
--  9. Mochileiro              – 3 continentes        – explore – hard      – 🎒 – 1.500 XP
-- 10. Marco Polo              – 20 países            – explore – legendary – 🗺 – 5.000 XP
-- 11. Conquistador do Globo   – 195 países           – explore – legendary – 🌐 – 100.000 XP

-- ── 1. Backfill existing users ───────────────────────────────────────────────
-- Uses WHERE NOT EXISTS on (user_id, title) to skip missions users already have.

insert into public.challenges (user_id, title, description, type, difficulty, icon, progress, total, xp_reward, coin_reward)
select u.id, c.title, c.description, c.type, c.difficulty, c.icon, 0, c.total, c.xp_reward, 0
from public.users u
cross join (
  values
    ('Primeiro Passo',        'Visite 5 países diferentes',          'explore', 'easy',      '🌍',   5,    500),
    ('Amigo das Estradas',    'Adicione 3 amigos',                   'social',  'easy',      '👥',   3,    200),
    ('Social Nomad',          'Adicione 5 amigos',                   'social',  'easy',      '👥',   5,    300),
    ('Contador de Histórias', 'Poste 3 stories de viagem',           'story',   'easy',      '📸',   3,    400),
    ('Foodie Global',         'Adicione 10 pins de restaurantes',    'pin',     'medium',    '🍽',  10,    300),
    ('Explorador',            'Adicione 20 pins no mapa',            'pin',     'medium',    '📍',  20,    800),
    ('Conquistador Asiático', 'Visite 3 países na Ásia',             'explore', 'medium',    '🏯',   3,    750),
    ('Nômade Fotógrafo',      'Compartilhe 5 stories de viagem',     'story',   'medium',    '📸',   5,    600),
    ('Mochileiro',            'Visite 3 continentes',                'explore', 'hard',      '🎒',   3,   1500),
    ('Marco Polo',            'Visite 20 países',                    'explore', 'legendary', '🗺',  20,   5000),
    ('Conquistador do Globo', 'Visite todos os 195 países do mundo', 'explore', 'legendary', '🌐', 195, 100000)
) as c(title, description, type, difficulty, icon, total, xp_reward)
where not exists (
  select 1 from public.challenges ch
  where ch.user_id = u.id and ch.title = c.title
);

-- ── 2. Update trigger for new users ──────────────────────────────────────────

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

  insert into public.challenges (user_id, title, description, type, difficulty, icon, progress, total, xp_reward, coin_reward)
  values
    (new.id, 'Primeiro Passo',        'Visite 5 países diferentes',          'explore', 'easy',      '🌍',   0,   5,    500, 0),
    (new.id, 'Amigo das Estradas',    'Adicione 3 amigos',                   'social',  'easy',      '👥',   0,   3,    200, 0),
    (new.id, 'Social Nomad',          'Adicione 5 amigos',                   'social',  'easy',      '👥',   0,   5,    300, 0),
    (new.id, 'Contador de Histórias', 'Poste 3 stories de viagem',           'story',   'easy',      '📸',   0,   3,    400, 0),
    (new.id, 'Foodie Global',         'Adicione 10 pins de restaurantes',    'pin',     'medium',    '🍽',   0,  10,    300, 0),
    (new.id, 'Explorador',            'Adicione 20 pins no mapa',            'pin',     'medium',    '📍',   0,  20,    800, 0),
    (new.id, 'Conquistador Asiático', 'Visite 3 países na Ásia',             'explore', 'medium',    '🏯',   0,   3,    750, 0),
    (new.id, 'Nômade Fotógrafo',      'Compartilhe 5 stories de viagem',     'story',   'medium',    '📸',   0,   5,    600, 0),
    (new.id, 'Mochileiro',            'Visite 3 continentes',                'explore', 'hard',      '🎒',   0,   3,   1500, 0),
    (new.id, 'Marco Polo',            'Visite 20 países',                    'explore', 'legendary', '🗺',   0,  20,   5000, 0),
    (new.id, 'Conquistador do Globo', 'Visite todos os 195 países do mundo', 'explore', 'legendary', '🌐',   0, 195, 100000, 0);

  return new;
end;
$$;
