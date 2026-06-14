import { createClient } from "@/lib/supabase/client";

export interface XPResult {
  xpGained: number;
  newXp: number;
  newLevel: number;
  newXpToNext: number;
  leveledUp: boolean;
}

function xpToNextLevel(level: number): number {
  return level * 1000;
}

export async function grantXP(
  userId: string,
  amount: number,
  currentXp: number,
  currentLevel: number,
): Promise<XPResult> {
  const supabase = createClient();

  let xp = currentXp + amount;
  let level = currentLevel;
  let xpToNext = xpToNextLevel(level);
  let leveledUp = false;

  while (xp >= xpToNext) {
    xp -= xpToNext;
    level++;
    leveledUp = true;
    xpToNext = xpToNextLevel(level);
  }

  await supabase.from("users").update({ xp, level, xp_to_next: xpToNext }).eq("id", userId);

  await supabase.rpc("recalculate_ranks");

  return { xpGained: amount, newXp: xp, newLevel: level, newXpToNext: xpToNext, leveledUp };
}
