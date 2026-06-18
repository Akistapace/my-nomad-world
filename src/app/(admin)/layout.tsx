import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin, username")
    .eq("id", user.id)
    .single();

  const ADMIN_EMAILS = ["fernando.akistapace@gmail.com"];
  const isAdmin = profile?.is_admin || ADMIN_EMAILS.includes(user.email ?? "");
  if (!isAdmin) redirect("/");

  return (
    <div className="min-h-dvh bg-[#011627] flex flex-col">
      <header className="bg-[#0277bd] border-b-[3px] border-b-[#29b6f6] px-6 py-3 flex items-center gap-4">
        <div className="text-[10px] text-[#ff00ff]">🛡 ADMIN PANEL</div>
        <div className="text-[8px] text-white/40 ml-auto">{profile?.username ?? user.email}</div>
        <Link href="/" className="font-pixel text-[7px] text-white/50 no-underline border border-white/20 px-2 py-1">
          ← VOLTAR
        </Link>
      </header>
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">{children}</main>
    </div>
  );
}
