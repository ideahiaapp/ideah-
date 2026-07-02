import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { approach: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await supabase
      .from("anamnese_templates")
      .select("content")
      .eq("approach", params.approach)
      .single();

    if (error || !data) {
      return NextResponse.json({ content: null }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json(
      { content: data.content },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ content: null }, { status: 500 });
  }
}
