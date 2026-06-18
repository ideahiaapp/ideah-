import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAILS = [
  "carlos.magno@gmail.com",
  "betinha.potter@gmail.com",
  "elimarcia.philos@gmail.com",
];

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email) return NextResponse.json({ allowed: false });

  if (ADMIN_EMAILS.includes(email)) return NextResponse.json({ allowed: true });

  const { data } = await supabaseAdmin
    .from("therapist_profiles")
    .select("user_id, blocked")
    .eq("email", email)
    .maybeSingle();

  return NextResponse.json({ allowed: !!data && !data.blocked });
}
