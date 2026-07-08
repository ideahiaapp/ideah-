import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email) return NextResponse.json({ allowed: false });

  const supabaseAdmin = serviceClient();

  const { data: adminRow } = await supabaseAdmin
    .from("admins")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  if (adminRow) return NextResponse.json({ allowed: true });

  const { data } = await supabaseAdmin
    .from("therapist_profiles")
    .select("user_id, blocked")
    .eq("email", email)
    .maybeSingle();

  return NextResponse.json({ allowed: !!data && !data.blocked });
}
