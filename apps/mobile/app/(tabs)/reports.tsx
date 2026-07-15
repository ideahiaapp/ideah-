import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/colors";

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

export default function ReportsScreen() {
  const { user } = useAuthStore();
  const [clients, setClients]   = useState<Client[]>([]);
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
      const apiKey = ""; // Usuário configura nas settings
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_WEB_URL}/api/reports/patient-prospect`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { "x-anthropic-key": apiKey } : {}),
          },
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
        <Text style={s.title}>Relatórios</Text>

        {/* Prospecto de evolução */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="sparkles" size={20} color={Colors.brand[500]} />
            <Text style={s.cardTitle}>Prospecto de Evolução</Text>
          </View>
          <Text style={s.cardDesc}>
            Análise clínica com IA baseada nas evoluções registradas do cliente.
          </Text>

          {/* Seletor de cliente */}
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

        {/* Resultado */}
        {result && verdict && (
          <View style={s.resultCard}>
            {/* Cabeçalho do resultado */}
            <View style={s.resultHeader}>
              <View style={[s.verdictBadge, { backgroundColor: verdict.bg }]}>
                <Ionicons name={verdict.icon} size={16} color={verdict.color} />
                <Text style={[s.verdictText, { color: verdict.color }]}>{verdict.label}</Text>
              </View>
              <Text style={s.resultName}>{result.clientName}</Text>
              <Text style={s.resultPeriod}>{result.sessionCount} sessões · {result.period}</Text>
            </View>

            {/* Score */}
            <View style={s.scoreSection}>
              <Text style={s.scoreLabel}>Score de progresso</Text>
              <View style={s.scoreBar}>
                <View style={[s.scoreFill, { width: `${result.score * 10}%` as `${number}%` }]} />
              </View>
              <Text style={s.scoreValue}>{result.score}/10</Text>
            </View>

            {/* Resumo */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Resumo clínico</Text>
              <Text style={s.sectionText}>{result.summary}</Text>
            </View>

            {/* Temas */}
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

            {/* Pontos */}
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

            {/* Recomendação */}
            <View style={[s.section, { backgroundColor: Colors.brand[50], borderRadius: 12, padding: 14 }]}>
              <Text style={[s.sectionTitle, { color: Colors.brand[700] }]}>Recomendação clínica</Text>
              <Text style={[s.sectionText, { color: Colors.brand[700] }]}>{result.recommendation}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.gray[50] },
  scroll:      { padding: 20, paddingBottom: 60 },
  title:       { fontSize: 24, fontWeight: "700", color: Colors.ink, marginBottom: 20 },
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
  // Resultado
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
