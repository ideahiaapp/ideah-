import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { aiHeaders, authHeaders } from "@/lib/ai-headers";
import { Colors } from "@/constants/colors";
import { MarkdownText } from "@/components/MarkdownText";
import { HamburgerMenu } from "@/components/HamburgerMenu";

type Therapist = { userId: string; email: string; name: string };
type SynthesisRow = { approach: string; totalSeconds: number; count: number };
type CertificateReport = {
  therapist: { id: string; name: string; email: string };
  period: { start: string; end: string };
  synthesis: SynthesisRow[];
  totalSeconds: number;
  totalSessions: number;
  certificateText?: string;
};

const APPROACH_LABELS: Record<string, string> = {
  PSYCHOANALYSIS: "Psicanálise Freudiana", COGNITIVE_BEHAVIORAL: "TCC",
  JUNGIAN: "Junguiana", SOMATIC: "Somática / Corporal", TANTRA: "Sexualidade Humana e Tantra",
  GESTALT: "Gestalt-terapia", PSYCHODRAMA: "Psicodrama", SYSTEMIC: "Constelação Familiar",
  NAO_INFORMADO: "Não informada",
};

const PERIOD_OPTIONS = [
  { value: "1m", label: "1 mês" },
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "1y", label: "1 ano" },
];

const BACK_MARKER_RE = /[#*\s]*informa[cç][oõ]es\s+do\s+verso\s+do\s+certificado[:*#\s]*/i;

/** Separa o texto gerado pela IA em frente/verso a partir do marcador combinado no prompt. */
function splitCertificateText(text: string): { front: string; back: string | null } {
  const match = BACK_MARKER_RE.exec(text);
  if (!match) return { front: text.trim(), back: null };
  const front = text.slice(0, match.index).trim();
  const back = text.slice(match.index + match[0].length).trim();
  return { front, back: back || null };
}

/** Formato compacto para o certificado ("2h30", "45min", "0h") — evita arredondar minutos reais para "0h". */
function formatHoursLabel(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h === 0 && m === 0) return "0h";
  if (h === 0) return `${m}min`;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function fmtDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");
}

