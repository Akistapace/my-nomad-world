"use client";

import { login } from "@/app/actions/auth";
import Link from "next/link";
import { useState } from "react";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await login(formData);
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-sky-600 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mb-3 text-5xl">🌍</div>
          <div className="text-xs tracking-[3px] text-cyan-300">MY NOMAD</div>
          <div className="mt-1 text-base tracking-[2px] text-slate-100">WORLD</div>
          <div className="mt-2.5 text-[7px] tracking-[1px] text-slate-500">GAMIFY YOUR TRAVELS</div>
        </div>

        <div className="pixel-panel overflow-hidden">
          <div className="pixel-panel-header text-[10px]">LOGIN</div>

          <div className="px-6 py-7">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-2 block text-[7px] tracking-[1px] text-slate-500">EMAIL</label>
                <input name="email" type="email" required placeholder="seu@email.com" className="w-full pixel-input" />
              </div>

              <div>
                <label className="mb-2 block text-[7px] tracking-[1px] text-slate-500">SENHA</label>
                <div className="pixel-input-wrap">
                  <input name="password" type={showPass ? "text" : "password"} required placeholder="••••••••"
                    className="px-3.5 py-3 pr-10" />
                  <button type="button" onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-white/40 hover:text-white/80 p-0 leading-none">
                    <EyeIcon open={showPass} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="border-2 border-rose-500 bg-rose-500/10 px-3.5 py-2.5 text-[7px] leading-[1.8] text-rose-500">
                  ✕ {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className={`mt-2 w-full border-2 border-cyan-300 py-3.5 text-[10px] transition-all ${
                  loading ? "cursor-not-allowed bg-sky-900 text-slate-500"
                  : "bg-cyan-300/10 text-cyan-300 shadow-[3px_3px_0_#014080] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                }`}>
                {loading ? "ENTRANDO..." : "► ENTRAR"}
              </button>
            </form>

            <div className="mt-6 text-center text-[7px] text-white">
              SEM CONTA?{" "}
              <Link href="/signup" className="text-cyan-300 no-underline">CRIAR AGORA</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
