import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, ScrollView, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/colors";

type Client = {
  id: string; name: string; email: string | null; phone: string | null;
  status: string; approach_label: string | null; main_demand: string | null;
  total_sessions: number; created_at: string;
};

type Evolution = {
  id: string; session_date: string; content: string;
  mood: number | null; session_number: number | null;
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:   { label: "Ativo",     color: "#16A34A", bg: "#DCFCE7" },
  INACTIVE: { label: "Inativo",   color: "#6B7280", bg: "#F3F4F6" },
  WAITING:  { label: "Aguardando",color: "#D97706", bg: "#FEF3C7" },
};

const MOOD_LABEL = ["", "Muito difícil", "Difícil", "Neutro", "Produtivo", "Excelente"];
const MOOD_COLOR = ["", "#EF4444", "#F97316", "#EAB308", "#3B82F6", "#22C55E"];

export default function ClientsScreen() {
  const { user } = useAuthStore();
  const [clients, setClients]   = useState<Client[]>([]);
  const [filtered, setFiltered] = useState<Client[]>([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Client | null>(null);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [evoLoading, setEvoLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("id, name, email, phone, status, approach_label, main_demand, total_sessions, created_at")
      .eq("therapist_id", user.id)
      .order("name");
    setClients((data ?? []) as Client[]);
    setFiltered((data ?? []) as Client[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(clients.filter(c => c.name.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q)));
  }, [search, clients]);

  async function openClient(c: Client) {
    setSelected(c);
    setEvoLoading(true);
    const { data } = await supabase
      .from("evolutions")
      .select("id, session_date, content, mood, session_number")
      .eq("client_id", c.id)
      .order("session_date", { ascending: false })
      .limit(20);
    setEvolutions((data ?? []) as Evolution[]);
    setEvoLoading(false);
  }

  async function toggleStatus(c: Client) {
    const next = c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await supabase.from("clients").update({ status: next }).eq("id", c.id);
    await load();
    if (selected?.id === c.id) setSelected({ ...c, status: next });
  }

  const renderClient = ({ item }: { item: Client }) => {
    const st = STATUS_MAP[item.status] ?? STATUS_MAP.INACTIVE;
    return (
      <TouchableOpacity style={s.clientCard} onPress={() => openClient(item)} activeOpacity={0.7}>
        <View style={s.clientAvatar}>
          <Text style={s.clientAvatarText}>{item.name[0]?.toUpperCase()}</Text>
        </View>
        <View style={s.clientInfo}>
          <Text style={s.clientName} numberOfLines={1}>{item.name}</Text>
          <Text style={s.clientSub} numberOfLines={1}>{item.approach_label ?? "Abordagem não definida"}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: st.bg }]}>
          <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Pacientes</Text>
        <Text style={s.count}>{clients.length} total</Text>
      </View>

      {/* Busca */}
      <View style={s.searchRow}>
        <Ionicons name="search" size={16} color={Colors.gray[400]} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar paciente..."
          placeholderTextColor={Colors.gray[400]}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.brand[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => c.id}
          renderItem={renderClient}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <Text style={s.emptyText}>Nenhum paciente encontrado.</Text>
          }
        />
      )}

      {/* Modal de detalhe */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <SafeAreaView style={s.safe}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={24} color={Colors.gray[700]} />
              </TouchableOpacity>
              <Text style={s.modalTitle} numberOfLines={1}>{selected.name}</Text>
              <TouchableOpacity onPress={() => Alert.alert("Status", "Alterar status?", [
                { text: "Cancelar", style: "cancel" },
                { text: selected.status === "ACTIVE" ? "Inativar" : "Ativar", onPress: () => toggleStatus(selected) },
              ])}>
                <Ionicons name="ellipsis-horizontal" size={22} color={Colors.gray[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={s.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Info card */}
              <View style={s.infoCard}>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Abordagem</Text>
                  <Text style={s.infoValue}>{selected.approach_label ?? "—"}</Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Demanda principal</Text>
                  <Text style={s.infoValue}>{selected.main_demand ?? "—"}</Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Total de sessões</Text>
                  <Text style={s.infoValue}>{selected.total_sessions}</Text>
                </View>
                {selected.email && (
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>E-mail</Text>
                    <Text style={s.infoValue}>{selected.email}</Text>
                  </View>
                )}
              </View>

              <Text style={s.sectionTitle}>Evoluções recentes</Text>

              {evoLoading ? (
                <ActivityIndicator color={Colors.brand[500]} />
              ) : evolutions.length === 0 ? (
                <Text style={s.emptyText}>Nenhuma evolução registrada.</Text>
              ) : (
                evolutions.map(e => (
                  <View key={e.id} style={s.evoCard}>
                    <View style={s.evoHeader}>
                      <Text style={s.evoDate}>{new Date(e.session_date).toLocaleDateString("pt-BR")}</Text>
                      {e.mood && (
                        <View style={[s.moodBadge, { backgroundColor: MOOD_COLOR[e.mood] + "22" }]}>
                          <Text style={[s.moodText, { color: MOOD_COLOR[e.mood] }]}>{MOOD_LABEL[e.mood]}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.evoContent} numberOfLines={4}>{e.content}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.gray[50] },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title:       { fontSize: 24, fontWeight: "700", color: Colors.ink },
  count:       { fontSize: 13, color: Colors.gray[500] },
  searchRow:   { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, marginHorizontal: 20, marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.gray[200], paddingHorizontal: 12 },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: Colors.ink },
  list:        { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  clientCard:  { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, borderRadius: 14, padding: 14, gap: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  clientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brand[100], alignItems: "center", justifyContent: "center" },
  clientAvatarText: { fontSize: 18, fontWeight: "700", color: Colors.brand[600] },
  clientInfo:  { flex: 1 },
  clientName:  { fontSize: 15, fontWeight: "600", color: Colors.ink },
  clientSub:   { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:   { fontSize: 11, fontWeight: "600" },
  emptyText:   { textAlign: "center", color: Colors.gray[400], marginTop: 40, fontSize: 14 },
  // Modal
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  modalTitle:  { flex: 1, fontSize: 17, fontWeight: "700", color: Colors.ink, textAlign: "center", marginHorizontal: 8 },
  modalScroll: { padding: 20, paddingBottom: 40 },
  infoCard:    { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 20, gap: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  infoRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  infoLabel:   { fontSize: 13, color: Colors.gray[500], flex: 1 },
  infoValue:   { fontSize: 13, fontWeight: "600", color: Colors.ink, flex: 1, textAlign: "right" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.ink, marginBottom: 12 },
  evoCard:     { backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  evoHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  evoDate:     { fontSize: 12, fontWeight: "600", color: Colors.gray[500] },
  moodBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  moodText:    { fontSize: 11, fontWeight: "600" },
  evoContent:  { fontSize: 13, color: Colors.gray[700], lineHeight: 20 },
});
