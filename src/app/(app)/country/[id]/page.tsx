"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CountryFlag from "@/components/CountryFlag";
import CountryMap from "@/components/CountryMap";
import PixelPin from "@/components/PixelPin";
import XPToast from "@/components/XPToast";
import { useUser } from "@/lib/context/user-context";
import { COUNTRIES_CATALOG, countryFlagEmoji } from "@/lib/countries-catalog";
import { COUNTRY_CENTERS } from "@/lib/country-centers";
import { createClient } from "@/lib/supabase/client";
import type { Country, Pin, PinType } from "@/lib/types";
import { PIN_COLORS, PIN_ICONS } from "@/lib/types";
import { grantXP, type XPResult } from "@/lib/xp";

const PIN_TYPES: PinType[] = ["travel", "home", "hotel", "cafe", "restaurant", "activity"];

const CATALOG_BY_CODE = Object.fromEntries(COUNTRIES_CATALOG.map((c) => [c.code, c]));

function AddCountryForm({
  code,
  userId,
  onAdded,
  onBack,
  onXpGranted,
}: {
  code: string;
  userId: string;
  onAdded: (c: Country) => void;
  onBack: () => void;
  onXpGranted?: (result: XPResult) => void;
}) {
  const profile = useUser();
  const meta = CATALOG_BY_CODE[code];
  const flagEmoji = meta ? countryFlagEmoji(meta.alpha2) : "🌍";
  const name = meta?.name ?? code;
  const continent = meta?.continent ?? "";
  const today = new Date().toISOString().slice(0, 10);
  const [visitedAt, setVisitedAt] = useState(today);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("countries").insert({
      user_id: userId,
      code,
      name,
      flag_emoji: flagEmoji,
      continent,
      visited: true,
      visited_at: visitedAt,
    });
    const center = COUNTRY_CENTERS[code];
    const { data: pinData } = await supabase
      .from("pins")
      .insert({
        user_id: userId,
        country_code: code,
        type: "travel",
        name: `Visita a ${name}`,
        lat: center ? center[1] : 0,
        lng: center ? center[0] : 0,
        note: visitedAt,
      })
      .select()
      .single();
    const pins = pinData
      ? [
          {
            id: pinData.id,
            type: "travel" as PinType,
            name: pinData.name,
            lat: pinData.lat,
            lng: pinData.lng,
            countryCode: code,
            note: visitedAt,
          },
        ]
      : [];
    onAdded({ code, name, visited: true, visitedAt, flagEmoji, continent, pins });
    const xpResult = await grantXP(userId, 100, profile.xp, profile.level);
    onXpGranted?.(xpResult);
    setSaving(false);
  }

  return (
    <div className="page-content flex flex-col gap-5">
      {/* Header */}
      <div className="page-header">
        <button
          onClick={onBack}
          className="bg-transparent border-none text-white cursor-pointer text-base font-pixel"
        >
          ←
        </button>
        <div className="flex items-center gap-3">
          <CountryFlag code={code} size={36} />
          <span className="page-title">{name}</span>
        </div>
      </div>

      {/* Card */}
      <div className="pixel-panel max-w-[480px]">
        <div
          className="pixel-panel-header"
          style={{ borderBottomColor: "#39ff14", color: "#39ff14" }}
        >
          ✈ REGISTRAR VISITA
        </div>
        <div className="p-6 flex flex-col gap-5">
          {/* Country info */}
          <div className="flex items-center gap-4 px-5 py-4 bg-[#01579b] border-2 border-[#29b6f644]">
            <span className="text-[40px]">{flagEmoji}</span>
            <div>
              <div className="text-xs text-white mb-[6px]">{name}</div>
              <div className="text-[8px] text-white/50">{continent}</div>
            </div>
          </div>

          {/* Date picker */}
          <div>
            <div className="text-[8px] text-white/50 mb-[10px] tracking-[1px]">
              ◈ DATA DA VISITA
            </div>
            <input
              type="date"
              value={visitedAt}
              max={today}
              onChange={(e) => setVisitedAt(e.target.value)}
              className="w-full pixel-input"
              style={{ colorScheme: "dark" }}
            />
          </div>

          {/* XP reward hint */}
          <div className="flex gap-4 text-[8px]">
            <span style={{ color: "#ffd60a" }}>⭐ +100 XP</span>
            <span style={{ color: "#ff8c00" }}>🪙 +30</span>
            <span style={{ color: "#39ff14" }}>🌍 +1 país</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-[10px]">
            <button
              onClick={handleSubmit}
              disabled={saving || !visitedAt}
              style={{
                flex: 1,
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 9,
                padding: "14px",
                border: "2px solid #39ff14",
                background: saving ? "#39ff1408" : "#39ff1422",
                color: saving ? "#39ff1488" : "#39ff14",
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: saving ? "none" : "3px 3px 0 #1a6608",
                transform: saving ? "translate(3px,3px)" : "none",
              }}
            >
              {saving ? "SALVANDO..." : "MARCAR VISITADO"}
            </button>
            <button
              onClick={onBack}
              className="font-pixel text-[9px] px-[18px] py-[14px] border-2 border-[#ff4d6d44] bg-transparent text-[#ff4d6d] cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

export default function CountryPage() {
  const params = useParams();
  const router = useRouter();
  const user = useUser();
  const code = (params.id as string).toUpperCase();

  const [country, setCountry] = useState<Country | null>(null);
  const [filter, setFilter] = useState<PinType | "all">("all");
  const [loading, setLoading] = useState(true);
  const [addingPin, setAddingPin] = useState(false);
  const [newPin, setNewPin] = useState({ name: "", type: "travel" as PinType, note: "" });
  const [xpResult, setXpResult] = useState<XPResult | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: c }, { data: pins }] = await Promise.all([
        supabase.from("countries").select("*").eq("user_id", user.id).eq("code", code).single(),
        supabase.from("pins").select("*").eq("user_id", user.id).eq("country_code", code),
      ]);
      if (!c) {
        setLoading(false);
        return;
      }
      setCountry({
        code: c.code,
        name: c.name,
        visited: c.visited,
        visitedAt: c.visited_at ?? undefined,
        photoUrl: c.photo_url ?? undefined,
        flagEmoji: c.flag_emoji,
        continent: c.continent,
        pins: (pins ?? []).map((p) => ({
          id: p.id,
          type: p.type as PinType,
          name: p.name,
          lat: p.lat,
          lng: p.lng,
          countryCode: p.country_code,
          note: p.note ?? undefined,
        })),
      });
      setLoading(false);
    }
    load();
  }, [user.id, code]);

  async function handleAddPin() {
    if (!newPin.name.trim()) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("pins")
      .insert({
        user_id: user.id,
        country_code: code,
        type: newPin.type,
        name: newPin.name.trim(),
        lat: 0,
        lng: 0,
        note: newPin.note || null,
      })
      .select()
      .single();
    if (data && country) {
      const pin: Pin = {
        id: data.id,
        type: data.type as PinType,
        name: data.name,
        lat: data.lat,
        lng: data.lng,
        countryCode: data.country_code,
        note: data.note ?? undefined,
      };
      setCountry({ ...country, pins: [...country.pins, pin] });
      await supabase
        .from("users")
        .update({ total_pins: user.totalPins + country.pins.length + 1 })
        .eq("id", user.id);
      const result = await grantXP(user.id, 20, user.xp, user.level);
      setXpResult(result);
    }
    setNewPin({ name: "", type: "travel", note: "" });
    setAddingPin(false);
  }

  if (loading)
    return (
      <div className="page-content flex items-center justify-center min-h-[400px]">
        <div className="text-[10px] text-white blink">CARREGANDO...</div>
      </div>
    );

  if (!country)
    return (
      <>
        <AddCountryForm
          code={code}
          userId={user.id}
          onAdded={setCountry}
          onBack={() => router.push("/")}
          onXpGranted={(r) => setXpResult(r)}
        />
        {xpResult && <XPToast result={xpResult} onDone={() => setXpResult(null)} />}
      </>
    );

  const filteredPins = country.pins.filter((p) => filter === "all" || p.type === filter);
  const presentTypes = PIN_TYPES.filter((t) => country.pins.some((p) => p.type === t));

  return (
    <div className="page-content flex flex-col gap-5">
      {xpResult && <XPToast result={xpResult} onDone={() => setXpResult(null)} />}
      <div className="page-header">
        <button
          onClick={() => router.push("/")}
          className="bg-transparent border-none text-white cursor-pointer text-base font-pixel"
        >
          ←
        </button>
        <div>
          <div className="flex items-center gap-3">
            <CountryFlag code={country.code} size={40} />
            <span className="page-title">{country.name}</span>
            {country.code === "BRA" && (
              <span className="pixel-badge" style={{ color: "#39ff14", borderColor: "#39ff14" }}>
                HOME
              </span>
            )}
          </div>
          <div className="text-[7px] text-white mt-[6px]">
            {country.continent} · VISITADO EM {country.visitedAt?.slice(0, 7)}
          </div>
        </div>
      </div>

      <div className="grid-2-desktop items-start">
        <Panel title="MAPA" accent="#00e5ff" noPad>
          <CountryMap country={country} />
        </Panel>
        <div className="flex flex-col gap-5">
          {country.photoUrl && (
            <Panel title="FOTO DA VISITA" accent="#39ff14" noPad>
              <div className="aspect-[4/3] overflow-hidden bg-[#01579b]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={country.photoUrl}
                  alt={`Foto em ${country.name}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </Panel>
          )}
          <Panel title="RESUMO DE PINS" accent="#ffd60a">
            <div className="flex flex-col gap-3">
              <div className="text-[8px] text-white">{country.pins.length} PINS REGISTRADOS</div>
              {presentTypes.map((type) => {
                const count = country.pins.filter((p) => p.type === type).length;
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-1">
                      <PixelPin type={type} size={20} />
                      <span className="text-[8px] flex-1" style={{ color: PIN_COLORS[type] }}>
                        {type.toUpperCase()}
                      </span>
                      <span className="text-[8px] text-white/50">{count}</span>
                    </div>
                    <div className="pixel-progress-track h-[6px]">
                      <div
                        className="h-full"
                        style={{
                          width: `${(count / country.pins.length) * 100}%`,
                          background: PIN_COLORS[type],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {presentTypes.length === 0 && (
                <div className="text-[8px] text-white">Nenhum pin ainda.</div>
              )}
            </div>
          </Panel>
        </div>
      </div>

      <Panel title={`PINS (${filteredPins.length})`} accent="#00e5ff">
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setFilter("all")}
            className="font-pixel text-[7px] px-3 py-[7px] cursor-pointer border-2"
            style={{
              borderColor: filter === "all" ? "#00e5ff" : "#1e6ea8",
              background: filter === "all" ? "#00e5ff22" : "#01579b",
              color: filter === "all" ? "#00e5ff" : "#ffffff",
            }}
          >
            TODOS ({country.pins.length})
          </button>
          {presentTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className="font-pixel text-[7px] px-3 py-[7px] cursor-pointer border-2"
              style={{
                borderColor: filter === type ? PIN_COLORS[type] : "#1e6ea8",
                background: filter === type ? `${PIN_COLORS[type]}22` : "#01579b",
                color: filter === type ? PIN_COLORS[type] : "#ffffff",
              }}
            >
              {PIN_ICONS[type]} {country.pins.filter((p) => p.type === type).length}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {filteredPins.map((pin) => (
            <div
              key={pin.id}
              className="bg-[#01579b] px-[18px] py-[14px] flex items-center gap-4 border-2"
              style={{ borderColor: `${PIN_COLORS[pin.type]}33` }}
            >
              <PixelPin type={pin.type} size={36} />
              <div className="flex-1">
                <div className="text-[10px] text-white mb-1">{pin.name}</div>
                <div className="flex gap-3 text-[7px]">
                  <span style={{ color: PIN_COLORS[pin.type] }}>{pin.type.toUpperCase()}</span>
                  {pin.note && <span className="text-white">{pin.note}</span>}
                </div>
              </div>
            </div>
          ))}

          {addingPin ? (
            <div className="bg-[#01579b] border-2 border-[#00e5ff] px-[18px] py-4 flex flex-col gap-3">
              <div className="text-[8px] text-[#00e5ff]">◆ NOVO PIN</div>
              <input
                value={newPin.name}
                onChange={(e) => setNewPin((p) => ({ ...p, name: e.target.value }))}
                placeholder=""
                className="w-full pixel-input"
                style={{ fontSize: 8 }}
              />
              <div className="flex gap-2 flex-wrap">
                {PIN_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewPin((p) => ({ ...p, type: t }))}
                    className="font-pixel text-[6px] px-[10px] py-[6px] cursor-pointer border-2"
                    style={{
                      borderColor: newPin.type === t ? PIN_COLORS[t] : "#1e6ea8",
                      background: newPin.type === t ? `${PIN_COLORS[t]}22` : "#0277bd",
                      color: newPin.type === t ? PIN_COLORS[t] : "#ffffff",
                    }}
                  >
                    {PIN_ICONS[t]} {t.toUpperCase()}
                  </button>
                ))}
              </div>
              <input
                value={newPin.note}
                onChange={(e) => setNewPin((p) => ({ ...p, note: e.target.value }))}
                placeholder=""
                className="w-full pixel-input"
                style={{ fontSize: 8, borderColor: "rgba(41,182,246,0.4)" }}
              />
              <div className="flex gap-[10px]">
                <button
                  onClick={handleAddPin}
                  className="flex-1 font-pixel text-[8px] p-[10px] border-2 border-[#39ff14] bg-[#39ff1411] text-[#39ff14] cursor-pointer"
                >
                  SALVAR
                </button>
                <button
                  onClick={() => setAddingPin(false)}
                  className="font-pixel text-[8px] px-[14px] py-[10px] border-2 border-[#ff4d6d44] bg-transparent text-[#ff4d6d] cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingPin(true)}
              className="w-full bg-transparent border-2 border-dashed border-[#1e6ea8] p-4 text-white font-pixel text-[8px] cursor-pointer"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#00e5ff";
                e.currentTarget.style.color = "#00e5ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1e6ea8";
                e.currentTarget.style.color = "#ffffff";
              }}
            >
              + ADICIONAR PIN
            </button>
          )}
        </div>
      </Panel>
    </div>
  );
}
