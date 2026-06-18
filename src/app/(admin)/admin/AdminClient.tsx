"use client";
import { useMemo, useState, useTransition } from "react";
import { createMissionForAll, restoreUser, softDeleteUser, toggleBanUser } from "./actions";

type AdminUser = {
  id: string;
  username: string;
  level: number;
  xp: number;
  rank: number;
  is_admin: boolean | null;
  is_banned: boolean | null;
  deleted_at: string | null;
  joined_at: string;
};

const DIFF_COLOR: Record<string, string> = {
  easy: "#39ff14",
  medium: "#ffd60a",
  hard: "#ff8c00",
  legendary: "#ff00ff",
};

const PAGE_SIZE = 15;

export default function AdminClient({ users: initialUsers }: { users: AdminUser[] }) {
  const [tab, setTab] = useState<"missions" | "users">("missions");
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [users, setUsers] = useState(initialUsers);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Users tab state
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = users;
    if (!showDeleted) list = list.filter((u) => !u.deleted_at);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((u) => u.username.toLowerCase().includes(q));
    }
    return list;
  }, [users, search, showDeleted]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageUsers = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function setFb(msg: string, ok = true) {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleCreateMission(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);
    startTransition(async () => {
      const result = await createMissionForAll(formData);
      if ("error" in result) {
        setFb(`Erro: ${result.error}`, false);
      } else {
        setFb(`✓ Missão criada para ${result.count} usuários`);
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  async function handleBan(userId: string, ban: boolean) {
    setActionPending(userId);
    const result = await toggleBanUser(userId, ban);
    setActionPending(null);
    if ("error" in result) {
      setFb(`Erro: ${result.error}`, false);
    } else {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_banned: ban } : u)));
    }
  }

  async function handleDelete(userId: string) {
    setConfirmId(null);
    setActionPending(userId);
    const result = await softDeleteUser(userId);
    setActionPending(null);
    if ("error" in result) {
      setFb(`Erro: ${result.error}`, false);
    } else {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, deleted_at: new Date().toISOString(), is_banned: true } : u,
        ),
      );
      setFb("Usuário removido (soft delete)");
    }
  }

  async function handleRestore(userId: string) {
    setActionPending(userId);
    const result = await restoreUser(userId);
    setActionPending(null);
    if ("error" in result) {
      setFb(`Erro: ${result.error}`, false);
    } else {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, deleted_at: null, is_banned: false } : u,
        ),
      );
      setFb("Usuário restaurado");
    }
  }

  const activeCount = users.filter((u) => !u.deleted_at).length;
  const deletedCount = users.filter((u) => u.deleted_at).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="text-[14px] text-white">PAINEL ADMIN</div>
        <div className="ml-auto flex gap-3 text-[7px]">
          <span className="text-[#39ff14]">{activeCount} ativos</span>
          {deletedCount > 0 && <span className="text-[#ff4d6d]">{deletedCount} removidos</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["missions", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="font-pixel text-[7px] px-4 py-2 border-2 cursor-pointer"
            style={{
              borderColor: tab === t ? "#ff00ff" : "#1e6ea8",
              background: tab === t ? "#ff00ff22" : "#01579b",
              color: tab === t ? "#ff00ff" : "#ffffff88",
            }}
          >
            {t === "missions" ? "⚡ CRIAR MISSÃO" : "👥 USUÁRIOS"}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className="font-pixel text-[8px] px-4 py-3 border-2"
          style={{
            borderColor: feedback.ok ? "#39ff14" : "#ff4d6d",
            color: feedback.ok ? "#39ff14" : "#ff4d6d",
            background: feedback.ok ? "#39ff1411" : "#ff4d6d11",
          }}
        >
          {feedback.msg}
        </div>
      )}

      {/* ── MISSIONS TAB ── */}
      {tab === "missions" && (
        <form onSubmit={handleCreateMission} className="pixel-panel p-6 flex flex-col gap-4">
          <div className="text-[9px] text-[#ff00ff] mb-2">NOVA MISSÃO → TODOS OS USUÁRIOS</div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="TÍTULO">
              <input name="title" required className="admin-input" placeholder="Ex: Visitante Global" />
            </Field>
            <Field label="ÍCONE (emoji)">
              <input name="icon" className="admin-input" placeholder="⚡" defaultValue="⚡" />
            </Field>
          </div>

          <Field label="DESCRIÇÃO">
            <textarea
              name="description"
              required
              rows={2}
              className="admin-input resize-none"
              placeholder="Descreva o objetivo da missão..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="TIPO">
              <select name="type" required className="admin-input">
                <option value="explore">explore</option>
                <option value="pin">pin</option>
                <option value="social">social</option>
                <option value="story">story</option>
              </select>
            </Field>
            <Field label="DIFICULDADE">
              <select name="difficulty" required className="admin-input">
                {Object.entries(DIFF_COLOR).map(([k, c]) => (
                  <option key={k} value={k} style={{ color: c }}>
                    {k.toUpperCase()}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="META (total)">
              <input name="total" type="number" required min={1} defaultValue={1} className="admin-input" />
            </Field>
            <Field label="XP RECOMPENSA">
              <input name="xpReward" type="number" required min={0} defaultValue={100} className="admin-input" />
            </Field>
          </div>

          <Field label="COINS RECOMPENSA">
            <input name="coinReward" type="number" required min={0} defaultValue={10} className="admin-input w-40" />
          </Field>

          <button
            type="submit"
            disabled={isPending}
            className="font-pixel text-[8px] px-6 py-3 border-2 border-[#ff00ff] bg-[#ff00ff22] text-[#ff00ff] cursor-pointer disabled:opacity-40 self-start mt-2"
          >
            {isPending ? "CRIANDO..." : "CRIAR PARA TODOS"}
          </button>
        </form>
      )}

      {/* ── USERS TAB ── */}
      {tab === "users" && (
        <div className="flex flex-col gap-4">
          {/* Toolbar */}
          <div className="flex gap-3 items-center flex-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="BUSCAR USUÁRIO..."
              className="admin-input flex-1 min-w-[180px]"
            />
            <button
              onClick={() => { setShowDeleted((v) => !v); setPage(1); }}
              className="font-pixel text-[7px] px-3 py-2 border-2 cursor-pointer shrink-0"
              style={{
                borderColor: showDeleted ? "#ff4d6d" : "#1e6ea8",
                color: showDeleted ? "#ff4d6d" : "#ffffff88",
                background: showDeleted ? "#ff4d6d11" : "#01579b",
              }}
            >
              {showDeleted ? "OCULTAR REMOVIDOS" : "VER REMOVIDOS"}
            </button>
          </div>

          {/* Results info */}
          <div className="text-[7px] text-white/30">
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} · página {safePage}/{totalPages}
          </div>

          {/* User rows */}
          <div className="flex flex-col gap-2">
            {pageUsers.length === 0 && (
              <div className="text-[8px] text-white/40 text-center py-10">
                Nenhum usuário encontrado.
              </div>
            )}

            {pageUsers.map((u) => {
              const isDeleted = !!u.deleted_at;
              const pending = actionPending === u.id;
              const confirming = confirmId === u.id;

              return (
                <div
                  key={u.id}
                  className="pixel-panel px-4 py-3 flex items-center gap-3"
                  style={{ opacity: isDeleted ? 0.5 : 1 }}
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] text-white truncate">{u.username}</span>
                      {u.is_admin && (
                        <span className="pixel-badge text-[#ff00ff] border-[#ff00ff]">ADMIN</span>
                      )}
                      {isDeleted && (
                        <span className="pixel-badge text-[#ff4d6d] border-[#ff4d6d]">REMOVIDO</span>
                      )}
                      {!isDeleted && u.is_banned && (
                        <span className="pixel-badge text-[#ff8c00] border-[#ff8c00]">BANIDO</span>
                      )}
                    </div>
                    <div className="text-[6px] text-white/30 mt-0.5">
                      LVL {u.level} · {u.xp} XP · #{u.rank} · {u.joined_at}
                      {isDeleted && u.deleted_at && (
                        <span className="text-[#ff4d6d]"> · removido {u.deleted_at.slice(0, 10)}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!u.is_admin && (
                    <div className="flex gap-2 shrink-0">
                      {isDeleted ? (
                        <button
                          onClick={() => handleRestore(u.id)}
                          disabled={pending}
                          className="font-pixel text-[6px] px-2 py-1.5 border-2 border-[#39ff14] text-[#39ff14] bg-[#39ff1411] cursor-pointer disabled:opacity-40"
                        >
                          {pending ? "..." : "RESTAURAR"}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleBan(u.id, !u.is_banned)}
                            disabled={pending}
                            className="font-pixel text-[6px] px-2 py-1.5 border-2 cursor-pointer disabled:opacity-40"
                            style={{
                              borderColor: u.is_banned ? "#39ff14" : "#ff8c00",
                              color: u.is_banned ? "#39ff14" : "#ff8c00",
                              background: u.is_banned ? "#39ff1411" : "#ff8c0011",
                            }}
                          >
                            {pending ? "..." : u.is_banned ? "DESBANIR" : "BANIR"}
                          </button>

                          {confirming ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDelete(u.id)}
                                disabled={pending}
                                className="font-pixel text-[6px] px-2 py-1.5 border-2 border-[#ff4d6d] text-[#ff4d6d] bg-[#ff4d6d22] cursor-pointer disabled:opacity-40"
                              >
                                CONFIRMAR
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="font-pixel text-[6px] px-2 py-1.5 border-2 border-white/20 text-white/40 cursor-pointer"
                              >
                                NÃO
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmId(u.id)}
                              disabled={pending}
                              className="font-pixel text-[6px] px-2 py-1.5 border-2 border-[#ff4d6d44] text-[#ff4d6d] bg-transparent cursor-pointer disabled:opacity-40"
                            >
                              REMOVER
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="font-pixel text-[7px] px-3 py-2 border-2 border-[#1e6ea8] text-white/60 bg-[#01579b] cursor-pointer disabled:opacity-30"
              >
                ← ANT
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "…" ? (
                      <span key={`ellipsis-${idx}`} className="font-pixel text-[7px] text-white/30 px-1 py-2">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className="font-pixel text-[7px] w-8 py-2 border-2 cursor-pointer"
                        style={{
                          borderColor: safePage === p ? "#ff00ff" : "#1e6ea8",
                          background: safePage === p ? "#ff00ff22" : "#01579b",
                          color: safePage === p ? "#ff00ff" : "#ffffff88",
                        }}
                      >
                        {p}
                      </button>
                    ),
                  )}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="font-pixel text-[7px] px-3 py-2 border-2 border-[#1e6ea8] text-white/60 bg-[#01579b] cursor-pointer disabled:opacity-30"
              >
                PRÓ →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-pixel text-[6px] text-white/50">{label}</label>
      {children}
    </div>
  );
}
