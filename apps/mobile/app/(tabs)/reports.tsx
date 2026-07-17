import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { supabase } from "@/lib/supabase";
import { aiHeaders } from "@/lib/ai-headers";
import { Colors } from "@/constants/colors";
import { MarkdownText } from "@/components/MarkdownText";
import { HamburgerMenu } from "@/components/HamburgerMenu";

type Client = { id: string; name: string };
type Prospect = {
  verdict: "evoluiu" | "estável" | "regrediu";
  score: number;
  summary: string;
  mood_trend: string;
  key_themes: string[];
  strengths: string;
  challenges: string;
  recommendation: string;
  clientName: string;
  sessionCount: number;
  period: string;
};

const VERDICT_CONFIG = {
  evoluiu:  { label: "Evoluiu",  color: "#16A34A", bg: "#DCFCE7", icon: "trending-up" as const },
  estável:  { label: "Estável",  color: "#2563EB", bg: "#DBEAFE", icon: "remove" as const },
  regrediu: { label: "Regrediu", color: "#DC2626", bg: "#FEE2E2", icon: "trending-down" as const },
};

const PERIOD_OPTIONS = [
  { value: "1m",  label: "Último mês" },
  { value: "3m",  label: "Últimos 3 meses" },
  { value: "6m",  label: "Últimos 6 meses" },
  { value: "1y",  label: "Último ano" },
  { value: "all", label: "Todo o período" },
];

const DOCUMENT_OPTIONS = [
  { value: "DOC_DECLARACAO_COMPARECIMENTO", label: "Declaração de comparecimento" },
  { value: "DOC_RELATORIO_ACOMPANHAMENTO",  label: "Relatório de acompanhamento psicológico" },
  { value: "DOC_ATESTADO_PSICOLOGICO",      label: "Atestado psicológico" },
  { value: "DOC_ENCAMINHAMENTO",            label: "Encaminhamento" },
];

type SubTab = "prospecto" | "evolucao" | "relatorio" | "documentos";
const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "prospecto",  label: "Prospecto" },
  { id: "evolucao",   label: "Evolução" },
  { id: "relatorio",  label: "Rel. Evoluções" },
  { id: "documentos", label: "Documentos" },
];

