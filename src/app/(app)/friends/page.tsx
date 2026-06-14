"use client";
import PixelCharacter from "@/components/PixelCharacter";
import XPToast from "@/components/XPToast";
import { useUser } from "@/lib/context/user-context";
import { createClient } from "@/lib/supabase/client";
import type { Character, Friend } from "@/lib/types";
import { grantXP, type XPResult } from "@/lib/xp";
import { useEffect, useState } from "react";

const DEFAULT_CHARACTER: Character = { skin: "adventurer", color: "blue", hat: false, backpack: false };

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

export default function FriendsPage() {
  const user = useUser();
  const [tab, setTab] = useState<"friends" | "search">("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [xpResult, setXpResult] = useState<XPResult | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: friendRows } = await supabase
        .from("friends")
        .select("friend_id")
        .eq("user_id", user.id);

      const friendIds = (friendRows ?? []).map((r) => r.friend_id);
      setFriendIds(new Set(friendIds));
      if (friendIds.length === 0) { setLoading(false); return; }

      const { data: profiles } = await supabase
        .from("users")
        .select("id, username, character, level, xp, rank")
        .in("id", friendIds);

      const friendProfiles: Friend[] = (profiles ?? []).map((u) => ({
        id: u.id,
        username: u.username,
        character: (u.character as unknown as Character) ?? DEFAULT_CHARACTER,
        level: u.level,
        xp: u.xp,
        countriesCount: 0,
        rank: u.rank,
        isOnline: false,
      }));

      const { data: visitedRows } = await supabase
        .from("countries")
        .select("user_id")
        .in("user_id", friendIds)
        .eq("visited", true);

      const countByUser: Record<string, number> = {};
      (visitedRows ?? []).forEach((r) => { countByUser[r.user_id] = (countByUser[r.user_id] ?? 0) + 1; });
      friendProfiles.forEach((f) => { f.countriesCount = countByUser[f.id] ?? 0; });

      setFriends(friendProfiles);
      setLoading(false);
    }
    load();
  }, [user.id]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    const supabase = createClient();
    // Strip leading @ — "@ferna" searches prefix "ferna%"
    const raw = searchQuery.trim().replace(/^@/, "");
    const { data } = await supabase
      .from("users")
      .select("id, username, character, level, xp, rank")
      .ilike("username", `%${raw}%`)
      .neq("id", user.id)
      .limit(10);
    setSearchResults(
      (data ?? [])
        .filter((u) => !friendIds.has(u.id))
        .map((u) => ({
          id: u.id,
          username: u.username,
          character: (u.character as unknown as Character) ?? DEFAULT_CHARACTER,
          level: u.level,
          xp: (u as Record<string, unknown>).xp as number ?? 0,
          countriesCount: 0,
          rank: u.rank,
          isOnline: false,
        }))
    );
  }

  async function handleAdd(friendId: string) {
    setAddingId(friendId);
    const supabase = createClient();
    // Insert both directions — bidirectional friendship
    await supabase.from("friends").upsert(
      [
        { user_id: user.id, friend_id: friendId },
        { user_id: friendId, friend_id: user.id },
      ],
      { ignoreDuplicates: true }
    );
    const added = searchResults.find((u) => u.id === friendId);
    if (added) {
      setFriends((prev) => [...prev, added]);
      setFriendIds((prev) => new Set([...prev, friendId]));
    }
    const result = await grantXP(user.id, 30, user.xp, user.level);
    setXpResult(result);
    setAddingId(null);
    setSearchResults((prev) => prev.filter((u) => u.id !== friendId));
  }

  const onlineCount = 0;

  if (loading) return (
    <div className="page-content flex items-center justify-center min-h-[400px]">
      <div className="text-[10px] text-white blink">CARREGANDO...</div>
    </div>
  );

  return (
    <div className="page-content flex flex-col gap-5">
      {xpResult && <XPToast result={xpResult} onDone={() => setXpResult(null)} />}
      <div className="page-header">
        <div className="page-title">👥 AMIGOS</div>
        <div className="ml-auto text-[8px] text-white">
          <span className="text-[#39ff14]">●</span>{" "}{onlineCount} ONLINE
        </div>
      </div>

      <div className="pixel-tabs">
        {[
          { key: "friends", label: `👥 AMIGOS (${friends.length})` },
          { key: "search", label: "🔍 BUSCAR" },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className="pixel-tab"
              style={{
                background: active ? "#00e5ff11" : "#0277bd",
                color: active ? "#00e5ff" : "#fff",
                borderBottom: active ? "3px solid #00e5ff" : "3px solid transparent",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "friends" && (
        <div className="flex flex-col gap-0">
          {friends.length > 0 ? (
            <Panel noPad>
              {friends.map((friend, i) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                  style={{
                    borderBottom: i < friends.length - 1 ? "1px solid #29b6f620" : "none",
                    background: i % 2 === 0 ? "#0277bd44" : "transparent",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#01579b")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#0277bd44" : "transparent")}
                >
                  <div className="relative shrink-0">
                    <div className="bg-[#01579b] border-2 border-[#29b6f6] p-2">
                      <PixelCharacter character={friend.character} size={48} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-[#ffffff] mb-[6px]">@{friend.username}</div>
                    <div className="flex gap-4 text-[7px] text-white">
                      <span>LVL {friend.level}</span>
                      <span>🌍 {friend.countriesCount} países</span>
                      <span>RANK #{friend.rank}</span>
                    </div>
                  </div>
                  <div className="text-[7px] text-white/40">○ OFFLINE</div>
                </div>
              ))}
            </Panel>
          ) : (
            <div className="text-[8px] text-white text-center py-10">Nenhum amigo ainda. Busque jogadores!</div>
          )}
          <button
            onClick={() => setTab("search")}
            className="w-full bg-transparent border-2 border-dashed border-[#29b6f6] p-4 text-white font-pixel text-[8px] cursor-pointer mt-3"
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00e5ff"; e.currentTarget.style.color = "#00e5ff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#29b6f6"; e.currentTarget.style.color = "#fff"; }}
          >
            + ADICIONAR AMIGO
          </button>
        </div>
      )}

      {tab === "search" && (
        <div className="flex flex-col gap-4">
          <Panel>
            <div className="pixel-input-wrap" style={{ borderRadius: 0 }}>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder=""
                className="px-4 py-3"
              />
              <button onClick={handleSearch}
                className="shrink-0 bg-[#00e5ff22] border-l-2 border-l-[#29b6f6] px-5 text-[#00e5ff] cursor-pointer text-lg font-pixel self-stretch flex items-center"
                onMouseEnter={(e) => { e.currentTarget.style.background = "#00e5ff33"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#00e5ff22"; }}
              >
                🔍
              </button>
            </div>
          </Panel>

          {searchResults.length > 0 && (
            <Panel title="RESULTADOS" accent="#00e5ff" noPad>
              {searchResults.map((u, i) => (
                <div
                  key={u.id}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ borderBottom: i < searchResults.length - 1 ? "1px solid #29b6f620" : "none", background: i % 2 === 0 ? "#0277bd44" : "transparent" }}
                >
                  <div className="bg-[#01579b] border-2 border-[#29b6f6] p-2 shrink-0">
                    <PixelCharacter character={u.character} size={40} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-[#ffffff] mb-1">@{u.username}</div>
                    <div className="text-[7px] text-white">LVL {u.level} · RANK #{u.rank}</div>
                  </div>
                  <button
                    onClick={() => handleAdd(u.id)}
                    disabled={addingId === u.id}
                    className="font-pixel text-[7px] px-[14px] py-2 border-2 border-[#39ff14] bg-[#39ff1411] text-[#39ff14] cursor-pointer shadow-[2px_2px_0_#014080] disabled:opacity-50"
                  >
                    {addingId === u.id ? "..." : "+ ADD"}
                  </button>
                </div>
              ))}
            </Panel>
          )}

          {searchResults.length === 0 && searchQuery && (
            <div className="text-[8px] text-white text-center py-6">Nenhum jogador encontrado.</div>
          )}
        </div>
      )}
    </div>
  );
}
