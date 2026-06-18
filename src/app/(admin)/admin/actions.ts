"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ADMIN_EMAILS = ["fernando.akistapace@gmail.com"];

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  if (ADMIN_EMAILS.includes(user.email ?? "")) return;

  const { data } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!data?.is_admin) throw new Error("Sem permissão");
}

export async function createMissionForAll(formData: FormData) {
  await assertAdmin();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const type = formData.get("type") as string;
  const difficulty = formData.get("difficulty") as string;
  const icon = formData.get("icon") as string;
  const total = Number(formData.get("total"));
  const xpReward = Number(formData.get("xpReward"));
  const coinReward = Number(formData.get("coinReward"));

  const admin = createAdminClient();

  const { data: users } = await admin
    .from("users")
    .select("id")
    .is("deleted_at", null);

  if (!users?.length) return { error: "Nenhum usuário encontrado" };

  const rows = users.map((u) => ({
    user_id: u.id,
    title,
    description,
    type,
    difficulty,
    icon: icon || "⚡",
    total,
    xp_reward: xpReward,
    coin_reward: coinReward,
    progress: 0,
    completed: false,
  }));

  const { error } = await admin.from("challenges").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true, count: users.length };
}

export async function toggleBanUser(userId: string, banned: boolean) {
  await assertAdmin();

  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({ is_banned: banned })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function softDeleteUser(userId: string) {
  await assertAdmin();

  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({ deleted_at: new Date().toISOString(), is_banned: true })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function restoreUser(userId: string) {
  await assertAdmin();

  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({ deleted_at: null, is_banned: false })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function listAllUsers() {
  await assertAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("id, username, level, xp, rank, is_admin, is_banned, deleted_at, joined_at")
    .order("rank", { ascending: true });

  if (error) return [];
  return data ?? [];
}
