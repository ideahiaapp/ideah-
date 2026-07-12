import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const PERIOD_MONTHS: Record<string, number> = { "1m": 1, "3m": 3, "6m": 6, "1y": 12 };

// GET /api/certificate?therapistId=&period=1m|3m|6m|1y&reportType=sintetico|detalhado
// Funcionalidade disponível para qualquer terapeuta autenticado — mas quem não é
// admin só pode gerar o próprio certificado (therapistId é sobrescrito com o id
// do usuário autenticado).
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    if (!token) return NextResponse.json({ error: "Acesso negado." }, { status: 401 });

    const supabase = serviceClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return NextResponse.json({ error: "Acesso negado." }, { status: 401 });

    const requesterId = userData.user.id;
    const requesterEmail = userData.user.email?.toLowerCase().trim();
    const { data: adminRow } = await supabase.from("admins").select("email").eq("email", requesterEmail).maybeSingle();
    const isAdmin = !!adminRow;

    let therapistId = req.nextUrl.searchParams.get("therapistId");
    const period     = req.nextUrl.searchParams.get("period");
    const reportType = req.nextUrl.searchParams.get("reportType");

    if (!isAdmin) therapistId = requesterId; // não-admin só vê o próprio certificado

    if (!therapistId || !period || !reportType) {
      return NextResponse.json({ error: "therapistId, period e reportType são obrigatórios." }, { status: 400 });
    }
    const months = PERIOD_MONTHS[period];
    if (!months) {
      return NextResponse.json({ error: "period inválido. Use 1m, 3m, 6m ou 1y." }, { status: 400 });
    }
    if (reportType !== "sintetico" && reportType !== "detalhado") {
      return NextResponse.json({ error: "reportType inválido. Use sintetico ou detalhado." }, { status: 400 });
    }

    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    const { data: rows, error } = await supabase
      .from("evolutions")
      .select("*, clients(name)")
      .eq("therapist_id", therapistId)
      .gte("session_date", startStr)
      .lte("session_date", endStr)
      .order("session_date", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const evolutions = rows ?? [];

    const byApproach = new Map<string, { totalSeconds: number; count: number }>();
    for (const ev of evolutions) {
      const key = ev.approach ?? "NAO_INFORMADO";
      const cur = byApproach.get(key) ?? { totalSeconds: 0, count: 0 };
      cur.totalSeconds += ev.duration_seconds ?? 0;
      cur.count += 1;
      byApproach.set(key, cur);
    }
    const synthesis = Array.from(byApproach.entries())
      .map(([approach, v]) => ({ approach, totalSeconds: v.totalSeconds, count: v.count }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);

    const totalSeconds = evolutions.reduce((sum, ev) => sum + (ev.duration_seconds ?? 0), 0);

    const { data: authUserData } = await supabase.auth.admin.getUserById(therapistId);
    const therapistUser = authUserData?.user;

    const responseBody: Record<string, unknown> = {
      therapist: {
        id: therapistId,
        name: therapistUser?.user_metadata?.name ?? therapistUser?.email ?? "—",
        email: therapistUser?.email ?? "—",
      },
      period: { start: startStr, end: endStr },
      synthesis,
      totalSeconds,
      totalSessions: evolutions.length,
    };

    if (reportType === "detalhado") {
      responseBody.evolutions = evolutions.map(ev => ({
        id:              ev.id,
        clientName:      (ev.clients as { name?: string } | null)?.name ?? "—",
        sessionDate:     ev.session_date,
        sessionTime:     ev.session_time,
        approach:        ev.approach,
        durationSeconds: ev.duration_seconds,
        content:         ev.content,
        hypothesis:      ev.hypothesis,
        nextSessionPlan: ev.next_session_plan,
      }));
    }

    return NextResponse.json(responseBody);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
