import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { code, name, flag_emoji, continent, visited_at, photo_url, pin } = body;

  const { data: country, error: cErr } = await supabase
    .from("countries")
    .insert({ user_id: user.id, code, name, flag_emoji, continent, visited: true, visited_at, photo_url })
    .select()
    .single();

  if (cErr) return Response.json({ error: cErr.message, code: cErr.code }, { status: 400 });

  let pinData = null;
  if (pin) {
    const { data } = await supabase
      .from("pins")
      .insert({ user_id: user.id, country_code: code, ...pin })
      .select()
      .single();
    pinData = data;
  }

  return Response.json({ country, pin: pinData }, { status: 201 });
}
