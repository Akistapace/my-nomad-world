"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;
  const home_code = formData.get("home_code") as string;
  const home_name = formData.get("home_name") as string;
  const home_flag = formData.get("home_flag") as string;
  const home_continent = formData.get("home_continent") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, home_code, home_name, home_flag, home_continent } },
  });
  if (error) return { error: error.message };

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
