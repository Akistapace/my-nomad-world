"use client";

import CountryFlag from "@/components/CountryFlag";
import {
  COUNTRIES_CATALOG,
  countryFlagEmoji,
  type CountryOption,
} from "@/lib/countries-catalog";
import { useUser } from "@/lib/context/user-context";
import { COUNTRY_CENTERS } from "@/lib/country-centers";
import { createClient } from "@/lib/supabase/client";
import type { Country, PinType } from "@/lib/types";
import { grantXP, type XPResult } from "@/lib/xp";
import { useMemo, useRef, useState } from "react";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface Props {
  open: boolean;
  onClose: () => void;
  visitedCodes: string[];
  onAdded: (country: Country) => void;
  onXpGranted?: (result: XPResult) => void;
}

const formatDate = () => {
  const today = new Date();
  return `${String(today.getDate()).padStart(2, "0")}/${String(
    today.getMonth() + 1
  ).padStart(2, "0")}/${today.getFullYear()}`;
};

export default function AddCountryModal({
  open,
  onClose,
  visitedCodes,
  onAdded,
  onXpGranted,
}: Props) {
  const profile = useUser();
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CountryOption | null>(null);
  const [visitedAt, setVisitedAt] = useState(formatDate());
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [day, month, year] = visitedAt.split("/");

  const available = useMemo(() => {
    const visited = new Set(visitedCodes);
    const q = search.trim().toLowerCase();

    return COUNTRIES_CATALOG.filter((c) => {
      if (visited.has(c.code)) return false;
      if (!q) return true;

      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.continent.toLowerCase().includes(q)
      );
    });
  }, [search, visitedCodes]);

  function handleDateChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);

    let formatted = digits;

    if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }

    setVisitedAt(formatted);
  }

  function resetForm() {
    setSearch("");
    setSelected(null);
    setVisitedAt(new Date().toISOString().slice(0, 10));
    setPhoto(null);

    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);

    setError(null);

    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handlePhotoChange(file: File | null) {
    setError(null);

    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPhoto(null);

    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Formato inválido. Use JPG, PNG, WEBP ou GIF.");
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      setError("Foto muito grande. Máximo 5 MB.");
      return;
    }

    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    setError(null);

    if (!selected) return setError("Selecione um país.");
    if (!photo) return setError("A foto é obrigatória.");

    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sessão expirada. Faça login novamente.");
      setSaving(false);
      return;
    }

    const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${selected.code}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("country-photos")
      .upload(path, photo, { upsert: false, contentType: photo.type });

    if (uploadError) {
      setError("Erro ao enviar foto. Tente novamente.");
      setSaving(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("country-photos")
      .getPublicUrl(path);

    const flagEmoji = countryFlagEmoji(selected.alpha2);

    const formattedDate =
      day && month && year ? `${year}-${month}-${day}` : null;

    const { data, error: insertError } = await supabase
      .from("countries")
      .insert({
        user_id: user.id,
        code: selected.code,
        name: selected.name,
        flag_emoji: flagEmoji,
        continent: selected.continent,
        visited: true,
        visited_at: formattedDate,
        photo_url: urlData.publicUrl,
      })
      .select()
      .single();

    if (insertError) {
      await supabase.storage.from("country-photos").remove([path]);

      setError(
        insertError.code === "23505"
          ? "Você já registrou este país."
          : "Erro ao salvar país. Tente novamente."
      );

      setSaving(false);
      return;
    }

    const center = COUNTRY_CENTERS[selected.code];
    const { data: pinData } = await supabase.from("pins").insert({
      user_id: user.id,
      country_code: selected.code,
      type: "travel",
      name: `Visita a ${selected.name}`,
      lat: center ? center[1] : 0,
      lng: center ? center[0] : 0,
      note: formattedDate ?? undefined,
    }).select().single();

    onAdded({
      code: data.code,
      name: data.name,
      visited: data.visited,
      visitedAt: data.visited_at ?? undefined,
      flagEmoji: data.flag_emoji,
      continent: data.continent,
      photoUrl: data.photo_url ?? undefined,
      pins: pinData ? [{
        id: pinData.id,
        type: "travel" as PinType,
        name: pinData.name,
        lat: pinData.lat,
        lng: pinData.lng,
        countryCode: data.code,
        note: pinData.note ?? undefined,
      }] : [],
    });

    const xpResult = await grantXP(user.id, 100, profile.xp, profile.level);
    onXpGranted?.(xpResult);

    resetForm();
    onClose();
    setSaving(false);
  }

  if (!open) return null;

  const formattedDate =
    day && month && year ? `${year}-${month}-${day}` : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(1,87,155,0.85)]"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto border-2 border-[#00e5ff] bg-[#01579b]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b-2 border-[#00e5ff] text-[#00e5ff] px-4 py-3 text-[10px]">
          ◆ ADICIONAR PAÍS
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* PAÍS */}
          <div>
            <div className="text-[7px] text-white/60 mb-2">PAÍS</div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder=""
              className="w-full pixel-input"
              style={{ fontSize: 8 }}
            />

            <div className="mt-2 max-h-36 overflow-y-auto border-2 border-white/25">
              {available.length === 0 ? (
                <div className="p-3 text-[7px] text-white">
                  Nenhum país encontrado.
                </div>
              ) : (
                available.map((c) => {
                  const isActive = selected?.code === c.code;

                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelected(c)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 border-b border-white/20 text-left font-['Press_Start_2P'] text-[7px] ${
                        isActive
                          ? "bg-[#00e5ff22] text-[#00e5ff]"
                          : "text-white"
                      }`}
                    >
                      <CountryFlag code={c.alpha2} size={28} />
                      <span className="flex-1">{c.name}</span>
                      <span className="text-[6px] text-white/60">
                        {c.continent}
                      </span>
                      {isActive && (
                        <span className="ml-2 text-[#39ff14] text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* DATA */}
          <div>
            <div className="text-[7px] text-white/60 mb-2">
              DATA DA VISITA
            </div>

            <input
              value={visitedAt}
              onChange={(e) => handleDateChange(e.target.value)}
              placeholder=""
              maxLength={10}
              className="w-full pixel-input"
              style={{ fontSize: 8 }}
            />
          </div>

          {/* FOTO */}
          <div>
            <div className="text-[7px] text-white/60 mb-2">
              FOTO * <span className="text-[#ffd60a]">(obrigatória)</span>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              onChange={(e) =>
                handlePhotoChange(e.target.files?.[0] ?? null)
              }
              className="w-full bg-[#0277bd] border-2 border-white px-3 py-2 text-[8px] text-white font-['Press_Start_2P']"
            />

            {preview && (
              <div className="mt-2 border-2 border-[#00e5ff] overflow-hidden aspect-[4/3] bg-[#01579b]">
                <img
                  src={preview}
                  alt="Prévia da foto"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="text-[7px] text-[#ff4d6d]">{error}</div>
          )}

          {/* BUTTONS */}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 font-['Press_Start_2P'] text-[8px] p-3 border-2 border-[#39ff14] text-[#39ff14] bg-[#39ff1411] disabled:bg-[#39ff1408] cursor-pointer"
            >
              {saving ? "SALVANDO..." : "✓ SALVAR"}
            </button>

            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="px-4 py-3 border-2 border-[#ff4d6d44] text-[#ff4d6d] font-['Press_Start_2P'] text-[8px]"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}