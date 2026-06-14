import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import type { UserProfile } from "@/lib/context/user-context";
import { UserProvider } from "@/lib/context/user-context";
import { createClient } from "@/lib/supabase/server";
import type { Character } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { count: countriesCount }] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("countries").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("visited", true),
  ]);

  // Trigger may have failed at signup — ensure row exists
  if (!profile) {
    await supabase.from("users").upsert(
      {
        id: user.id,
        username: (user.user_metadata?.username as string | undefined) ?? user.email?.split("@")[0] ?? "Nomade",
      },
      { ignoreDuplicates: true }
    );
  }

  // home_code is written to auth metadata at signup — always available, no extra DB query
  const homeCode = (user.user_metadata?.home_code as string | undefined) || undefined;

  const userProfile: UserProfile = profile
    ? {
        id: profile.id,
        username: profile.username,
        level: profile.level,
        xp: profile.xp,
        xpToNext: profile.xp_to_next,
        rank: profile.rank,
        totalPins: profile.total_pins,
        countriesCount: countriesCount ?? 0,
        character: profile.character as unknown as Character,
        joinedAt: profile.joined_at,
        homeCode,
      }
    : {
        id: user.id,
        username: user.email?.split("@")[0] ?? "Nomade",
        level: 1,
        xp: 0,
        xpToNext: 1000,
        rank: 9999,
        totalPins: 0,
        countriesCount: 0,
        character: { skin: "adventurer", color: "blue", hat: false, backpack: false },
        joinedAt: new Date().toISOString().slice(0, 10),
        homeCode,
      };

  return (
    <UserProvider user={userProfile}>
      <div className="app-shell">
        <Sidebar />
        <main className="app-main">{children}</main>
        <Navigation />
      </div>
    </UserProvider>
  );
}
