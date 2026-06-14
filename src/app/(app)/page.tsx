"use client";
import AddCountryModal from "@/components/AddCountryModal";
import WorldGlobe from "@/components/WorldGlobe";
import XPToast from "@/components/XPToast";
import { useUser } from "@/lib/context/user-context";
import { rotationForCountry } from "@/lib/country-centers";
import { createClient } from "@/lib/supabase/client";
import type { Country, Pin, PinType } from "@/lib/types";
import type { XPResult } from "@/lib/xp";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const user = useUser();
  const xpPct = (user.xp / user.xpToNext) * 100;
  const [countries, setCountries] = useState<Country[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [xpResult, setXpResult] = useState<XPResult | null>(null);

  // homeCode and initial globe rotation come from server-side context — no async race
  const homeCode = user.homeCode;
  const initialRotation = useMemo<[number, number, number]>(
    () => homeCode ? rotationForCountry(homeCode) : [-45, -10, 0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // compute once at mount — homeCode is stable server value
  );

  const fetchMap = useCallback(async () => {
    const supabase = createClient();

    const [{ data: dbCountries }, { data: dbPins }] = await Promise.all([
      supabase.from("countries").select("*").eq("user_id", user.id).eq("visited", true),
      supabase.from("pins").select("*").eq("user_id", user.id),
    ]);

    const pinsByCountry: Record<string, Pin[]> = {};
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
      }))
    );
  }, [user.id]);

  useEffect(() => {
    fetchMap();
  }, [fetchMap]);

  function handleCountryAdded(country: Country) {
    setCountries((prev) => [...prev, country]);
    router.refresh();
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-[#0288d1]">
      {/* Top bar — mobile only */}
      <div className="app-bottom-nav flex items-center gap-0 border-b-2 border-b-[#29b6f644] bg-[linear-gradient(to_bottom,#0277bd,#0288d1)] shrink-0 static shadow-none border-t-0">
        <div className="flex-1 flex flex-col items-center justify-center py-[10px] px-2 gap-1">
          <span className="text-[14px]">🌍</span>
          <span className="text-[5px] text-white">MY NOMAD</span>
        </div>
        <div className="[flex:2] py-[10px] px-2 flex flex-col gap-[3px]">
          <div className="flex justify-between text-[5px] text-white">
            <span>XP</span><span>{user.xp}/{user.xpToNext}</span>
          </div>
          <div className="h-[5px] bg-[#01579b] overflow-hidden">
            <div className="xp-bar-fill h-full bg-[linear-gradient(90deg,#00e5ff,#bf5af2)]" style={{ width: `${xpPct}%` }} />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-[10px] px-2 gap-1">
          <span className="text-[14px]">⭐</span>
          <span className="text-[5px] text-[#ffd60a]">LVL {user.level}</span>
        </div>
        <div className="flex flex-col items-center justify-center py-[10px] px-2 gap-1">
          <span className="text-[14px]">🏆</span>
          <span className="text-[5px] text-white">#{user.rank}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-[10px] px-2 gap-1">
          <span className="text-[14px]">👤</span>
          <span className="text-[5px] text-[#00e5ff] text-center">{user.username.slice(0, 8)}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden relative">
        <WorldGlobe
          countries={countries}
          onCountryClick={(code) => router.push(`/country/${code.toLowerCase()}`)}
          initialRotation={initialRotation}
          homeCode={homeCode}
        />

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="absolute bottom-4 right-4 z-10 font-pixel text-[22px] leading-none py-3 px-[14px] border-2 border-[#39ff14] bg-[linear-gradient(to_bottom,#01579bee,#0277bdee)] text-[#39ff14] cursor-pointer shadow-[0_4px_0_#014080]"
        >
          +
        </button>
      </div>

      <AddCountryModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        visitedCodes={countries.map((c) => c.code)}
        onAdded={handleCountryAdded}
        onXpGranted={(r) => setXpResult(r)}
      />
      {xpResult && <XPToast result={xpResult} onDone={() => setXpResult(null)} />}

      <div className="shrink-0 flex justify-center gap-6 py-[10px] text-[7px] text-white border-t-2 border-t-[#29b6f644] bg-[#0277bd88]">
        <span>🌍 {user.countriesCount} países</span>
        <span>📍 {user.totalPins} pins</span>
        <span>↔ arraste para girar</span>
      </div>
    </div>
  );
}
