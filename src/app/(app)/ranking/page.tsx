"use client";
import PixelCharacter from "@/components/PixelCharacter";
import { useUser } from "@/lib/context/user-context";
import { createClient } from "@/lib/supabase/client";
import type { Character } from "@/lib/types";
import { useEffect, useState } from "react";

const MEDAL_COLOR = ["#ffd60a", "#b0b8c8", "#cd7f32"];
const MEDAL_ICON = ["🥇", "🥈", "🥉"];
const DEFAULT_CHARACTER: Character = { skin: "adventurer", color: "blue", hat: false, backpack: false };

interface RankPlayer {
  id: string;
  username: string;
  character: Character;
  level: number;
  xp: number;
  rank: number;
  countriesCount: number;
  isMe: boolean;
}

function Panel({ title, accent = "#00e5ff", children, noPad }: {
  title?: string; accent?: string; children: React.ReactNode; noPad?: boolean;
}) {
  return (
    <div className="pixel-panel overflow-hidden">
      {title && <div className="pixel-panel-header" style={{ borderBottomColor: accent, color: accent }}>{title}</div>}
      <div className={noPad ? undefined : "p-5"}>{children}</div>
    </div>
  );
}

function LeaderboardTable({ rows, showPodium }: { rows: RankPlayer[]; showPodium: boolean }) {
  const top3 = rows.slice(0, 3);
  return (
    <>
      {showPodium && top3.length >= 3 && (
        <Panel noPad>
          <div className="bg-[linear-gradient(180deg,#ffd60a11_0%,transparent_60%)] px-4 pt-6 pb-0">
            <div className="text-[9px] text-[#ffd60a] text-center mb-5 tracking-[3px]">★ TOP 3 ★</div>
            <div className="flex items-end justify-center gap-4">
              {[top3[1], top3[0], top3[2]].map((player, i) => {
                const rank = [2, 1, 3][i];
                const mIdx = rank - 1;
                const heights = [100, 140, 80];
                const charSizes = [60, 80, 52];
                return (
                  <div key={player.id} className="flex flex-col items-center gap-[6px]" style={{ flex: rank === 1 ? "0 0 140px" : "0 0 110px" }}>
                    <span className="text-2xl">{MEDAL_ICON[mIdx]}</span>
                    <div className="bg-[#01579b] p-2" style={{ border: `2px solid ${MEDAL_COLOR[mIdx]}` }}>
                      <PixelCharacter character={player.character} size={charSizes[i]} />
                    </div>
                    <div className="text-center leading-[1.6] max-w-[120px]" style={{ fontSize: rank === 1 ? 8 : 7, color: MEDAL_COLOR[mIdx] }}>
                      @{player.username}{player.isMe && " ◄"}
                    </div>
                    <div className="text-[7px] text-white/50">🌍 {player.countriesCount}</div>
                    <div className="w-full flex items-center justify-center"
                      style={{ height: heights[i], background: `${MEDAL_COLOR[mIdx]}18`, border: `2px solid ${MEDAL_COLOR[mIdx]}`, borderBottom: "none" }}>
                      <span className="text-[22px]" style={{ color: MEDAL_COLOR[mIdx] }}>#{rank}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      )}

      <Panel noPad>
        <div className="grid gap-2 px-5 py-[10px] bg-[#01579b] border-b-2 border-b-[#29b6f644] text-[7px] text-white tracking-[1px]"
          style={{ gridTemplateColumns: "52px 44px 1fr 80px 80px" }}>
          <div>RANK</div><div></div><div>JOGADOR</div><div className="text-center">PAÍSES</div><div className="text-right">XP</div>
        </div>
        {rows.length === 0 && (
          <div className="px-5 py-8 text-[8px] text-white/40 text-center">Nenhum jogador ainda.</div>
        )}
        {rows.map((player, i) => (
          <div key={player.id} className="grid items-center gap-2 px-5 py-[10px]"
            style={{
              gridTemplateColumns: "52px 44px 1fr 80px 80px",
              background: player.isMe ? "#00e5ff11" : i % 2 === 0 ? "#0277bd44" : "transparent",
              borderLeft: player.isMe ? "4px solid #00e5ff" : "4px solid transparent",
              borderBottom: i < rows.length - 1 ? "1px solid #29b6f618" : "none",
            }}>
            <div className="text-[9px]" style={{ color: player.isMe ? "#00e5ff" : "rgba(255,255,255,0.5)" }}>#{player.rank}</div>
            <div><PixelCharacter character={player.character} size={36} /></div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px]" style={{ color: player.isMe ? "#00e5ff" : "#ffffff" }}>
                  {player.isMe ? "► " : ""}@{player.username}
                </span>
                {player.isMe && <span className="pixel-badge text-[#00e5ff] border-[#00e5ff] bg-[#00e5ff11]">VOCÊ</span>}
              </div>
              <div className="text-[6px] text-white/50">LVL {player.level}</div>
            </div>
            <div className="text-center text-[8px] text-white/50">🌍 {player.countriesCount}</div>
            <div className="text-right text-[8px] text-[#ffd60a]">⭐ {player.xp}</div>
          </div>
        ))}
      </Panel>
    </>
  );
}

export default function RankingPage() {
  const user = useUser();
  const [tab, setTab] = useState<"global" | "friends">("global");
  const [globalPlayers, setGlobalPlayers] = useState<RankPlayer[]>([]);
  const [friendPlayers, setFriendPlayers] = useState<RankPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendsLoaded, setFriendsLoaded] = useState(false);

  useEffect(() => {
    async function loadGlobal() {
      const supabase = createClient();
      const { data: users } = await supabase
        .from("users").select("id, username, character, level, xp, rank")
        .order("xp", { ascending: false }).limit(50);

      if (!users || users.length === 0) { setLoading(false); return; }

      // If current user not in top 50, fetch their row separately
      let allUsers = users;
      const alreadyIn = users.some((u) => u.id === user.id);
      if (!alreadyIn) {
        const { data: meRow } = await supabase
          .from("users").select("id, username, character, level, xp, rank").eq("id", user.id).single();
        if (meRow) allUsers = [...users, meRow];
      }

      const userIds = allUsers.map((u) => u.id);
      const { data: visitedRows } = await supabase
        .from("countries").select("user_id").in("user_id", userIds).eq("visited", true);

      const countByUser: Record<string, number> = {};
      (visitedRows ?? []).forEach((r) => { countByUser[r.user_id] = (countByUser[r.user_id] ?? 0) + 1; });

      setGlobalPlayers(allUsers.map((u, i) => ({
        id: u.id, username: u.username,
        character: (u.character as unknown as Character) ?? DEFAULT_CHARACTER,
        level: u.level, xp: u.xp, rank: i + 1,
        countriesCount: countByUser[u.id] ?? 0,
        isMe: u.id === user.id,
      })));
      setLoading(false);
    }
    loadGlobal();
  }, [user.id]);

  async function loadFriends() {
    if (friendsLoaded) return;
    setLoadingFriends(true);
    const supabase = createClient();

    const { data: friendRows } = await supabase.from("friends").select("friend_id").eq("user_id", user.id);
    const friendIds = (friendRows ?? []).map((r) => r.friend_id);

    const profiles = friendIds.length > 0
      ? (await supabase.from("users").select("id, username, character, level, xp, rank").in("id", friendIds)).data ?? []
      : [];

    const allIds = [user.id, ...friendIds];
    const { data: visitedRows } = await supabase.from("countries").select("user_id").in("user_id", allIds).eq("visited", true);
    const countByUser: Record<string, number> = {};
    (visitedRows ?? []).forEach((r) => { countByUser[r.user_id] = (countByUser[r.user_id] ?? 0) + 1; });

    const meEntry: RankPlayer = {
      id: user.id, username: user.username, character: user.character,
      level: user.level, xp: user.xp, rank: user.rank,
      countriesCount: countByUser[user.id] ?? 0, isMe: true,
    };

    const friendEntries: RankPlayer[] = profiles.map((u) => ({
      id: u.id, username: u.username,
      character: (u.character as unknown as Character) ?? DEFAULT_CHARACTER,
      level: u.level, xp: u.xp, rank: u.rank,
      countriesCount: countByUser[u.id] ?? 0, isMe: false,
    }));

    const sorted = [meEntry, ...friendEntries].sort((a, b) => b.xp - a.xp).map((p, i) => ({ ...p, rank: i + 1 }));
    setFriendPlayers(sorted);
    setFriendsLoaded(true);
    setLoadingFriends(false);
  }

  function handleTabChange(t: "global" | "friends") {
    setTab(t);
    if (t === "friends") loadFriends();
  }

  if (loading) return (
    <div className="page-content flex items-center justify-center min-h-[400px]">
      <div className="text-[10px] text-white blink">CARREGANDO...</div>
    </div>
  );

  return (
    <div className="page-content flex flex-col gap-5">
      <div className="page-header">
        <div className="page-title">🏆 RANKING</div>
        <div className="ml-auto text-[8px] text-white">{globalPlayers.length} JOGADORES</div>
      </div>

      <div className="pixel-tabs">
        {([
          { key: "global", label: "🌍 GLOBAL" },
          { key: "friends", label: "👥 AMIGOS" },
        ] as const).map((t) => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => handleTabChange(t.key)} className="pixel-tab"
              style={{ background: active ? "#00e5ff11" : "#0277bd", color: active ? "#00e5ff" : "#fff", borderBottom: active ? "3px solid #00e5ff" : "3px solid transparent" }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "global" && <LeaderboardTable rows={globalPlayers} showPodium />}

      {tab === "friends" && (
        loadingFriends
          ? <div className="text-[10px] text-white blink text-center py-10">CARREGANDO...</div>
          : <LeaderboardTable rows={friendPlayers} showPodium={friendPlayers.length >= 3} />
      )}
    </div>
  );
}