function CertStat({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; value: string }) {
  return (
    <View style={s.certStat}>
      <Ionicons name={icon} size={14} color={Colors.brand[500]} />
      <Text style={s.certStatLabel}>{label}</Text>
      <Text style={s.certStatValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

/** Frente do certificado — aproxima em React Native o layout visual usado na versão web (CertificateTemplate.tsx). */
function CertificateCard({ therapistName, approachLabel, periodLabel, totalHoursLabel, totalSessions }: {
  therapistName: string; approachLabel: string; periodLabel: string; totalHoursLabel: string; totalSessions: number;
}) {
  return (
    <View style={s.certCard}>
      <View style={s.certWave} />
      <View style={s.certTopBar}><Text style={s.certWordmark}>PAIDEIA</Text></View>
      <View style={s.certContent}>
        <Text style={s.certEyebrow}>CERTIFICADO</Text>
        <Text style={s.certTitle}>Formação Clínica Continuada</Text>
        <Text style={s.certSubtitle}>Estudo Clínico Supervisionado</Text>

        <View style={s.certDividerRow}>
          <View style={s.certDividerLine} />
          <View style={s.certDividerDot} />
          <View style={s.certDividerLine} />
        </View>

        <Text style={s.certCertifiesLabel}>Certificamos que</Text>
        <Text style={s.certName} numberOfLines={2}>{therapistName || "—"}</Text>

        <Text style={s.certParagraph}>
          concluiu <Text style={s.certBold}>{totalHoursLabel}</Text> de Formação Clínica Continuada, desenvolvidas na
          modalidade de <Text style={s.certBold}>Estudo Clínico Supervisionado</Text> na plataforma Paideia, por meio
          da análise de casos clínicos, formulação de hipóteses e integração entre teoria e prática dentro da abordagem:
        </Text>

        <View style={s.certApproachBox}><Text style={s.certApproachText} numberOfLines={1}>{approachLabel}</Text></View>

        <View style={s.certStatsRow}>
          <CertStat icon="calendar" label="PERÍODO" value={periodLabel} />
          <CertStat icon="time" label="CARGA HORÁRIA" value={totalHoursLabel} />
          <CertStat icon="people" label="SUPERVISÕES" value={`${totalSessions} sessões`} />
        </View>

        <View style={s.certSignature}>
          <Text style={s.certSignatureName}>Equipe Paideia</Text>
          <View style={s.certSignatureLine} />
          <Text style={s.certSignatureLabel}>EQUIPE PAIDEIA</Text>
        </View>
      </View>
    </View>
  );
}

/** Verso do certificado — mesmo card, sem faixa superior nem onda decorativa, só o texto indicado no prompt. */
function CertificateBackCard({ text }: { text: string }) {
  return (
    <View style={s.certCard}>
      <View style={s.certBackContent}>
        <MarkdownText text={text} />
      </View>
    </View>
  );
}

function PickerField({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label;
  return (
    <View style={{ marginBottom: 10 }}>
      <TouchableOpacity style={s.selector} onPress={() => setOpen(!open)}>
        <Text style={selectedLabel ? s.selectorText : s.selectorPlaceholder} numberOfLines={1}>
          {selectedLabel ?? label}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={Colors.gray[400]} />
      </TouchableOpacity>
      {open && (
        <View style={s.pickerList}>
          {options.map(o => (
            <TouchableOpacity
              key={o.value}
              style={[s.pickerItem, value === o.value && s.pickerItemActive]}
              onPress={() => { onChange(o.value); setOpen(false); }}
            >
              <Text style={[s.pickerItemText, value === o.value && { color: Colors.brand[600] }]} numberOfLines={1}>{o.label}</Text>
              {value === o.value && <Ionicons name="checkmark" size={16} color={Colors.brand[500]} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function CertificateScreen() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loadingTherapists, setLoadingTherapists] = useState(true);
  const [therapistId, setTherapistId] = useState("");
  const [period, setPeriod] = useState("");
  const [report, setReport] = useState<CertificateReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      if (user) { setTherapistId(user.id); }
      setLoadingTherapists(false);
      return;
    }
    authHeaders().then(headers =>
      fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/admin/therapists`, { headers })
        .then(r => r.json())
        .then(d => setTherapists(Array.isArray(d) ? d : []))
        .catch(() => setError("Não foi possível carregar a lista de terapeutas."))
        .finally(() => setLoadingTherapists(false))
    );
  }, [isAdmin, user]);

  const canGenerate = !!therapistId && !!period;

  const { front: frontText, back: backText } = report?.certificateText
    ? splitCertificateText(report.certificateText)
    : { front: "", back: null };

  async function generate() {
    if (!canGenerate) return;
    setLoading(true); setError(null); setReport(null);
    try {
      const headers = { ...(await authHeaders()), ...(await aiHeaders()) };
      const params = new URLSearchParams({ therapistId, period, reportType: "detalhado" });
      const res = await fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/certificate?${params}`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao gerar certificado.");
      setReport(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar certificado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.headerRow}>
          <HamburgerMenu />
          <View style={s.headerIcon}><Ionicons name="ribbon" size={22} color={Colors.brand[500]} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Certificado de Supervisão</Text>
            <Text style={s.subtitle}>Horas de supervisão por abordagem teórica</Text>
          </View>
        </View>

        <View style={s.card}>
          {isAdmin && (
            <PickerField
              label={loadingTherapists ? "Carregando..." : "Selecionar terapeuta..."}
              value={therapistId}
              onChange={v => { setTherapistId(v); setReport(null); }}
              options={therapists.map(t => ({ value: t.userId, label: `${t.name} (${t.email})` }))}
            />
          )}
          <PickerField label="Período" value={period} onChange={v => { setPeriod(v); setReport(null); }} options={PERIOD_OPTIONS} />

          <TouchableOpacity style={[s.btn, (!canGenerate || loading) && s.btnDisabled]} onPress={generate} disabled={!canGenerate || loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="ribbon" size={16} color="#fff" /><Text style={s.btnText}>  Gerar certificado</Text></>}
          </TouchableOpacity>
        </View>

        {error && (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {report && (
          <>
            <View style={s.card}>
              <View style={[s.reportHeader, { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
                <Text style={s.reportLabel}>Terapeuta</Text>
                <Text style={s.reportName}>{report.therapist.name}</Text>
                <Text style={s.reportEmail}>{report.therapist.email}</Text>
              </View>

              {frontText && (
                <View style={[s.certTextBox, { marginTop: 14 }]}>
                  <View style={s.cardHeader}>
                    <Ionicons name="sparkles" size={16} color={Colors.brand[500]} />
                    <Text style={s.cardTitle}>Certificado</Text>
                  </View>
                  <MarkdownText text={frontText} />
                </View>
              )}
            </View>

            {report.synthesis.length === 0 ? (
              <View style={s.card}><Text style={s.emptyText}>Nenhuma supervisão registrada neste período.</Text></View>
            ) : (
              report.synthesis.map(row => (
                <View key={row.approach} style={{ gap: 12, marginBottom: 16 }}>
                  <CertificateCard
                    therapistName={report.therapist.name}
                    approachLabel={APPROACH_LABELS[row.approach] ?? row.approach}
                    periodLabel={`${fmtDate(report.period.start)} a ${fmtDate(report.period.end)}`}
                    totalHoursLabel={formatHoursLabel(row.totalSeconds)}
                    totalSessions={row.count}
                  />
                  {backText && <CertificateBackCard text={backText} />}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.gray[50] },
  scroll:     { padding: 20, paddingBottom: 60 },
  headerRow:  { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  headerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.brand[50], alignItems: "center", justifyContent: "center" },
  title:      { fontSize: 19, fontWeight: "700", color: Colors.ink },
  subtitle:   { fontSize: 12, color: Colors.gray[500], marginTop: 1 },
  card:       { backgroundColor: Colors.white, borderRadius: 16, padding: 18, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  cardTitle:  { fontSize: 14, fontWeight: "700", color: Colors.ink },
  selector:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  selectorText: { fontSize: 14, color: Colors.ink, flex: 1 },
  selectorPlaceholder: { fontSize: 14, color: Colors.gray[400], flex: 1 },
  pickerList: { borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 12, overflow: "hidden", marginTop: 8 },
  pickerItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  pickerItemActive: { backgroundColor: Colors.brand[50] },
  pickerItemText: { fontSize: 14, color: Colors.ink, flex: 1 },
  btn:        { flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: Colors.brand[500], borderRadius: 12, paddingVertical: 13, marginTop: 6 },
  btnDisabled: { opacity: 0.5 },
  btnText:    { color: Colors.white, fontSize: 14, fontWeight: "700" },
  errorBox:   { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText:  { fontSize: 13, color: "#DC2626", flex: 1 },
  reportHeader: { borderBottomWidth: 1, borderBottomColor: Colors.gray[100], paddingBottom: 14, marginBottom: 14 },
  reportLabel: { fontSize: 11, fontWeight: "700", color: Colors.gray[500], textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  reportName: { fontSize: 16, fontWeight: "700", color: Colors.ink },
  reportEmail: { fontSize: 13, color: Colors.gray[500] },
  certTextBox: { marginBottom: 4 },
  emptyText:  { fontSize: 13, color: Colors.gray[500], fontStyle: "italic" },

  // Card do certificado (frente/verso)
  certCard:     { width: "100%", aspectRatio: 297 / 210, backgroundColor: "#FDF6EF", borderRadius: 16, borderWidth: 1, borderColor: Colors.brand[100], overflow: "hidden" },
  certWave:     { position: "absolute", left: "-16%", top: 0, bottom: 0, width: "42%", borderRadius: 500, backgroundColor: Colors.brand[500] },
  certTopBar:   { position: "absolute", top: 0, left: 0, right: 0, height: "13%", backgroundColor: Colors.brand[500], alignItems: "center", justifyContent: "center", zIndex: 10 },
  certWordmark: { color: "#fff", fontWeight: "700", fontSize: 13, letterSpacing: 3, fontStyle: "italic" },
  certContent:  { position: "absolute", top: "15%", bottom: "4%", left: "29%", right: "7%" },
  certEyebrow:  { fontSize: 8, fontWeight: "700", letterSpacing: 2, color: Colors.ink, textAlign: "center" },
  certTitle:    { fontSize: 15, fontWeight: "700", color: Colors.ink, textAlign: "center", marginTop: 3 },
  certSubtitle: { fontSize: 9, fontStyle: "italic", color: Colors.brand[600], textAlign: "center", marginTop: 1 },
  certDividerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginVertical: 6, paddingHorizontal: 30 },
  certDividerLine: { flex: 1, height: 1, backgroundColor: Colors.brand[200] },
  certDividerDot: { width: 4, height: 4, backgroundColor: Colors.brand[400], transform: [{ rotate: "45deg" }] },
  certCertifiesLabel: { fontSize: 8, color: Colors.gray[500], textAlign: "center" },
  certName:     { fontSize: 13, fontWeight: "700", color: Colors.brand[600], textAlign: "center", textTransform: "uppercase", marginTop: 2 },
  certParagraph: { fontSize: 7.5, color: Colors.gray[600], textAlign: "center", lineHeight: 11, marginTop: 6, paddingHorizontal: 4 },
  certBold:     { color: Colors.ink, fontWeight: "700" },
  certApproachBox: { alignSelf: "center", marginTop: 6, borderWidth: 1, borderColor: Colors.brand[300], borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, maxWidth: "90%" },
  certApproachText: { fontSize: 8, fontWeight: "700", color: Colors.brand[600] },
  certStatsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 10 },
  certStat:     { alignItems: "center", gap: 2, maxWidth: 70 },
  certStatLabel: { fontSize: 6, fontWeight: "700", color: Colors.gray[500], letterSpacing: 0.5 },
  certStatValue: { fontSize: 8, fontWeight: "700", color: Colors.ink },
  certSignature: { marginTop: "auto", alignItems: "center", paddingTop: 6 },
  certSignatureName: { fontSize: 11, fontStyle: "italic", color: Colors.ink },
  certSignatureLine: { height: 1, width: 90, backgroundColor: Colors.gray[300], marginVertical: 3 },
  certSignatureLabel: { fontSize: 6.5, fontWeight: "700", color: Colors.gray[500], letterSpacing: 1 },
  certBackContent: { flex: 1, padding: 16 },
});
