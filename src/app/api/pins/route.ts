import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { country_code, type, name, lat, lng, note } = body;

  const { data, error } = await supabase
    .from("pins")
    .insert({ user_id: user.id, country_code, type, name, lat: lat ?? 0, lng: lng ?? 0, note: note ?? null })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });

  return Response.json({ pin: data }, { status: 201 });
}
