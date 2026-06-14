"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signup } from "@/app/actions/auth";
import { COUNTRIES_CATALOG, type CountryOption, countryFlagEmoji } from "@/lib/countries-catalog";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// eslint-disable-next-line @next/next/no-img-element
function FlagImg({ alpha2, size = 20 }: { alpha2: string; size?: number }) {
  const a2 = alpha2.toLowerCase();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${a2}.png`}
      srcSet={`https://flagcdn.com/w80/${a2}.png 2x`}
      alt=""
      width={size}
      height={Math.round(size * 0.72)}
      style={{ objectFit: "cover", borderRadius: 1, display: "block", flexShrink: 0 }}
    />
  );
}

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CountryOption | null>(null);
  const [open, setOpen] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = COUNTRIES_CATALOG.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  ).slice(0, 6);

  function pick(c: CountryOption) {
    setSelected(c);
    setOpen(false);
    setSearch("");
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    setSelected(null);
    setSearch("");
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) {
      setError("Selecione seu país de origem");
      return;
    }
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("home_code", selected.code);
    fd.set("home_name", selected.name);
    fd.set("home_flag", countryFlagEmoji(selected.alpha2));
    fd.set("home_continent", selected.continent);
    const res = await signup(fd);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-sky-600 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mb-3 text-5xl">🌍</div>
          <div className="text-xs tracking-[3px] text-cyan-300">MY NOMAD</div>
          <div className="mt-1 text-base tracking-[2px] text-slate-100">WORLD</div>
        </div>

        <div className="pixel-panel overflow-hidden">
          <div className="pixel-panel-header border-b-[#39ff14] text-[10px] text-[#39ff14]">
            CRIAR CONTA
          </div>

          <div className="px-6 py-7">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-2 block text-[7px] tracking-[1px] text-white">USERNAME</label>
                <input
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={20}
                  placeholder="NomadeViajante"
                  className="w-full pixel-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-[7px] tracking-[1px] text-white">EMAIL</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="seu@email.com"
                  className="w-full pixel-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-[7px] tracking-[1px] text-white">SENHA</label>
                <div className="pixel-input-wrap">
                  <input
                    name="password"
                    type={showPass ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="min. 6 caracteres"
                    className="px-3.5 py-3 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-white/40 hover:text-white/80 p-0 leading-none"
                  >
                    <EyeIcon open={showPass} />
                  </button>
                </div>
              </div>

              {/* Country searchable select */}
              <div>
                <label className="mb-2 block text-[7px] tracking-[1px] text-white">
                  🏠 PAÍS DE ORIGEM
                </label>
                <div ref={wrapRef} className="relative">
                  {/* Search — always visible */}
                  <div className="pixel-input-wrap">
                    <span className="pl-3 text-white/30 text-sm leading-none select-none shrink-0">
                      🔍
                    </span>
                    <input
                      ref={searchRef}
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setOpen(e.target.value.length > 0);
                      }}
                      onFocus={(e) => {
                        if (e.target.value.length > 0) setOpen(true);
                      }}
                      placeholder={selected ? "Trocar país..." : "Buscar país..."}
                      autoComplete="off"
                      className="px-2 py-3"
                    />
                  </div>

                  {/* Selected chip — shown below search */}
                  {selected && (
                    <div className="flex items-center gap-2 px-3 py-2 mt-1 border-2 border-[#39ff14] bg-[#39ff1411]">
                      <FlagImg alpha2={selected.alpha2} size={20} />
                      <span className="flex-1 text-[9px] text-[#39ff14]">{selected.name}</span>
                      <span className="text-[6px] text-white/40">{selected.continent}</span>
                      <button
                        type="button"
                        onClick={clear}
                        className="ml-1 border-none bg-transparent text-white/40 text-[10px] cursor-pointer leading-none hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Dropdown */}
                  {open && (
                    <div
                      className="absolute z-50 w-full border-2 border-sky-400 border-t-0 bg-[#01579b] shadow-[3px_3px_0_#014080]"
                      style={{ maxHeight: 220, overflowY: "auto" }}
                    >
                      {filtered.map((c, i) => (
                        <button
                          key={c.code}
                          type="button"
                          onMouseDown={() => pick(c)}
                          className="flex w-full items-center gap-3 px-4 py-[9px] border-none bg-transparent text-left cursor-pointer"
                          style={{
                            borderBottom:
                              i < filtered.length - 1 ? "1px solid rgba(41,182,246,0.15)" : "none",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#0277bd")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <FlagImg alpha2={c.alpha2} size={20} />
                          <span className="flex-1 text-[9px] text-slate-100 truncate">
                            {c.name}
                          </span>
                          <span className="text-[6px] text-white/40 shrink-0">{c.continent}</span>
                        </button>
                      ))}
                      {filtered.length === 0 && (
                        <div className="px-4 py-4 text-[8px] text-white/40 text-center">
                          Nenhum resultado
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="border-2 border-rose-500 bg-rose-500/10 px-3.5 py-2.5 text-[7px] leading-[1.8] text-rose-500">
                  ✕ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !selected}
                className={`mt-2 w-full border-2 border-[#39ff14] py-3.5 text-[10px] transition-all ${
                  loading || !selected
                    ? "cursor-not-allowed bg-sky-900 text-[#39ff1488]"
                    : "bg-[#39ff14]/10 text-[#39ff14] shadow-[3px_3px_0_#014080] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                }`}
              >
                {loading ? "CRIANDO..." : "► COMEÇAR AVENTURA"}
              </button>
            </form>

            <div className="mt-6 text-center text-[7px] text-white">
              JÁ TEM CONTA?{" "}
              <Link href="/login" className="text-cyan-300 no-underline">
                ENTRAR
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
