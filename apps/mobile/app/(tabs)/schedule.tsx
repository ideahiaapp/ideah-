import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/colors";
import { HamburgerMenu } from "@/components/HamburgerMenu";

type Session = {
  id: string; date: string; start_time: string; duration: number;
  status: string; notes: string | null; price: number | null;
  client: { name: string } | null;
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>["name"] }> = {
  SCHEDULED:  { label: "Agendada",   color: "#2563EB", bg: "#DBEAFE", icon: "calendar" },
  COMPLETED:  { label: "Realizada",  color: "#16A34A", bg: "#DCFCE7", icon: "checkmark-circle" },
  CANCELLED:  { label: "Cancelada",  color: "#DC2626", bg: "#FEE2E2", icon: "close-circle" },
  NO_SHOW:    { label: "Faltou",     color: "#D97706", bg: "#FEF3C7", icon: "alert-circle" },
};

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

export default function ScheduleScreen() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<"upcoming" | "all">("upcoming");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from("sessions")
      .select("id, date, start_time, duration, status, notes, price, client:clients(name)")
      .eq("therapist_id", user.id)
      .order("date", { ascending: false })
      .order("start_time", { ascending: false });

    if (filter === "upcoming") {
      query = query.gte("date", new Date().toISOString().slice(0, 10));
    }

    const { data } = await query.limit(50);
    setSessions((data ?? []) as unknown as Session[]);
    setLoading(false);
  }, [user, filter]);

  useEffect(() => { load(); }, [load]);

  const renderSession = ({ item }: { item: Session }) => {
    const st = STATUS_MAP[item.status] ?? STATUS_MAP.SCHEDULED;
    return (
      <View style={s.card}>
        <View style={s.cardLeft}>
          <View style={[s.statusDot, { backgroundColor: st.color }]} />
        </View>
        <View style={s.cardBody}>
          <View style={s.cardTop}>
            <Text style={s.clientName} numberOfLines={1}>{item.client?.name ?? "Cliente"}</Text>
            <View style={[s.badge, { backgroundColor: st.bg }]}>
              <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>
          <View style={s.cardMeta}>
            <Ionicons name="calendar-outline" size={13} color={Colors.gray[400]} />
            <Text style={s.metaText}>{formatDate(item.date)}</Text>
            <Ionicons name="time-outline" size={13} color={Colors.gray[400]} style={{ marginLeft: 10 }} />
            <Text style={s.metaText}>{item.start_time?.slice(0, 5)} · {item.duration}min</Text>
          </View>
          {item.price != null && (
            <Text style={s.price}>R$ {item.price.toFixed(2).replace(".", ",")}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <HamburgerMenu />
          <Text style={s.title}>Agenda</Text>
        </View>
      </View>

      {/* Filtro */}
      <View style={s.filterRow}>
        {(["upcoming", "all"] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterBtn, filter === f && s.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>
              {f === "upcoming" ? "Próximas" : "Todas"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.brand[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={s => s.id}
          renderItem={renderSession}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="calendar-outline" size={48} color={Colors.gray[300]} />
              <Text style={s.emptyText}>Nenhuma sessão encontrada.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.gray[50] },
  header:     { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  title:      { fontSize: 24, fontWeight: "700", color: Colors.ink },
  filterRow:  { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 12, marginTop: 12 },
  filterBtn:  { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.gray[200] },
  filterActive: { backgroundColor: Colors.brand[500], borderColor: Colors.brand[500] },
  filterText: { fontSize: 13, fontWeight: "600", color: Colors.gray[500] },
  filterTextActive: { color: Colors.white },
  list:       { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  card:       { flexDirection: "row", backgroundColor: Colors.white, borderRadius: 14, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardLeft:   { width: 4, backgroundColor: Colors.brand[300] },
  cardBody:   { flex: 1, padding: 14, gap: 6 },
  cardTop:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  clientName: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.ink, marginRight: 8 },
  badge:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText:  { fontSize: 11, fontWeight: "600" },
  cardMeta:   { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText:   { fontSize: 12, color: Colors.gray[500] },
  price:      { fontSize: 13, fontWeight: "600", color: Colors.green },
  statusDot:  { width: 4, flex: 1 },
  empty:      { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText:  { fontSize: 14, color: Colors.gray[400] },
});
