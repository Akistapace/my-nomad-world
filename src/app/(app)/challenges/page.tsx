"use client";
import XPToast from "@/components/XPToast";
import { useUser } from "@/lib/context/user-context";
import { createClient } from "@/lib/supabase/client";
import type { Challenge } from "@/lib/types";
import { grantXP, type XPResult } from "@/lib/xp";
import { useEffect, useMemo, useState } from "react";

type Filter = "all" | "pending" | "completed";

const DIFF_COLOR: Record<Challenge["difficulty"], string> = {
  easy: "#39ff14",
  medium: "#ffd60a",
  hard: "#ff8c00",
  legendary: "#ff00ff",
};

const DIFF_LABEL: Record<Challenge["difficulty"], string> = {
  easy: "FÁCIL",
  medium: "MÉDIO",
  hard: "DIFÍCIL",
  legendary: "LENDÁRIO",
};

export default function ChallengesPage() {
  const user = useUser();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [completing, setCompleting] = useState<string | null>(null);
  const [xpResult, setXpResult] = useState<XPResult | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("challenges")
        .select("*")
        .eq("user_id", user.id)
        .order("completed", { ascending: true })
        .order("created_at", { ascending: true });
      setChallenges(
        (data ?? []).map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          type: c.type as Challenge["type"],
          difficulty: c.difficulty as Challenge["difficulty"],
          icon: c.icon,
          progress: c.progress,
          total: c.total,
          xpReward: c.xp_reward,
          coinReward: c.coin_reward,
          completed: c.completed,
        }))
      );
      setLoading(false);
    }
    load();
  }, [user.id]);

  async function handleComplete(challenge: Challenge) {
    if (challenge.completed || completing) return;
    setCompleting(challenge.id);
    const supabase = createClient();
    await supabase
      .from("challenges")
      .update({ completed: true, progress: challenge.total })
      .eq("id", challenge.id);
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challenge.id ? { ...c, completed: true, progress: c.total } : c
      )
    );
    const result = await grantXP(user.id, challenge.xpReward, user.xp, user.level);
    setXpResult(result);
    setCompleting(null);
  }

  const filtered = useMemo(() => {
    if (filter === "pending") return challenges.filter((c) => !c.completed);
    if (filter === "completed") return challenges.filter((c) => c.completed);
    return challenges;
  }, [challenges, filter]);

  const totalCompleted = challenges.filter((c) => c.completed).length;

  if (loading) return (
    <div className="page-content flex items-center justify-center min-h-[400px]">
      <div className="text-[10px] text-white blink">CARREGANDO...</div>
    </div>
  );

  return (
    <div className="page-content flex flex-col gap-5">
      {xpResult && <XPToast result={xpResult} onDone={() => setXpResult(null)} />}

      <div className="page-header">
        <div className="page-title">⚡ MISSÕES</div>
        <div className="ml-auto text-[8px] text-white">
          {totalCompleted}/{challenges.length} COMPLETAS
        </div>
      </div>

      {/* Progress summary */}
      <div className="pixel-panel">
        <div className="p-5 flex items-center gap-5">
          <div className="flex-1">
            <div className="flex justify-between text-[8px] text-white/50 mb-2">
              <span>PROGRESSO GERAL</span>
              <span className="text-[#ffd60a]">{totalCompleted}/{challenges.length}</span>
            </div>
            <div className="pixel-progress-track">
              <div
                className="pixel-progress-fill xp-bar-fill bg-[linear-gradient(90deg,#ffd60a,#ff8c00)]"
                style={{ width: challenges.length ? `${(totalCompleted / challenges.length) * 100}%` : "0%" }}
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[28px] text-[#ffd60a]">
              {challenges.length ? Math.round((totalCompleted / challenges.length) * 100) : 0}%
            </div>
            <div className="text-[6px] text-white/40 mt-1">CONCLUÍDO</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {([
          { key: "all", label: `TODOS (${challenges.length})` },
          { key: "pending", label: `PENDENTES (${challenges.length - totalCompleted})` },
          { key: "completed", label: `CONCLUÍDAS (${totalCompleted})` },
        ] as { key: Filter; label: string }[]).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="font-pixel text-[6px] px-3 py-2 border-2 cursor-pointer"
            style={{
              borderColor: filter === f.key ? "#ffd60a" : "#1e6ea8",
              background: filter === f.key ? "#ffd60a22" : "#01579b",
              color: filter === f.key ? "#ffd60a" : "#ffffff88",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Virtualized list (CSS scroll) */}
      <div
        className="flex flex-col gap-3 overflow-y-auto pr-1"
        style={{ maxHeight: "calc(100dvh - 320px)", minHeight: 200 }}
      >
        {filtered.length === 0 && (
          <div className="text-[8px] text-white/40 text-center py-10">Nenhum desafio nesta categoria.</div>
        )}

        {filtered.map((challenge) => {
          const pct = Math.min((challenge.progress / challenge.total) * 100, 100);
          const dColor = DIFF_COLOR[challenge.difficulty];
          const isCompleting = completing === challenge.id;

          return (
            <div
              key={challenge.id}
              className="pixel-panel relative overflow-hidden"
              style={{
                opacity: challenge.completed ? 0.7 : 1,
                borderColor: challenge.completed ? "#39ff1444" : undefined,
              }}
            >
              <div className="px-5 py-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-[26px] leading-none shrink-0">{challenge.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] text-white">{challenge.title}</span>
                      <span className="pixel-badge shrink-0" style={{ color: dColor, borderColor: dColor }}>
                        {DIFF_LABEL[challenge.difficulty]}
                      </span>
                      {challenge.completed && (
                        <span className="pixel-badge text-[#39ff14] border-[#39ff14]">✓ COMPLETO</span>
                      )}
                    </div>
                    <div className="text-[8px] text-white/50 leading-[1.8]">{challenge.description}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-[7px] text-white/50 mb-1">
                    <span>PROGRESSO</span>
                    <span style={{ color: dColor }}>
                      {Math.min(challenge.progress, challenge.total)} / {challenge.total}
                    </span>
                  </div>
                  <div className="pixel-progress-track">
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: challenge.completed
                          ? "#39ff14"
                          : `linear-gradient(90deg,${dColor},${dColor}99)`,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[8px] text-[#ffd60a]">⭐ +{challenge.xpReward} XP</span>
                  <span className="text-[8px] text-[#ff8c00]">🪙 +{challenge.coinReward}</span>
                  {!challenge.completed && (
                    <button
                      onClick={() => handleComplete(challenge)}
                      disabled={!!completing}
                      className="ml-auto font-pixel text-[7px] px-3 py-2 border-2 border-[#39ff14] bg-[#39ff1411] text-[#39ff14] cursor-pointer disabled:opacity-40"
                    >
                      {isCompleting ? "..." : "✓ COMPLETAR"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
