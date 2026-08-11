import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/colors";

type Evolution = {
  id: string; client_id: string; session_date: string; session_number: number | null;
  content: string; hypothesis: string | null; next_session_plan: string | null;
  interventions: string | null; ai_hypothesis: string | null; mood: number | null;
  clients: { name: string; initials: string | null; color: string | null; approach_label: string | null } | null;
};

const MOOD_LABELS: Record<number, { label: string; color: string; bg: string; emoji: string }> = {
  1: { label: "Muito difícil", color: "#DC2626", bg: "#FEE2E2", emoji: "😟" },
  2: { label: "Difícil",       color: "#EA580C", bg: "#FFEDD5", emoji: "😕" },
  3: { label: "Neutro",        color: "#CA8A04", bg: "#FEF9C3", emoji: "😐" },
  4: { label: "Produtivo",     color: "#16A34A", bg: "#DCFCE7", emoji: "🙂" },
  5: { label: "Excelente",     color: "#059669", bg: "#D1FAE5", emoji: "😊" },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function EvolutionsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [selected,   setSelected]   = useState<Evolution | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("evolutions")
      .select("*, clients(name, initials, color, approach_label)")
      .eq("therapist_id", user.id)
      .order("session_date", { ascending: false });
    setEvolutions((data ?? []) as unknown as Evolution[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const q = search.toLowerCase();
  const filtered = evolutions.filter(ev =>
    (ev.clients?.name ?? "").toLowerCase().includes(q) ||
    (ev.hypothesis ?? "").toLowerCase().includes(q) ||
    ev.content.toLowerCase().includes(q)
  );

  const withAI = evolutions.filter(e => e.ai_hypothesis).length;
  const clientsSet = new Set(evolutions.map(e => e.client_id)).size;

  const renderItem = ({ item }: { item: Evolution }) => {
    const mood = item.mood ? MOOD_LABELS[item.mood] : null;
    return (
      <TouchableOpacity style={s.evoCard} onPress={() => setSelected(item)} activeOpacity={0.75}>
        <View style={s.evoTop}>
          <View style={s.evoClientRow}>
            <View style={[s.avatar, { backgroundColor: item.clients?.color ?? "#C2542F" }]}>
              <Text style={s.avatarText}>{item.clients?.initials ?? item.clients?.name?.[0] ?? "?"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.evoClientName} numberOfLines={1}>{item.clients?.name ?? "Cliente"}</Text>
              <Text style={s.evoMeta} numberOfLines={1}>
                {fmtDate(item.session_date)}
                {item.session_number ? ` · Sessão #${item.session_number}` : ""}
              </Text>
            </View>
          </View>
          {mood && (
            <View style={[s.moodBadge, { backgroundColor: mood.bg }]}>
              <Text style={[s.moodText, { color: mood.color }]}>{mood.emoji} {mood.label}</Text>
            </View>
          )}
        </View>
        {item.hypothesis && (
          <Text style={s.evoHypothesis} numberOfLines={1}>Hipótese: {item.hypothesis}</Text>
        )}
        <Text style={s.evoContent} numberOfLines={2}>{item.content}</Text>
        {item.ai_hypothesis && (
          <View style={s.aiTag}><Ionicons name="sparkles" size={11} color="#7C3AED" /><Text style={s.aiTagText}>Hipótese IA gerada</Text></View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Evoluções</Text>
          <Text style={s.headerSub}>Registros clínicos pós-sessão</Text>
        </View>
      </View>

      <View style={s.statsRow}>
        <View style={s.statBox}><Text style={s.statValue}>{evolutions.length}</Text><Text style={s.statLabel}>Total</Text></View>
        <View style={s.statBox}><Text style={s.statValue}>{withAI}</Text><Text style={s.statLabel}>Com IA</Text></View>
        <View style={s.statBox}><Text style={s.statValue}>{clientsSet}</Text><Text style={s.statLabel}>Clientes</Text></View>
      </View>

      <View style={s.searchRow}>
        <Ionicons name="search" size={16} color={Colors.gray[400]} style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por cliente, hipótese ou conteúdo..."
          placeholderTextColor={Colors.gray[400]}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.brand[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={ev => ev.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.emptyText}>Nenhuma evolução encontrada.</Text>}
        />
      )}

      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <SafeAreaView style={s.safe}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={24} color={Colors.gray[700]} />
              </TouchableOpacity>
              <Text style={s.modalTitle} numberOfLines={1}>{selected.clients?.name ?? "Cliente"}</Text>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView contentContainerStyle={s.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={s.modalMeta}>
                <Text style={s.modalMetaText}>
                  {fmtDate(selected.session_date)}
                  {selected.session_number ? ` · Sessão #${selected.session_number}` : ""}
                  {selected.clients?.approach_label ? ` · ${selected.clients.approach_label}` : ""}
                </Text>
                {selected.mood && MOOD_LABELS[selected.mood] && (
                  <View style={[s.moodBadge, { backgroundColor: MOOD_LABELS[selected.mood].bg, marginTop: 8, alignSelf: "flex-start" }]}>
                    <Text style={[s.moodText, { color: MOOD_LABELS[selected.mood].color }]}>
                      {MOOD_LABELS[selected.mood].emoji} {MOOD_LABELS[selected.mood].label}
                    </Text>
                  </View>
                )}
              </View>

              <DetailSection icon="document-text" title="O que aconteceu na sessão">
                <Text style={s.detailText}>{selected.content}</Text>
              </DetailSection>

              <DetailSection icon="bulb" title="Hipótese clínica">
                <Text style={selected.hypothesis ? s.detailTextStrong : s.detailTextMuted}>
                  {selected.hypothesis || "Não registrada"}
                </Text>
              </DetailSection>

              <DetailSection icon="flag" title="Plano para próxima sessão">
                <Text style={selected.next_session_plan ? s.detailText : s.detailTextMuted}>
                  {selected.next_session_plan || "Não registrado"}
                </Text>
              </DetailSection>

              {selected.interventions && (
                <DetailSection icon="hand-left" title="Intervenções realizadas">
                  <Text style={s.detailText}>{selected.interventions}</Text>
                </DetailSection>
              )}

              {selected.ai_hypothesis && (
                <View style={s.aiBox}>
                  <View style={s.aiBoxHeader}>
                    <Ionicons name="sparkles" size={16} color="#7C3AED" />
                    <Text style={s.aiBoxTitle}>Hipótese gerada pela IA</Text>
                  </View>
                  <Text style={s.aiBoxText}>{selected.ai_hypothesis}</Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

function DetailSection({ icon, title, children }: { icon: React.ComponentProps<typeof Ionicons>["name"]; title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <View style={s.sectionIcon}><Ionicons name={icon} size={14} color={Colors.brand[500]} /></View>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.gray[50] },
  header:     { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  backBtn:    { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: Colors.ink },
  headerSub:  { fontSize: 12, color: Colors.gray[500] },
  statsRow:   { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 14 },
  statBox:    { flex: 1, backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 12, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statValue:  { fontSize: 18, fontWeight: "700", color: Colors.ink },
  statLabel:  { fontSize: 11, color: Colors.gray[500], marginTop: 1 },
  searchRow:  { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: Colors.ink },
  list:       { padding: 16, gap: 10 },
  emptyText:  { textAlign: "center", color: Colors.gray[400], marginTop: 40, fontSize: 14 },
  evoCard:    { backgroundColor: Colors.white, borderRadius: 16, padding: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  evoTop:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  evoClientRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  avatar:     { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  evoClientName: { fontSize: 14, fontWeight: "700", color: Colors.ink },
  evoMeta:    { fontSize: 11, color: Colors.gray[500], marginTop: 1 },
  moodBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  moodText:   { fontSize: 10, fontWeight: "700" },
  evoHypothesis: { fontSize: 12, fontWeight: "600", color: Colors.brand[600], marginBottom: 4 },
  evoContent: { fontSize: 12, color: Colors.gray[600], lineHeight: 17 },
  aiTag:      { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  aiTagText:  { fontSize: 10, color: "#7C3AED" },
  // Modal
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: Colors.ink, textAlign: "center", marginHorizontal: 8 },
  modalScroll: { padding: 20, paddingBottom: 40, gap: 12 },
  modalMeta:  { marginBottom: 4 },
  modalMetaText: { fontSize: 12, color: Colors.gray[500] },
  section:    { backgroundColor: Colors.white, borderRadius: 14, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.gray[50], backgroundColor: Colors.gray[50] },
  sectionIcon: { width: 22, height: 22, borderRadius: 7, backgroundColor: Colors.brand[50], alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: Colors.gray[600], textTransform: "uppercase", letterSpacing: 0.4 },
  sectionBody: { padding: 14 },
  detailText: { fontSize: 13, color: Colors.gray[700], lineHeight: 19 },
  detailTextStrong: { fontSize: 13, fontWeight: "700", color: Colors.brand[700] },
  detailTextMuted: { fontSize: 13, color: Colors.gray[400], fontStyle: "italic" },
  aiBox:      { backgroundColor: "#F5F0FF", borderWidth: 1, borderColor: "#D8C8FF", borderRadius: 14, padding: 14 },
  aiBoxHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  aiBoxTitle: { fontSize: 12, fontWeight: "700", color: "#6D28D9" },
  aiBoxText:  { fontSize: 13, color: Colors.gray[700], lineHeight: 19 },
});
