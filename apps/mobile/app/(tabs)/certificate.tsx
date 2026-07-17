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

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const sec = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
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
          <View style={s.card}>
            <View style={s.reportHeader}>
              <Text style={s.reportLabel}>Terapeuta</Text>
              <Text style={s.reportName}>{report.therapist.name}</Text>
              <Text style={s.reportEmail}>{report.therapist.email}</Text>
            </View>

            {report.certificateText && (
              <View style={s.certTextBox}>
                <View style={s.cardHeader}>
                  <Ionicons name="sparkles" size={16} color={Colors.brand[500]} />
                  <Text style={s.cardTitle}>Certificado</Text>
                </View>
                <MarkdownText text={report.certificateText} />
              </View>
            )}

            <View style={s.synthesisSection}>
              <View style={s.cardHeader}>
                <Ionicons name="time" size={16} color={Colors.brand[500]} />
                <Text style={s.cardTitle}>Tempo de supervisão por abordagem</Text>
              </View>
              {report.synthesis.length === 0 ? (
                <Text style={s.emptyText}>Nenhuma supervisão registrada neste período.</Text>
              ) : (
                <>
                  {report.synthesis.map(row => (
                    <View key={row.approach} style={s.synthesisRow}>
                      <Text style={s.synthesisLabel}>{APPROACH_LABELS[row.approach] ?? row.approach}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Text style={s.synthesisCount}>{row.count} sessão(ões)</Text>
                        <Text style={s.synthesisHours}>{formatDuration(row.totalSeconds)}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={s.totalRow}>
                    <Text style={s.totalLabel}>Total geral</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Text style={s.totalCount}>{report.totalSessions} sessão(ões)</Text>
                      <Text style={s.totalHours}>{formatDuration(report.totalSeconds)}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
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
  certTextBox: { marginBottom: 18, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  synthesisSection: { gap: 8 },
  emptyText:  { fontSize: 13, color: Colors.gray[500], fontStyle: "italic" },
  synthesisRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: Colors.gray[50], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6 },
  synthesisLabel: { fontSize: 13, color: Colors.gray[700], fontWeight: "500", flex: 1 },
  synthesisCount: { fontSize: 11, color: Colors.gray[500] },
  synthesisHours: { fontSize: 13, fontWeight: "700", color: Colors.brand[700] },
  totalRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: Colors.brand[50], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginTop: 6 },
  totalLabel: { fontSize: 13, fontWeight: "700", color: Colors.brand[800] },
  totalCount: { fontSize: 11, color: Colors.brand[600] },
  totalHours: { fontSize: 13, fontWeight: "700", color: Colors.brand[800] },
});
