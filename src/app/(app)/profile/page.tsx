"use client";
import { useEffect, useState } from "react";
import CountryFlag from "@/components/CountryFlag";
import PixelCharacter from "@/components/PixelCharacter";
import PixelPin from "@/components/PixelPin";
import { useUser } from "@/lib/context/user-context";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import type { CharacterColor, CharacterSkin, Country, PinType } from "@/lib/types";

const SKINS: CharacterSkin[] = ["adventurer", "nomad", "explorer", "wanderer"];
const COLORS: CharacterColor[] = ["blue", "red", "green", "purple", "gold"];

const COLOR_HEX: Record<CharacterColor, string> = {
  blue: "#00e5ff",
  red: "#ff4d6d",
  green: "#39ff14",
  purple: "#bf5af2",
  gold: "#ffd60a",
};

const SKIN_LABELS: Record<CharacterSkin, string> = {
  adventurer: "AVENTUREIRO",
  nomad: "NÔMADE",
  explorer: "EXPLORADOR",
  wanderer: "ERRANTE",
};

function Panel({
  title,
  accent = "#00e5ff",
  children,
  noPad,
}: {
  title?: string;
  accent?: string;
  children: React.ReactNode;
  noPad?: boolean;
}) {
  return (
    <div className="pixel-panel overflow-hidden">
      {title && (
        <div className="pixel-panel-header" style={{ borderBottomColor: accent, color: accent }}>
          {title}
        </div>
      )}
      <div className={noPad ? undefined : "p-5"}>{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const user = useUser();
  const [skin, setSkin] = useState(user.character.skin);
  const [color, setColor] = useState(user.character.color);
  const [hat, setHat] = useState(user.character.hat);
  const [backpack, setBackpack] = useState(user.character.backpack);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [friendsCount, setFriendsCount] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: dbCountries }, { data: dbPins }, { count: fc }] = await Promise.all([
        supabase.from("countries").select("*").eq("user_id", user.id).eq("visited", true),
        supabase.from("pins").select("*").eq("user_id", user.id),
        supabase.from("friends").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      const pinsByCountry: Record<string, Country["pins"]> = {};
      (dbPins ?? []).forEach((p) => {
        if (!pinsByCountry[p.country_code]) pinsByCountry[p.country_code] = [];
        pinsByCountry[p.country_code].push({
          id: p.id,
          type: p.type as PinType,
          name: p.name,
          lat: p.lat,
          lng: p.lng,
          countryCode: p.country_code,
          note: p.note ?? undefined,
        });
      });
      setCountries(
        (dbCountries ?? []).map((c) => ({
          code: c.code,
          name: c.name,
          visited: c.visited,
          visitedAt: c.visited_at ?? undefined,
          photoUrl: c.photo_url ?? undefined,
          flagEmoji: c.flag_emoji,
          continent: c.continent,
          pins: pinsByCountry[c.code] ?? [],
        })),
      );
      setFriendsCount(fc ?? 0);
    }
    load();
  }, [user.id]);

  const character = { skin, color, hat, backpack };
  const xpPct = (user.xp / user.xpToNext) * 100;

  async function saveCharacter() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("users")
      .update({ character: character as unknown as Json })
      .eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="page-content flex flex-col gap-5">
      <div className="page-header">
        <div className="page-title">◆ PERFIL</div>
        <div className="ml-auto text-[9px] text-white">{user.username}</div>
      </div>

      <div className="grid-2-desktop items-start">
        {/* Character card */}
        <Panel title="PERSONAGEM" accent="#ffd60a">
          <div className="flex gap-5 items-start">
            <div className="float bg-[#01579b] border-2 border-[#29b6f6] shadow-[4px_4px_0_#014080] p-4 shrink-0">
              <PixelCharacter character={character} size={88} />
            </div>
            <div className="flex-1 flex flex-col gap-[10px]">
              <div className="text-[11px] text-[#ffffff]">{user.username}</div>
              <div className="text-[8px]" style={{ color: COLOR_HEX[color] }}>
                {SKIN_LABELS[skin]}
              </div>
              <div className="flex flex-col gap-[6px] mt-1">
                {[
                  { label: "NÍVEL", value: user.level, color: "#ffd60a" },
                  { label: "RANK", value: `#${user.rank}`, color: "#ffffff" },
                  { label: "PAÍSES", value: countries.length, color: "#39ff14" },
                  { label: "PINS", value: user.totalPins, color: "#ff8c00" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-[8px]">
                    <span className="text-white min-w-[52px]">{s.label}</span>
                    <span className="text-white flex-1 border-t border-dashed border-t-[#29b6f622]" />
                    <span style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1">
                <div className="flex justify-between text-[7px] text-white mb-[6px]">
                  <span>XP</span>
                  <span>
                    {user.xp} / {user.xpToNext}
                  </span>
                </div>
                <div className="pixel-progress-track">
                  <div className="pixel-progress-fill xp-bar-fill" style={{ width: `${xpPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* Customizer */}
        <Panel title="PERSONALIZAR" accent="#bf5af2">
          <div className="mb-[18px]">
            <div className="text-[8px] text-white mb-[10px] tracking-[1px]">◈ CLASSE</div>
            <div className="flex flex-wrap gap-2">
              {SKINS.map((s) => {
                const active = skin === s;
                return (
                  <button
                    key={s}
                    onClick={() => setSkin(s)}
                    className="font-pixel text-[7px] px-[10px] py-2 cursor-pointer"
                    style={{
                      border: `2px solid ${active ? "#ffd60a" : "#1e6ea8"}`,
                      background: active ? "#ffd60a22" : "#0277bd",
                      color: active ? "#ffd60a" : "rgba(255,255,255,0.5)",
                      boxShadow: active ? "none" : "2px 2px 0 #01579b",
                      transform: active ? "translate(2px,2px)" : "none",
                    }}
                  >
                    {active ? "► " : ""}
                    {SKIN_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mb-[18px]">
            <div className="text-[8px] text-white mb-[10px] tracking-[1px]">◈ COR</div>
            <div className="flex gap-[10px] items-center">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  title={c}
                  className="w-8 h-8 cursor-pointer"
                  style={{
                    background: COLOR_HEX[c],
                    border: `3px solid ${color === c ? "#ffffff" : "#01579b"}`,
                    boxShadow:
                      color === c ? `0 0 0 2px #ffffff44, 3px 3px 0 #01579b` : "2px 2px 0 #014080",
                    transform: color === c ? "none" : "translate(0,0)",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="mb-[18px]">
            <div className="text-[8px] text-white mb-[10px] tracking-[1px]">◈ ACESSÓRIOS</div>
            <div className="flex gap-[10px]">
              {[
                { key: "hat", label: "🎩 CHAPÉU", value: hat, set: setHat },
                { key: "backpack", label: "🎒 MOCHILA", value: backpack, set: setBackpack },
              ].map((acc) => (
                <button
                  key={acc.key}
                  onClick={() => acc.set(!acc.value)}
                  className="font-pixel text-[7px] px-[14px] py-[10px] cursor-pointer"
                  style={{
                    border: `2px solid ${acc.value ? "#bf5af2" : "#1e6ea8"}`,
                    background: acc.value ? "#3d0a6b" : "#0277bd",
                    color: acc.value ? "#bf5af2" : "rgba(255,255,255,0.5)",
                    boxShadow: acc.value ? "none" : "2px 2px 0 #01579b",
                    transform: acc.value ? "translate(2px,2px)" : "none",
                  }}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={saveCharacter}
            disabled={saving}
            className="w-full font-pixel text-[8px] p-[10px] border-2 cursor-pointer disabled:opacity-50"
            style={{
              borderColor: saved ? "#39ff14" : "#bf5af2",
              background: saved ? "#39ff1411" : "#bf5af211",
              color: saved ? "#39ff14" : "#bf5af2",
            }}
          >
            {saved ? "SALVO!" : saving ? "SALVANDO..." : "SALVAR PERSONAGEM"}
          </button>
        </Panel>
      </div>

      {/* Stats grid */}
      <Panel title="ESTATÍSTICAS" accent="#00e5ff">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "PAÍSES VISITADOS", value: countries.length, color: "#00e5ff", icon: "🌍" },
            { label: "TOTAL DE PINS", value: user.totalPins, color: "#ffd60a", icon: "📍" },
            { label: "AMIGOS", value: friendsCount, color: "#39ff14", icon: "👥" },
            { label: "RANK GLOBAL", value: `#${user.rank}`, color: "#bf5af2", icon: "🏆" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#01579b] shadow-pixel-md px-4 py-[14px] flex items-center gap-[14px]"
              style={{ border: `2px solid ${s.color}33` }}
            >
              <span className="text-[28px] leading-none">{s.icon}</span>
              <div>
                <div className="text-[22px] mb-1" style={{ color: s.color }}>
                  {s.value}
                </div>
                <div className="text-[7px] text-white tracking-[0.5px]">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Countries list */}
      <Panel title={`PAÍSES DESBLOQUEADOS (${countries.length})`} accent="#39ff14" noPad>
        {countries.length === 0 ? (
          <div className="p-5 text-[8px] text-white">Nenhum país visitado ainda.</div>
        ) : (
          <div>
            {countries.map((country, i) => (
              <div
                key={country.code}
                className="flex items-center gap-4 px-5 py-[14px]"
                style={{
                  borderBottom: i < countries.length - 1 ? "1px solid #29b6f620" : "none",
                  background: i % 2 === 0 ? "#0277bd44" : "transparent",
                }}
              >
                <CountryFlag code={country.code} size={36} />
                <div className="flex-1">
                  <div className="text-[10px] text-[#ffffff] mb-1">{country.name}</div>
                  <div className="text-[7px] text-white">
                    {country.pins.length} pins · {country.continent}
                  </div>
                </div>
                <div className="flex gap-1">
                  {country.pins.slice(0, 5).map((p) => (
                    <PixelPin key={p.id} type={p.type} size={20} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
