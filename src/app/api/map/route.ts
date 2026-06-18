import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: countries, error: cErr }, { data: pins, error: pErr }] =
    await Promise.all([
      supabase.from("countries").select("*").eq("user_id", user.id).eq("visited", true),
      supabase.from("pins").select("*").eq("user_id", user.id),
    ]);

  if (cErr || pErr)
    return Response.json({ error: cErr?.message ?? pErr?.message }, { status: 500 });

  return Response.json({ countries: countries ?? [], pins: pins ?? [] });
}