/* ── Seletor genérico (dropdown simples) ─────────────────────── */
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
              <Text style={[s.pickerItemText, value === o.value && { color: Colors.brand[600] }]}>{o.label}</Text>
              {value === o.value && <Ionicons name="checkmark" size={16} color={Colors.brand[500]} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

/* ── Painel: relatório de evolução via IA (Evolução / Relatório de Evoluções) ── */
function EvolutionAIPanel({ clients, promptKey, therapistId }: {
  clients: Client[]; promptKey: string; therapistId: string;
}) {
  const [clientId, setClientId] = useState("");
  const [period, setPeriod]     = useState("3m");
  const [loading, setLoading]   = useState(false);
  const [report, setReport]     = useState<{ report: string; clientName: string; sessionCount: number; period: string; dateRange: string } | null>(null);
  const [error, setError]       = useState<string | null>(null);

  async function generate() {
    if (!clientId) return;
    setLoading(true); setReport(null); setError(null);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/reports/clinical-evolution`, {
        method: "POST",
        headers: await aiHeaders(),
        body: JSON.stringify({ clientId, therapistId, period, promptKey }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao gerar relatório");
      setReport(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Ionicons name="sparkles" size={20} color={Colors.brand[500]} />
        <Text style={s.cardTitle}>Gerar relatório de evolução</Text>
      </View>
      <Text style={s.cardDesc}>Selecione o cliente e o período. A IA analisa as evoluções e supervisões registradas.</Text>

      <PickerField label="Selecionar cliente..." value={clientId} onChange={v => { setClientId(v); setReport(null); }}
        options={clients.map(c => ({ value: c.id, label: c.name }))} />
      <PickerField label="Período" value={period} onChange={v => { setPeriod(v); setReport(null); }} options={PERIOD_OPTIONS} />

      <TouchableOpacity style={[s.btn, (!clientId || loading) && s.btnDisabled]} onPress={generate} disabled={!clientId || loading} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="sparkles" size={16} color="#fff" /><Text style={s.btnText}>  Gerar relatório</Text></>}
      </TouchableOpacity>

      {error && <Text style={s.errorText}>{error}</Text>}

      {report && (
        <View style={s.resultBox}>
          <Text style={s.resultMeta}>{report.clientName} · {report.period} · {report.sessionCount} sessões</Text>
          <MarkdownText text={report.report} />
        </View>
      )}
    </View>
  );
}

/* ── Painel: documentos oficiais via IA ──────────────────────── */
function DocumentPanel({ clients, therapistId }: { clients: Client[]; therapistId: string }) {
  const [clientId, setClientId]         = useState("");
  const [documentType, setDocumentType] = useState("");
  const [loading, setLoading]           = useState(false);
  const [result, setResult]             = useState<{ documentText: string; documentLabel: string; clientName: string } | null>(null);
  const [error, setError]               = useState<string | null>(null);

  async function generate() {
    if (!clientId || !documentType) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/reports/official-document`, {
        method: "POST",
        headers: await aiHeaders(),
        body: JSON.stringify({ clientId, therapistId, documentType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao gerar documento");
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Ionicons name="document-text" size={20} color={Colors.brand[500]} />
        <Text style={s.cardTitle}>Gerar documento oficial</Text>
      </View>
      <Text style={s.cardDesc}>Selecione o cliente e o tipo de documento.</Text>

      <PickerField label="Selecionar cliente..." value={clientId} onChange={v => { setClientId(v); setResult(null); }}
        options={clients.map(c => ({ value: c.id, label: c.name }))} />
      <PickerField label="Selecionar documento..." value={documentType} onChange={v => { setDocumentType(v); setResult(null); }}
        options={DOCUMENT_OPTIONS} />

      <TouchableOpacity style={[s.btn, (!clientId || !documentType || loading) && s.btnDisabled]} onPress={generate} disabled={!clientId || !documentType || loading} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="sparkles" size={16} color="#fff" /><Text style={s.btnText}>  Gerar documento</Text></>}
      </TouchableOpacity>

      {error && <Text style={s.errorText}>{error}</Text>}

      {result && (
        <View style={s.resultBox}>
          <Text style={s.resultMeta}>{result.documentLabel} — {result.clientName}</Text>
          <MarkdownText text={result.documentText} />
        </View>
      )}
    </View>
  );
}

/* ── Tela principal ───────────────────────────────────────────── */
export default function ReportsScreen() {
  const { user } = useAuthStore();
  const [clients, setClients]   = useState<Client[]>([]);
  const [tab, setTab]           = useState<SubTab>("prospecto");

  // Estado do painel "Prospecto" (já existente)
  const [selected, setSelected] = useState<Client | null>(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<Prospect | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("clients")
      .select("id, name")
      .eq("therapist_id", user.id)
      .eq("status", "ACTIVE")
      .order("name")
      .then(({ data }) => setClients((data ?? []) as Client[]));
  }, [user]);

  async function generate() {
    if (!selected || !user) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_WEB_URL}/api/reports/patient-prospect`,
        {
          method: "POST",
          headers: await aiHeaders(),
          body: JSON.stringify({ clientId: selected.id, therapistId: user.id }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro na análise");
      setResult(json as Prospect);
    } catch (e: unknown) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Erro ao gerar análise");
    }
    setLoading(false);
  }

  const verdict = result ? VERDICT_CONFIG[result.verdict] : null;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <HamburgerMenu />
          <Text style={[s.title, { marginBottom: 0 }]}>Meu escritório</Text>
        </View>

        {/* Sub-abas */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsRow} contentContainerStyle={{ gap: 8 }}>
          {SUB_TABS.map(t => (
            <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} style={[s.tabChip, tab === t.id && s.tabChipActive]}>
              <Text style={[s.tabChipText, tab === t.id && s.tabChipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {tab === "prospecto" && (
          <>
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Ionicons name="sparkles" size={20} color={Colors.brand[500]} />
                <Text style={s.cardTitle}>Prospecto de Evolução</Text>
              </View>
              <Text style={s.cardDesc}>
                Análise clínica com IA baseada nas evoluções registradas do cliente.
              </Text>

              <TouchableOpacity style={s.selector} onPress={() => setShowPicker(!showPicker)}>
                <Text style={selected ? s.selectorText : s.selectorPlaceholder}>
                  {selected?.name ?? "Selecionar cliente..."}
                </Text>
                <Ionicons name={showPicker ? "chevron-up" : "chevron-down"} size={16} color={Colors.gray[400]} />
              </TouchableOpacity>

              {showPicker && (
                <View style={s.pickerList}>
                  {clients.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={[s.pickerItem, selected?.id === c.id && s.pickerItemActive]}
                      onPress={() => { setSelected(c); setShowPicker(false); setResult(null); }}
                    >
                      <Text style={[s.pickerItemText, selected?.id === c.id && { color: Colors.brand[600] }]}>
                        {c.name}
                      </Text>
                      {selected?.id === c.id && <Ionicons name="checkmark" size={16} color={Colors.brand[500]} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[s.btn, (!selected || loading) && s.btnDisabled]}
                onPress={generate}
                disabled={!selected || loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Ionicons name="sparkles" size={16} color="#fff" /><Text style={s.btnText}>  Gerar análise</Text></>}
              </TouchableOpacity>
            </View>

            {result && verdict && (
              <View style={s.resultCard}>
                <View style={s.resultHeader}>
                  <View style={[s.verdictBadge, { backgroundColor: verdict.bg }]}>
                    <Ionicons name={verdict.icon} size={16} color={verdict.color} />
                    <Text style={[s.verdictText, { color: verdict.color }]}>{verdict.label}</Text>
                  </View>
                  <Text style={s.resultName}>{result.clientName}</Text>
                  <Text style={s.resultPeriod}>{result.sessionCount} sessões · {result.period}</Text>
                </View>

                <View style={s.scoreSection}>
                  <Text style={s.scoreLabel}>Score de progresso</Text>
                  <View style={s.scoreBar}>
                    <View style={[s.scoreFill, { width: `${result.score * 10}%` as `${number}%` }]} />
                  </View>
                  <Text style={s.scoreValue}>{result.score}/10</Text>
                </View>

                <View style={s.section}>
                  <Text style={s.sectionTitle}>Resumo clínico</Text>
                  <Text style={s.sectionText}>{result.summary}</Text>
                </View>

                {result.key_themes?.length > 0 && (
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>Temas centrais</Text>
                    <View style={s.themes}>
                      {result.key_themes.map(t => (
                        <View key={t} style={s.themeBadge}>
                          <Text style={s.themeText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={s.pointsRow}>
                  <View style={[s.pointCard, { flex: 1 }]}>
                    <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                    <Text style={s.pointTitle}>Avanços</Text>
                    <Text style={s.pointText}>{result.strengths}</Text>
                  </View>
                  <View style={[s.pointCard, { flex: 1 }]}>
                    <Ionicons name="alert-circle" size={16} color="#D97706" />
                    <Text style={s.pointTitle}>Atenção</Text>
                    <Text style={s.pointText}>{result.challenges}</Text>
                  </View>
                </View>

                <View style={[s.section, { backgroundColor: Colors.brand[50], borderRadius: 12, padding: 14 }]}>
                  <Text style={[s.sectionTitle, { color: Colors.brand[700] }]}>Recomendação clínica</Text>
                  <Text style={[s.sectionText, { color: Colors.brand[700] }]}>{result.recommendation}</Text>
                </View>
              </View>
            )}
          </>
        )}

        {tab === "evolucao" && user && (
          <EvolutionAIPanel clients={clients} promptKey="EVOLUTION" therapistId={user.id} />
        )}
        {tab === "relatorio" && user && (
          <EvolutionAIPanel clients={clients} promptKey="EVOLUTION_REPORT" therapistId={user.id} />
        )}
        {tab === "documentos" && user && (
          <DocumentPanel clients={clients} therapistId={user.id} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.gray[50] },
  scroll:      { padding: 20, paddingBottom: 60 },
  title:       { fontSize: 24, fontWeight: "700", color: Colors.ink, marginBottom: 16 },
  tabsRow:     { marginBottom: 16 },
  tabChip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray[200] },
  tabChipActive: { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  tabChipText: { fontSize: 13, fontWeight: "600", color: Colors.gray[600] },
  tabChipTextActive: { color: Colors.white },
  card:        { backgroundColor: Colors.white, borderRadius: 16, padding: 18, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader:  { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  cardTitle:   { fontSize: 16, fontWeight: "700", color: Colors.ink },
  cardDesc:    { fontSize: 13, color: Colors.gray[500], marginBottom: 16, lineHeight: 19 },
  selector:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
  selectorText: { fontSize: 14, color: Colors.ink },
  selectorPlaceholder: { fontSize: 14, color: Colors.gray[400] },
  pickerList:  { borderWidth: 1, borderColor: Colors.gray[200], borderRadius: 12, overflow: "hidden", marginBottom: 12 },
  pickerItem:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  pickerItemActive: { backgroundColor: Colors.brand[50] },
  pickerItemText: { fontSize: 14, color: Colors.ink },
  btn:         { flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: Colors.brand[500], borderRadius: 12, paddingVertical: 13, marginTop: 4 },
  btnDisabled: { opacity: 0.5 },
  btnText:     { color: Colors.white, fontSize: 14, fontWeight: "700" },
  errorText:   { fontSize: 13, color: "#DC2626", marginTop: 10 },
  resultBox:   { marginTop: 16, borderTopWidth: 1, borderTopColor: Colors.gray[100], paddingTop: 14 },
  resultMeta:  { fontSize: 12, color: Colors.gray[500], marginBottom: 10, fontWeight: "600" },
  // Resultado (Prospecto)
  resultCard:  { backgroundColor: Colors.white, borderRadius: 16, padding: 18, gap: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  resultHeader: { gap: 4 },
  verdictBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 4 },
  verdictText: { fontSize: 13, fontWeight: "700" },
  resultName:  { fontSize: 18, fontWeight: "700", color: Colors.ink },
  resultPeriod: { fontSize: 12, color: Colors.gray[500] },
  scoreSection: { gap: 6 },
  scoreLabel:  { fontSize: 13, fontWeight: "600", color: Colors.gray[700] },
  scoreBar:    { height: 8, backgroundColor: Colors.gray[100], borderRadius: 4, overflow: "hidden" },
  scoreFill:   { height: "100%", backgroundColor: Colors.brand[500], borderRadius: 4 },
  scoreValue:  { fontSize: 12, color: Colors.gray[500], textAlign: "right" },
  section:     { gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: Colors.gray[700] },
  sectionText: { fontSize: 13, color: Colors.gray[600], lineHeight: 20 },
  themes:      { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  themeBadge:  { backgroundColor: Colors.brand[50], paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  themeText:   { fontSize: 12, color: Colors.brand[600], fontWeight: "600" },
  pointsRow:   { flexDirection: "row", gap: 12 },
  pointCard:   { backgroundColor: Colors.gray[50], borderRadius: 12, padding: 12, gap: 6 },
  pointTitle:  { fontSize: 12, fontWeight: "700", color: Colors.gray[700] },
  pointText:   { fontSize: 12, color: Colors.gray[600], lineHeight: 18 },
});
